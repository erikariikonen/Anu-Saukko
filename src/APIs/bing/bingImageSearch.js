const axios = require('axios');

async function searchImage(query, bingAPI) {
    try {
        const response = await axios.get(`https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query)}`, {
            headers: {
                'Ocp-Apim-Subscription-Key': bingAPI,
            },
        });

        if (response.data && response.data.value && response.data.value.length > 0) {
            const imageUrl = response.data.value[0]?.thumbnailUrl;
            return imageUrl;
        } else {
            console.error('Bing Image Search did not return valid results:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Error performing image search:', error.message);
        console.error('Error details:', error.response ? error.response.data : 'No response data');
        return null;
    }
}

module.exports = { searchImage };
