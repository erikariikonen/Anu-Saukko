const axios = require('axios');

const getTodaysFood = async (restaurant) => {
    try {
        let apiUrl;

        // API urlit
        if (restaurant.toLowerCase() === 'signe') {
            apiUrl = 'http://fi.jamix.cloud/apps/menuservice/rest/haku/menu/97325/7?lang=fi';
        } else if (restaurant.toLowerCase() === 'ellen') {
            apiUrl = 'http://fi.jamix.cloud/apps/menuservice/rest/haku/menu/97325/6?lang=fi';
        } else {
            throw new Error('Invalid restaurant. Please specify "signe" or "ellen".');
        }

        const response = await axios.get(apiUrl);

        if (!response.data || !response.data[0] || !response.data[0].menuTypes) {
            console.error(`Error in Jamix API response: Unexpected or empty menu data for ${restaurant}.`);
            return '';
        }

        const currentDayOfWeek = new Date().getDay();

        const todayMenu = response.data[0].menuTypes[0].menus.find(menu => {
            const availableWeekdays = menu.days.map(day => day.weekday);

            return availableWeekdays.includes(currentDayOfWeek);
        });

        if (!todayMenu) {
            console.error(`Error in Jamix API response: Menu for ${restaurant} is empty today.`);
            return '';
        }

        const mealOptions = todayMenu.days.find(day => day.weekday === currentDayOfWeek).mealoptions;

        if (!mealOptions || mealOptions.length === 0) {
            return '';
        }

        const todayFood = mealOptions.map(option => {
            const menuItemsWithDiets = option.menuItems.map(item => {
                const diets = item.diets ? ` (${item.diets.replace(/\s/g, '')})` : '';
                const itemWithDiets = `**${item.name}**${diets}`;
                return itemWithDiets;
            });
            return menuItemsWithDiets.join('\n');
        }).join('\n\n');

        return todayFood;
    } catch (error) {
        console.error('Error fetching data from Jamix API:', error);
        return '';
    }
};

module.exports = { getTodaysFood };
