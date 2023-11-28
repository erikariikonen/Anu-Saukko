const moment = require('moment-timezone');
const { getTodaysFood } = require('../jamix/jamix.js');
const { EmbedBuilder } = require('discord.js');
const { getRandomColor } = require('./randomColor.js')

async function scheduleMessage(client) {
    const helsinkiTimeZone = 'Europe/Helsinki';
    const now = moment().tz(helsinkiTimeZone);
    const yleinenChannel = client.channels.cache.get(process.env.YLEINEN_ID);
    const signeMenu = await getTodaysFood('signe');
    const ellenMenu = await getTodaysFood('ellen');

    let aamu = moment().tz(helsinkiTimeZone).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    let lounas = moment().tz(helsinkiTimeZone).set({ hour: 14, minute: 37, second: 0, millisecond: 0 });

    if (now.day() === 6 || now.day() === 0) {
        console.log("It's the weekend, skipping lounas message.");
        return;
    }

    if (now.isAfter(aamu)) {
        aamu.add(1, 'day');
    }

    if (now.isAfter(lounas) && now.day() !== 5) {
        lounas.add(1, 'day');
    }

    const delayaamu = aamu.diff(now);
    const delaylounas = lounas.diff(now);

    setTimeout(() => {
        if (yleinenChannel) {
            yleinenChannel.send('@everyone https://media.discordapp.net/attachments/817419166281760799/839931656323596340/image0.gif');
        } else {
            console.error('Cannot send aamu');
        }
        
    }, delayaamu);

    setTimeout(() => {
        if (yleinenChannel) {
            const embed = new EmbedBuilder()
            .setTitle('Anu S:n antimet tänään 😎')
            .addFields(
                { name: '**`Signe`**', value: signeMenu + '\n\nhttps://tinyurl.com/signemenu' },
                { name: '**`Ellen`**', value: ellenMenu + '\n\nhttps://tinyurl.com/ellenmenu' }
            )
            .setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
            .setImage('https://cdn-wp.valio.fi/valio-wp-network/sites/2/2023/04/41920-sitruunainen-uunikala.jpeg')
            .setColor(getRandomColor());
            yleinenChannel.send({ content:'@everyone', embeds: [embed] });
        } else {
            console.error('Cannot send lounas');
        }

        scheduleMessage(client);
    }, delaylounas);

}

module.exports = {scheduleMessage};