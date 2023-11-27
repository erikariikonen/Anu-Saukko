const countTokens = require('../openai/count-tokens.js');
const openai = require('../openai/openai.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState } = require('@discordjs/voice');
const path = require('path');
const { RepeatMode } = require("discord-music-player");


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
    ];
    
    const isIgnoredMessage = ignoredPatterns.some(pattern => pattern.test(message.content));
    

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

    const isAnuMessage = message.content.startsWith('anu') && !isIgnoredMessage;

    if (isAnuMessage && !hasRepliedToAnu) {
        const messages = (
            await message.channel.messages.fetch({ limit: 25 })
        ).reverse();

        const maxTokens = 4096; // gpt-3.5-turbo
        let totalTokens = 0;

        const anuMessages = messages.filter((msg) => msg.content.startsWith('anu'));

        anuMessages.forEach((message) => {
            const tokens = countTokens(message.content);

            if (totalTokens + tokens < maxTokens) {
                totalTokens += tokens;

                gptMessages.push({
                    role: message.author.bot ? 'assistant' : 'user',
                    content: message.content,
                });
            }
        });

        let response = await openai(gptMessages);

        console.log(gptMessages, '\x1b[33m Anu sanoi: ' + response.toString());

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


}

module.exports = {
    handleMessageCreate,
};
