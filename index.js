//meddelande id är 1146107571413995572

require("dotenv/config");
const { Client } = require("discord.js");
const { OpenAI } = require("openai");
const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

client.on("ready", () => {
  console.log("The bot is online.");
});

const IGNORE_PREFIX = "!";
const CHANNELS = [process.env.CHANNEL_ID];

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.content.startsWith(IGNORE_PREFIX)) return;

  if (
    !CHANNELS.includes(message.channelId) &&
    !message.mentions.users.has(client.user.id)
  )
    return;

  await message.channel.sendTyping();
  const sendTypingIntervall = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let conversation = [];

  conversation.push({
    role: "system",
    content: "Chat gpt is a friendly chatbot",
  });

  let prevMessage = await message.channel.messages.fetch({ limit: 10 });
  prevMessage.reverse();

  prevMessage.forEach(msg => {
    if (msg.author.bot && msg.author.id !== client.user.id) return;
    if (msg.content.startsWith(IGNORE_PREFIX)) return;

    const userName = msg.author.username
      .replace(/\s+/g, "_")
      .replace(/[^\w\s]/gi, "");

    if (msg.author.id === client.user.id) {
      conversation.push({
        role: "assistant",
        name: userName,
        content: msg.content,
      });
      return;
    }
    conversation.push({
      role: "user",
      name: userName,
      content: msg.content,
    });
  });

  const response = await openai.chat.completions
    .create({
      model: "gpt-4",
      messages: conversation,
    })
    .catch(error => console.error("OpenAI Error:\n", error));
  clearInterval(sendTypingIntervall);

  if (!response) {
    message.reply(
      "ChatGPR är för närvarande inte tillgänglig. Var god försök igen senare."
    );
    return;
  }

  // const thread = await message.startThread({
  //   name: "food-talk",
  //   autoArchiveDuration: 60,
  //   reason: "Needed a separate thread for food",
  // });
  // debugger;
  // console.log(`Created thread: ${thread.name}`);
  message.reply(response.choices[0].message.content);
});

client.login(process.env.TOKEN);
