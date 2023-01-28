module.exports = {
    name: 'ping',
    description: 'This command provides the bot\'s latency + API response times',
    category: 'staff',
    syntax: 'ping',
    async execute(client, message, args) {

        await message.reply('<:aghostping:1042254166736777286>').then((updatePing) => {

            updatePing.edit(`Bot Latency (Edit): ${Math.round(updatePing.createdTimestamp - message.createdTimestamp).toLocaleString()}ms\nAPI (Response Time): ${client.ws.ping.toLocaleString()}ms`);
        
        });

    }
    
};