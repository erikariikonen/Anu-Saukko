const moment = require('moment-timezone');
const { EmbedBuilder } = require('discord.js');
const { getRandomColor } = require('./randomColor.js');
const { getTodaysFood } = require('../jamix/jamix.js');

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

async function sendLunchEmbed(client, yleinenChannel) {
    const channel = client.channels.cache.get(yleinenChannel);
    const signeMenu = await getTodaysFood('signe');
    const ellenMenu = await getTodaysFood('ellen');
    if (channel) {
        const embed = new EmbedBuilder()
            .setTitle('Anu S:n antimet tänään 😎')
            .addFields(
                { name: '**`Signe`**', value: signeMenu + '\n\nhttps://tinyurl.com/signemenu' },
                { name: '**`Ellen`**', value: ellenMenu + '\n\nhttps://tinyurl.com/ellenmenu' },
            )
            .setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
            .setImage('https://cdn-wp.valio.fi/valio-wp-network/sites/2/2023/04/41920-sitruunainen-uunikala.jpeg')
            .setColor(getRandomColor());
        channel.send({ embeds: [embed] });
        console.log('Sent lunch embed.');
    } else {
        console.error('Cannot send lunch embed.');
    }
}

function scheduleMessage(client, yleinenChannel) {
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
            scheduleLunchMessage(client, yleinenChannel);
        } else {
            console.log("It's the weekend, no lunch today!");
            scheduleNextMessage(client, yleinenChannel);
        }
    }, delayMorning);
}

function scheduleLunchMessage(client, yleinenChannel) {
    const helsinkiTimeZone = 'Europe/Helsinki';
    const now = moment().tz(helsinkiTimeZone);

    let lunchSchedule = moment().tz(helsinkiTimeZone).set({ hour: 9, minute: 30, second: 0, millisecond: 0 });
    if (now.isAfter(lunchSchedule)) {
        lunchSchedule.add(1, 'day');
    }
    const delayLunch = lunchSchedule.diff(now);

    setTimeout(() => {
        sendLunchEmbed(client, yleinenChannel);
        scheduleNextMessage(client, yleinenChannel);
    }, delayLunch);
}

function scheduleNextMessage(client, yleinenChannel) {
    const now = moment().tz('Europe/Helsinki');
    const nextDay = now.add(1, 'day').set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    const delayNextDay = nextDay.diff(now);

    setTimeout(() => {
        scheduleMessage(client, yleinenChannel);
    }, delayNextDay);
}

module.exports = { scheduleMessage };