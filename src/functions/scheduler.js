const moment = require('moment-timezone');
const { EmbedBuilder } = require('discord.js');
const { getRandomColor } = require('./randomColor.js');
const { getTodaysFood } = require('../APIs/jamix/jamix.js');
const { searchImage } = require('../APIs/bing/bingImageSearch.js');


async function sendMorningMessage(client, yleinenChannel) {
    const channel = client.channels.cache.get(yleinenChannel);
    const nukutti = 'https://media.discordapp.net/attachments/817419166281760799/839931656323596340/image0.gif';

    if (channel) {
        channel.send({ files:[nukutti] });
        console.log('Sent morning message.');
    } else {
        console.error('Cannot send morning message.');
    }
}

async function sendLunchEmbed(client, yleinenChannel, bingAPI) {
    const channel = client.channels.cache.get(yleinenChannel);

    try {
        const signeMenu = await getTodaysFood('signe');
        const ellenMenu = await getTodaysFood('ellen');
    
        if (channel) {
            if (signeMenu.trim() !== '') {
                const firstMenuItem = signeMenu.split('\n')[0];
                const cleanedQuery = firstMenuItem.replace(/\*\*|\([^)]*\)/g, '').trim();

                console.log('Cleaned Query:', cleanedQuery);

                let imageSearchUrl;
                try {
                    imageSearchUrl = await searchImage(cleanedQuery, bingAPI);
                    console.log('Bing Image Search Result:', imageSearchUrl);
                } catch (searchError) {
                    console.error('Error in image search:', searchError.message);
                }

                const embed = new EmbedBuilder()
                    .setTitle('Anu S:n antimet tänään 😎')
                    .addFields(
                        { name: '**`Signe`**', value: signeMenu + '\n\nhttps://tinyurl.com/signemenu' },
                        { name: '**`Ellen`**', value: ellenMenu + '\n\nhttps://tinyurl.com/ellenmenu' },
                    )
                    .setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
                    .setImage(imageSearchUrl || 'https://cdn-wp.valio.fi/valio-wp-network/sites/2/2023/04/41920-sitruunainen-uunikala.jpeg')
                    .setColor(getRandomColor());
                channel.send({ embeds: [embed] });
                console.log('Sent lunch embed.');
            } else {
                console.error('Signe menu is empty.');
            }
        } else {
            console.error('Cannot send lunch embed.');
        }
    } catch (error) {
        console.error('Error in sendLunchEmbed:', error);
    }
}

function scheduleMessage(client, yleinenChannel, bingAPI) {
    const helsinkiTimeZone = 'Europe/Helsinki';
    const now = moment().tz(helsinkiTimeZone);

    let morningSchedule = moment().tz(helsinkiTimeZone).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    if (now.isAfter(morningSchedule)) {
        morningSchedule.add(1, 'day');
    }
    const delayMorning = morningSchedule.diff(now);

    setTimeout(() => {
        sendMorningMessage(client, yleinenChannel);
        
        if (now.day() >= 1 && now.day() <= 5) {
            scheduleLunchMessage(client, yleinenChannel, bingAPI);
        } else {
            console.log("It's the weekend, no lunch today!");
            scheduleNextMessage(client, yleinenChannel, bingAPI);
        }
    }, delayMorning);
}

function scheduleLunchMessage(client, yleinenChannel, bingAPI) {
    const helsinkiTimeZone = 'Europe/Helsinki';
    const now = moment().tz(helsinkiTimeZone);

    let lunchSchedule = moment().tz(helsinkiTimeZone).set({ hour: 9, minute: 30, second: 0, millisecond: 0 });
    if (now.isAfter(lunchSchedule)) {
        lunchSchedule.add(1, 'day');
    }
    const delayLunch = lunchSchedule.diff(now);

    setTimeout(() => {
        sendLunchEmbed(client, yleinenChannel, bingAPI);
        scheduleNextMessage(client, yleinenChannel, bingAPI);
    }, delayLunch);
}

function scheduleNextMessage(client, yleinenChannel, bingAPI) {
    const now = moment().tz('Europe/Helsinki');
    const nextDay = now.add(1, 'day').set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    const delayNextDay = nextDay.diff(now);

    setTimeout(() => {
        scheduleMessage(client, yleinenChannel, bingAPI);
    }, delayNextDay);
}

function sendFridayMessage(client, yleinenChannel) {
    const channel = client.channels.cache.get(yleinenChannel);

    if (channel) {
        const fridayVideo = '../media/video/Perjantai_Video.mp4';
        channel.send({ content: '@everyone', files: [fridayVideo] });
        console.log('Sent Friday video.');
    } else {
        console.error('Cannot send Friday video.');
    }
}

function scheduleFridayMessage(client, yleinenChannel) {
    const helsinkiTimeZone = 'Europe/Helsinki';
    const now = moment().tz(helsinkiTimeZone);

    if (now.day() === 5 && now.isAfter(moment().tz(helsinkiTimeZone).set({ hour: 13, minute: 20, second: 0, millisecond: 0 }))) {
        sendFridayMessage(client, yleinenChannel);
    } else {
        const nextFriday = moment().tz(helsinkiTimeZone).day(5).set({ hour: 13, minute: 20, second: 0, millisecond: 0 });
        const delayNextFriday = nextFriday.diff(now);

        setTimeout(() => {
            sendFridayMessage(client, yleinenChannel);
            scheduleFridayMessage(client, yleinenChannel);
        }, delayNextFriday);
    }
}

module.exports = { scheduleMessage, scheduleFridayMessage };