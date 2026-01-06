const express = require('express')
const app = express()
const port = 3000

const { Client, GatewayIntentBits, Events} = require('discord.js')
const { token, channelName, channelGuild } = require('./config.json')

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let channel;

client.once(Events.ClientReady, (readyClient) => {
    channel = client.channels.cache.find(c => c.name === channelName && c.guild.name === channelGuild)
});

app.use(express.static('public'))

app.get('/request', (req, res) => {
    res.send()
})

client.login(token);
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})