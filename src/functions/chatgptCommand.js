const { SlashCommandBuilder } = require('discord.js');

const { ChatGPTClient } = require('discordjs-chatgpt');
const chatgpt = new ChatGPTClient(process.env.AI_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anu')
    .setDescription('Anu Sauokkon jekkuja')
    .addStringOption(option =>
        option
          .setName('keskustelee')
          .setDescription('Anu Sauokko keskustelee aiheesta...')),
  async execute(interaction) {
      const msg = interaction.options.getString('keskustelee', true);
      await chatgpt.chatInteraction(interaction, msg);
  }
};