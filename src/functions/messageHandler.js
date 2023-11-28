const countTokens = require('../openai/count-tokens.js');
const openai = require('../openai/openai.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState } = require('@discordjs/voice');
const path = require('path');
const { RepeatMode } = require("discord-music-player");
const fs = require('fs');
const { getTodaysFood } = require('../jamix/jamix.js');
const { EmbedBuilder } = require('discord.js');


async function handleMessageCreate(client, message) {
    const delay = 1000;

    if (message.author === message.client.user) {
        return;
    }

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
    ];
    
    const isIgnoredMessage = ignoredPatterns.some(pattern => pattern.test(message.content));
    

    if (message.content === 'anu help') {
        setTimeout(() => {
            message.reply(
                'Annan muutaman esimerkin suosituista "anu" alkuisista kommennoista:\n\n1. 😈 - anu x\n2. 🤪 - anu pingaa kaikki\n3. 🥴 - anu ruokalista\n4. 🤙 - anu saako x\n5. 🤔 - anu sano x\n6. 🙄 - anu mitä osaat sanoa\n7. 😂 - anu soita x/linkki\n8. 😭 - anu skippaa\n9. 🔥 - anu skippaa kaikki\n10. 💯 - anu stoppaa'
                );
        }, delay);
    }

    if (message.content === 'anu pingaa kaikki') {
        setTimeout(() => {
            message.reply('@everyone');
        }, delay);
    }


    const regex = /^anu saako (.+)$/i;
    const match = message.content.match(regex);

    if (match) {
        const responses = ['Kyllä!! 😊😊', 'Minun mielestä saa 🤗', 'Salee 😎', 'Jos kysyt nätisti 👉👈', 'Ei!!! Grr 😡', 'Et uskaltaisi!! Nössö 😈', 'En suosittele ✋👮', 'Ehkäpä 😉', 'Ei saa!! 😔😭','Riippuu siitä, kuka kysyy 🤭'];
        const randomIndex = Math.floor(Math.random() * responses.length);
        const randomResponse = responses[randomIndex];

        setTimeout(() => {
            message.reply(randomResponse);
        }, delay);
    }

    let hasRepliedToAnu = false;

    const isAnuMessage = message.content.toLowerCase().startsWith('anu') && !isIgnoredMessage;
    
    if (isAnuMessage && !hasRepliedToAnu) {
        const messages = (
            await message.channel.messages.fetch({ limit: 25 })
        ).reverse();
    
        const maxTokens = 4096; // gpt-3.5-turbo
        let totalTokens = 0;
    
        const anuMessages = messages.filter((msg) => msg.content.startsWith('anu') && !isIgnoredMessage);
    
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

    if (message.content.startsWith('anu sano')) {
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
    } else if (message.content.startsWith('anu mitä osaat sanoa')) {
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

    if (message.content.startsWith('anu')) {
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
                { name: '**`Signe`**', value: signeMenu },
                { name: '**`Ellen`**', value: ellenMenu }
            )
            .setColor(getRandomColor());
            message.reply({ embeds: [embed] });
        }

        if(command === 'signe') {
            const embed = new EmbedBuilder()
            .setTitle('Anu S:n antimet tänään 😎')
            .addFields({ name: '**`Signe`**', value: signeMenu })
            .setImage('https://cdn-wp.valio.fi/valio-wp-network/sites/2/2023/04/41920-sitruunainen-uunikala.jpeg')
            .setColor(getRandomColor())
            .setFooter({text:'https://fi.jamix.cloud/apps/menu/?anro=97325&k=7&mt=4'});
            message.reply({ embeds: [embed] });
        }

        
        if(command === 'ellen') {
            const embed = new EmbedBuilder()
            .setTitle('Anu S:n antimet tänään 😎')
            .addFields({ name: '**`Ellen`**', value: ellenMenu })
            .setColor(getRandomColor());
        message.reply({ embeds: [embed] });
        }

        
    }
    
    // random color juttu nopeest tähä 🥶🍦
    function getRandomColor() {
        const rainbowColors = [
            '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'
        ];
        
        const randomIndex = Math.floor(Math.random() * rainbowColors.length);
        return rainbowColors[randomIndex];
    }
}

module.exports = { handleMessageCreate };
