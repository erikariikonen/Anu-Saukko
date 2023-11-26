const { Configuration, OpenAIApi, OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.AI_KEY
});

module.exports = async (messages, model = "gpt-3.5-turbo") => {
  try {
    const completion = await openai.chat.completions.create({
      messages,
      model,
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.log(err);
  }
};
