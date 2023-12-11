const countTokens = require('../APIs/openai/count-tokens.js');
const openai = require('../APIs/openai/openai.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState } = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');
const { getTodaysFood } = require('../APIs/jamix/jamix.js');
const { EmbedBuilder } = require('discord.js');
const { getRandomColor } = require('./randomColor.js');
const { searchImage } = require('../APIs/bing/bingImageSearch.js');



async function handleMessageCreate(client, message, bingAPI) {
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
                'Annan muutaman esimerkin suosituista "anu" alkuisista kommennoista:\n\n1. 😈 - anu *viesti*\n2. 🤪 - anu pingaa kaikki\n3. 🥴 - anu ruokalista | *signe*, *ellen*\n4. 🤙 - anu saako *viesti*\n5. 🤔 - anu sano *mitä osaat sanoa listalta*\n6. 🙄 - anu mitä osaat sanoa\n7. 😂 - anu soita *laulun nimi/linkki*\n8. 😭 - anu skippaa\n9. 🔥 - anu skippaa kaikki\n10. 💯 - anu stoppaa'
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

    const isAnuMessage = message.content.toLowerCase().startsWith('anu ') && !isIgnoredMessage && !(message.author === message.client.user);
    
    if (isAnuMessage && !hasRepliedToAnu) {

        if (lastRequestTime !== null) {
            const currentTime = new Date();
            const timeDifference = currentTime - lastRequestTime;
            const timeRemaining = 60000 - timeDifference;
    
            if (timeRemaining > 0) {
                console.log(`Rate limit reached. Pausing for ${timeRemaining / 1000} seconds.`);
                return;
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
            return;
        }

        console.log(gptMessages, '\x1b[33m Anu sanoi: ' + response.toString() + '\x1b[0m');


        const responseContent = response.toString();
        const responseChunks = splitTextIntoChunks(responseContent);

        for (const chunk of responseChunks) {
            message.reply({
                content: chunk,
            });
        }

        hasRepliedToAnu = true;
        
        function splitTextIntoChunks(text) {
            const chunkSize = 2000;
            const chunks = [];
        
            for (let i = 0; i < text.length; i += chunkSize) {
                chunks.push(text.slice(i, i + chunkSize));
            }
        
            return chunks;
        }
    }

    if (message.content === 'anu debug stop') {
        gptMessages.length = 0;
        message.reply('Peräruiske annettu 🥶');
        return;
    }

    if (message.content.toLowerCase().startsWith('anu sano')) {
        const command = message.content.slice('anu sano'.length).trim().toLowerCase();
        const mp3Path = path.join(__dirname, '..', 'media', 'anusano', `${command}.mp3`);

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
        const mediaFolder = path.join(__dirname, '..', 'media', 'anusano');
    
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

        if (!command) {
            const menusToDisplay = [];
    
            if (signeMenu.trim() !== '') {
                menusToDisplay.push({
                    name: 'Signe',
                    value: signeMenu,
                    url: 'https://tinyurl.com/signemenu'
                });
            }
    
            if (ellenMenu.trim() !== '') {
                menusToDisplay.push({
                    name: 'Ellen',
                    value: ellenMenu,
                    url: 'https://tinyurl.com/ellenmenu'
                });
            }
    
            if (menusToDisplay.length > 0) {
                const firstMenuItem = menusToDisplay[0].value.split('\n')[0];
                const cleanedQuery = firstMenuItem.replace(/\*\*|\([^)]*\)/g, '').trim();
                let imageSearchUrl;
    
                try {
                    imageSearchUrl = await searchImage(cleanedQuery, bingAPI);
                    console.log('Bing Image Search Result:', imageSearchUrl);
                } catch (searchError) {
                    console.error('Error in image search:', searchError.message);
                }
    
                const embed = new EmbedBuilder()
                    .setTitle('Anu S:n antimet tänään 😎');
    
                menusToDisplay.forEach(menu => {
                    embed.addFields({ name: `**\`${menu.name}\`**`, value: menu.value + `\n\n${menu.url}` });
                });
    
                embed.setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
                    .setImage(imageSearchUrl || 'https://cdn-wp.valio.fi/valio-wp-network/sites/2/2023/04/41920-sitruunainen-uunikala.jpeg')
                    .setColor(getRandomColor());
    
                message.reply({ embeds: [embed] });
            } else {
                message.reply('Both menus are empty today.');
            }
        }

        if(command === 'signe') {
            if (signeMenu.trim() !== '') {
                const firstMenuItem = signeMenu.split('\n')[0];
                const cleanedQuery = firstMenuItem.replace(/\*\*|\([^)]*\)/g, '').trim();
                let imageSearchUrl;

                try {
                    imageSearchUrl = await searchImage(cleanedQuery, bingAPI);
                    console.log('Bing Image Search Result:', imageSearchUrl);
                } catch (searchError) {
                    console.error('Error in image search:', searchError.message);
                }

                const embed = new EmbedBuilder()
                .setTitle('Anu S:n antimet tänään 😎')
                .addFields({ name: '**`Signe`**', value: signeMenu + '\n\nhttps://tinyurl.com/signemenu' })
                .setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
                .setImage(imageSearchUrl || 'https://cdn-wp.valio.fi/valio-wp-network/sites/2/2023/04/41920-sitruunainen-uunikala.jpeg')
                .setColor(getRandomColor());
                message.reply({ embeds: [embed] });
            }
        }
        
        if(command === 'ellen') {
            if (ellenMenu.trim() !== '') {
                const firstMenuItem = ellenMenu.split('\n')[0];
                const cleanedQuery = firstMenuItem.replace(/\*\*|\([^)]*\)/g, '').trim();
                let imageSearchUrl;

                try {
                    imageSearchUrl = await searchImage(cleanedQuery, bingAPI);
                    console.log('Bing Image Search Result:', imageSearchUrl);
                } catch (searchError) {
                    console.error('Error in image search:', searchError.message);
                }

                const embed = new EmbedBuilder()
                .setTitle('Anu S:n antimet tänään 😎')
                .addFields({ name: '**`Ellen`**', value: ellenMenu + '\n\nhttps://tinyurl.com/ellenmenu' })
                .setThumbnail('https://etk9q8atrca.exactdn.com/wp-content/uploads/2017/10/cropped-salpaus-s-favicon.jpg?strip=all&lossy=1&resize=32%2C32&ssl=1')
                .setImage(imageSearchUrl || 'https://cdn-wp.valio.fi/valio-wp-network/sites/2/2023/04/41920-sitruunainen-uunikala.jpeg')
                .setColor(getRandomColor());
                message.reply({ embeds: [embed] });
            }
        }
    }

    const randomNum = Math.random();
    const reactionProbability = 0.01;

    if (randomNum < reactionProbability) {
        // list
        const emojis = [
            '😄', '😍', '🎉', '👍', '🌟', '❤️', '🚀', '🐱', '🍕', '🎶',
            '🔥', '🌈', '👏', '💡', '🍦', '🎨', '🎸', '💻', '🦦', '💯',
        ];

        // Face emojis (U+1F600 to U+1F64F)
        for (let i = 0x1F600; i <= 0x1F64F; i++) {
            emojis.push(String.fromCodePoint(i));
        }

        // Hand emojis (U+1F91A to U+1F93E)
        for (let i = 0x1F91A; i <= 0x1F93E; i++) {
            emojis.push(String.fromCodePoint(i));
        }

        // Animal emojis (U+1F400 to U+1F4F0)
        for (let i = 0x1F400; i <= 0x1F4F0; i++) {
            emojis.push(String.fromCodePoint(i));
        }

        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        message.react(randomEmoji)
            .then(() => console.log(`\x1b[1;36mAnu reacted with ${randomEmoji} to ${message.author.tag}'s message: ${message.content}\x1b[0m`))
            .catch(console.error);
    }

    if (message.content.toLowerCase().startsWith('test')) {
        const args = message.content.slice('test'.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
    
        if (command === 'bing') {
            try {
                const imgResult = await searchImage('chicken', bingAPI);
    
                console.log('Bing Image Search Result:', imgResult);
                message.reply(imgResult || 'No image found.');
            } catch (error) {
                console.error('Error in Bing Image Search test:', error);
                message.reply('Error in Bing Image Search test. Check the logs for details.');
            }
        }
    }
}

module.exports = { handleMessageCreate, };
