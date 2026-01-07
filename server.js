const express = require('express')
const app = express()
const port = 3000

const { Client, GatewayIntentBits, Events} = require('discord.js')
const token = process.env.DISCORD_TOKEN;
const channelName = process.env.CHANNEL_NAME;
const channelGuild = process.env.CHANNEL_GUILD;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let channel;

client.once(Events.ClientReady, () => {
    channel = client.channels.cache.find(c => c.name === channelName && c.guild.name === channelGuild)
});

app.enable('trust proxy')
app.use(express.json())
app.use(express.static('public'))

app.post('/request', (req, res) => {
    const {name, items} = req.body;
    console.log("request by", name, req.ip);
    channel.send(
        `Guildmember **${name}** is requesting the following items:\n`
        +items.map(i => ` - ${i.name}: ${i.amount}`).join('\n'));
});

client.login(token);
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})