const fs = require('node:fs');
const path = require('node:path');

module.exports = (client) => {
    const commandFolders = ['commands', 'contexts'];
    
    for (const folderName of commandFolders) {
        const folderPath = path.join(__dirname, `../${folderName}`);
        const files = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));
        
        for (const file of files) {
            const command = require(path.join(folderPath, file));
            client.commands.set(command.data.name, command);
        }
    }
};