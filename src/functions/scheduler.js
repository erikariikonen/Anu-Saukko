const moment = require('moment-timezone');

function scheduleMessage(client) {
    const helsinkiTimeZone = 'Europe/Helsinki';
    const now = moment().tz(helsinkiTimeZone);
    const yleinenChannel = client.channels.cache.get(process.env.YLEINEN_ID);

    let aamu = moment().tz(helsinkiTimeZone).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    let lounas = moment().tz(helsinkiTimeZone).set({ hour: 9, minute: 30, second: 0, millisecond: 0 });

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
            console.error('Cannot send message');
        }
        
    }, delayaamu);

    setTimeout(() => {
        if (yleinenChannel) {
            yleinenChannel.send('@everyone\nSigne ruokalista: https://fi.jamix.cloud/apps/menu/?anro=97325&k=7&mt=4\nEllen ruokalista: https://fi.jamix.cloud/apps/menu/?anro=97325&k=6&mt=4');
        } else {
            console.error('Cannot send message');
        }

        scheduleMessage(client);
    }, delaylounas);

}

module.exports = {scheduleMessage};