require('dotenv').config();

//in bot.js

const { ask } = require("./ai.js"); //import the "ask" function from the "ai.js" file
const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js'); //v14.6.0
const {getnews, getngnames} = require("./news.js");

// Create a new client instance
const client = new Client({
  intents:
    [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent]
});

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});


/**
    * @brief function that format the array of news in an array of string for it to be sended on a channel
    *
    * @param news   array of news
    *
    * @return embedarr  tranformed string array
*/
function format_news(news){
    let embedarr = [];
    news.forEach(n => {
        const embedelt = new EmbedBuilder()
            .setTitle(n.title)
            .setAuthor({name: n.author})
            .setURL(n.link)
            .setDescription(`Click on the title to access the news`)
            .addFields({name: 'content', value: n.content})
            .setTimestamp()
            .setFooter({ text: `newsgroup: ${n.newsgroup}` });
        embedarr.push(embedelt);
    });
    return embedarr;
}

/**
    * @brief Main function that process all messages from the server
*/
client.on(Events.MessageCreate, async message => {
  if (message.content.substring(0, 1) === "?") {
    const prompt = message.content.substring(1); //remove the exclamation mark from the message
    const req = prompt.split(' ')
    const channel = await client.channels.fetch(message.channelId); // channel where the answer will be sent
    if (req[0] === 'help'){
        const embedhelp = new EmbedBuilder().setTitle('Command List')
            .setFields({name: '?fetch <newsgroup-name>', value: 'fetch all last news in this newsgroup or jsut all news if blank'},
                {name: '?newsgroup', value: 'list all available newsgroup'},
                {name: '?<any existential questions>', value: 'ask Chatgpt to answer the question'})
        channel.send({embeds: [embedhelp]});
        return;
    }
    else if (req[0] === 'newsgroup'){
        channel.send(await getngnames()).toString().replace(/,/g , '\n');
    }
    else if (req[0] === 'fetch'){
        // check if there is a newsgroup and if it is valid
        if (req.length > 1){
            if (!(await getngnames()).includes(req[1]))
                channel.send(`error: ${req[1]} is not a valid newsgroup, to see all available newsgroup use the !newsgroup command`);
            else{
                let news = format_news(await getnews(req[1]));
                //news.forEach(n => client.channels.fetch(message.channelId).then(channel => channel.send(n)));
                channel.send({ embeds: news });
            }
        }
        else {
            let news = format_news(await getnews());
            //news.forEach(n => client.channels.fetch(message.channelId).then(channel => channel.send(n)));
            channel.send({ embeds: news });
        }
    }
    else {
        const gptembed = new EmbedBuilder().setTitle('ChatGPT').setFields({name: 'Answer', value: (await ask(prompt))});
        channel.send({ embeds: [gptembed] });
    }
  }
});

// Log in to Discord with your client's token
client.login(process.env.TOKEN);
