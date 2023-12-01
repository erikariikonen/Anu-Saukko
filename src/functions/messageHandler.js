const countTokens = require('../openai/count-tokens.js');
const openai = require('../openai/openai.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState } = require('@discordjs/voice');
const path = require('path');
const { RepeatMode } = require("discord-music-player");
const fs = require('fs');
const { getTodaysFood } = require('../jamix/jamix.js');
const { EmbedBuilder } = require('discord.js');
const { getRandomColor } = require('./randomColor.js');
const axios = require('axios');



async function handleMessageCreate(client, message) {
    const delay = 1000;

    if (message.author === message.client.user) {
        return;
    }

    let lastRequestTime = null;
    const requestLimit = 500; // API requests per minute
    let requestCount = 0;

    const gptMessages = [];
    const ignoredPatterns = [
        /^anu pingaa kaikki$/i,
        /^anu saako/i,
        /^anu debug stop$/i,
        /^anu sano/i,
        /^anu soita/i,
        /^anu skippaa$/i,
        /^anu stoppaa$/i,
        /^anu skippaa kaikki$/i,
        /^anu soittolista$/i,
        /^anu mitä soitat$/i,
        /^anu ruokalista/i,
        /^anu help$/i,
        /^anu mitä osaat sanoa$/i,
        /^anu poistaviestit$/i,
        /^anu !kys!!$/i,
    ];
    
    const isIgnoredMessage = ignoredPatterns.some(pattern => pattern.test(message.content));
    

    if (message.content.toLowerCase() === 'anu help') {
        setTimeout(() => {
            message.reply(
                'Annan muutaman esimerkin suosituista "anu" alkuisista kommennoista:\n\n1. 😈 - anu x\n2. 🤪 - anu pingaa kaikki\n3. 🥴 - anu ruokalista | *signe*, *ellen*\n4. 🤙 - anu saako x\n5. 🤔 - anu sano x\n6. 🙄 - anu mitä osaat sanoa\n7. 😂 - anu soita x/linkki\n8. 😭 - anu skippaa\n9. 🔥 - anu skippaa kaikki\n10. 💯 - anu stoppaa'
                );
        }, delay);
    }

    if (message.content.toLowerCase() === 'anu pingaa kaikki') {
        setTimeout(() => {
            message.reply('@everyone');
        }, delay);
    }


    const regex = /^anu saako (.+)$/i;
    const match = message.content.toLowerCase().match(regex);

    if (match) {
        const responses = ['Kyllä!! 😊😊', 'Minun mielestä saa 🤗', 'Salee 😎', 'Jos kysyt nätisti 👉👈', 'Ei!!! Grr 😡', 'Et uskaltaisi!! Nössö 😈', 'En suosittele ✋👮', 'Ehkäpä 😉', 'Ei saa!! 😔😭','Riippuu siitä, kuka kysyy 🤭'];
        const randomIndex = Math.floor(Math.random() * responses.length);
        const randomResponse = responses[randomIndex];

        setTimeout(() => {
            message.reply(randomResponse);
        }, delay);
    }

    let hasRepliedToAnu = false;

    const isAnuMessage = message.content.toLowerCase().startsWith('anu ') && !isIgnoredMessage;
    
    if (isAnuMessage && !hasRepliedToAnu) {

        if (lastRequestTime !== null) {
            const currentTime = new Date();
            const timeDifference = currentTime - lastRequestTime;
            const timeRemaining = 60000 - timeDifference; // 60 seconds in milliseconds
    
            if (timeRemaining > 0) {
                console.log(`Rate limit reached. Pausing for ${timeRemaining / 1000} seconds.`);
                return; // Pause the script
            }
        }

        const messages = (
            await message.channel.messages.fetch({ limit: 25 })
        ).reverse();
    
        const maxTokens = 4096; // gpt-3.5-turbo
        let totalTokens = 0;
    
        const anuMessages = messages.filter((msg) => msg.content.toLowerCase().startsWith('anu ') && !isIgnoredMessage);
    
        anuMessages.forEach((message) => {
            if (!ignoredPatterns.some(pattern => pattern.test(message.content))) {
                const tokens = countTokens(message.content);
    
                if (totalTokens + tokens < maxTokens) {
                    totalTokens += tokens;
    
                    gptMessages.push({
                        role: message.author.bot ? 'assistant' : 'user',
                        content: message.content,
                    });
                }
            }
        });
    
        let response = await openai(gptMessages);

        requestCount += 1;
        lastRequestTime = new Date();

        if (requestCount >= requestLimit) {
            console.log(`Rate limit reached. Pausing for 60 seconds.`);
            requestCount = 0;
            lastRequestTime = new Date();
            return; // Pause the script
        }

        console.log(gptMessages, '\x1b[33m Anu sanoi: ' + response.toString() + '\x1b[0m');

        message.reply({
            content: response,
        });

        hasRepliedToAnu = true;
    }

    if (message.content === 'anu debug stop') {
        gptMessages.length = 0;
        message.reply('Peräruiske annettu 🥶');
        return;
    }

    if (message.content.toLowerCase().startsWith('anu sano')) {
        const command = message.content.slice('anu sano'.length).trim().toLowerCase();
        const mp3Path = path.join(__dirname, '..', 'media', `${command}.mp3`);

        if (!message.member.voice?.channel) {
            return message.channel.send('Mene äänikanavaan ensin! En voi tulla sanomaan asiasta muuten.');
        }

        const connection = joinVoiceChannel({
            channelId: message.member.voice.channelId,
            guildId: message.guildId,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        const speech = createAudioPlayer();
        const resource = createAudioResource(mp3Path);

        connection.subscribe(speech);
        speech.play(resource);

        message.reply('Okei! Tulen sanomaan asiasta. 👀')

        speech.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle') {
                connection.destroy();
            }
        });
    } else if (message.content.toLowerCase().startsWith('anu mitä osaat sanoa')) {
        const mediaFolder = path.join(__dirname, '..', 'media');
    
        fs.readdir(mediaFolder, (err, files) => {
            if (err) {
                console.error('Error reading media folder:', err);
                return message.channel.send('En ole varma tällä hetkelle. Koita uudestaan myöhemmin!');
            }
    
            const mp3Files = files.filter(file => file.endsWith('.mp3'));
            if (mp3Files.length === 0) {
                return message.channel.send('En osaa sanoa mitään!');
            }
    
            const fileNames = mp3Files.map(file => file.replace('.mp3', ''));
            const replyMessage = `Voin sanoa seuraavat asiat: ${fileNames.join(', ')}.`;
            setTimeout (() => {
            message.channel.send(replyMessage);
            }, delay);
        });
    }

    if (message.content.toLowerCase().startsWith('anu')) {
        const args = message.content.slice('anu'.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        let guildQueue = client.player.getQueue(message.guild.id);

        if(command === 'soita') {
            let queue = client.player.createQueue(message.guild.id);
            await queue.join(message.member.voice.channel);
            let song = await queue.play(args.join(' ')).catch(err => {
                console.log(err);
                if(!guildQueue)
                    queue.stop();
            });

        }

        if(command === 'soittolista') {
            let queue = client.player.createQueue(message.guild.id);
            await queue.join(message.member.voice.channel);
            let song = await queue.play(args.join(' ')).catch(err => {
                console.log(err);
                if(!guildQueue)
                    queue.stop();
            });

        }

        if(command === 'skippaa') {
            guildQueue.skip();
        }

        if (command === 'stoppaa') {
            guildQueue.stop();
        }

        if (command === 'skippaa kaikki') {
            guildQueue.clearQueue();
        }   
        
        if (command === '!kys!!') {
            message.reply ('Ei vittu sit 🤬🤬🤬').then(() => {

                client.destroy();
                process.exit();

            }).catch(error => { 
                console.error(`Anu is immortal\n${error}`); 
            });
        }
    }

    if (message.content.toLowerCase().startsWith('anu ruokalista')) {
        const args = message.content.slice('anu ruokalista'.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const signeMenu = await getTodaysFood('signe');
        const ellenMenu = await getTodaysFood('ellen');

        if(!command) {
            const embed = new EmbedBuilder()
            .setTitle('Anu S:n antimet tänään 😎')
            .addFields(
                { name: '**`Signe`**', value: signeMenu + '\n\nhttps://tinyurl.com/signemenu' },
                { name: '**`Ellen`**', value: ellenMenu + '\n\nhttps://tinyurl.com/ellenmenu' }
            )
            .setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
            .setImage('https://cdn-wp.valio.fi/valio-wp-network/sites/2/2023/04/41920-sitruunainen-uunikala.jpeg')
            .setColor(getRandomColor());
            message.reply({ embeds: [embed] });
        }

        if(command === 'signe') {
            const embed = new EmbedBuilder()
            .setTitle('Anu S:n antimet tänään 😎')
            .addFields({ name: '**`Signe`**', value: signeMenu + '\n\nhttps://tinyurl.com/signemenu' })
            .setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
            .setImage('https://www.salpaus.fi/wp-content/uploads/2022/02/Signe-900x900-1-scaled.jpg')
            .setColor(getRandomColor())
            message.reply({ embeds: [embed] });
        }
        
        if(command === 'ellen') {
            const embed = new EmbedBuilder()
            .setTitle('Anu S:n antimet tänään 😎')
            .addFields({ name: '**`Ellen`**', value: ellenMenu + '\n\nhttps://tinyurl.com/ellenmenu' })
            .setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
            .setImage('https://www.salpaus.fi/wp-content/uploads/2017/10/Kampus1profiili-900x900.jpg')
            .setColor(getRandomColor());
        message.reply({ embeds: [embed] });
        }
        
    }

    const randomNum = Math.random();
    const reactionProbability = 0.01;

    if (randomNum < reactionProbability) {
        // list
        const emojis = [
            '😄', '😍', '🎉', '👍', '🌟', '❤️', '🚀', '🐱', '🍕', '🎶',
            '🔥', '🌈', '👏', '💡', '🍦', '🎨', '🎸', '💻', '🦦',
        ];

        // Face emojis (U+1F600 to U+1F64F)
        for (let i = 0x1F600; i <= 0x1F64F; i++) {
            emojis.push(String.fromCodePoint(i));
        }

        // Hand emojis (U+1F91A to U+1F93E)
        for (let i = 0x1F91A; i <= 0x1F93E; i++) {
            emojis.push(String.fromCodePoint(i));
        }

        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        message.react(randomEmoji)
            .then(() => console.log(`Reacted with ${randomEmoji} to ${message.author.tag}'s message: ${message.content}`))
            .catch(console.error);
    }
}

module.exports = { handleMessageCreate, };
