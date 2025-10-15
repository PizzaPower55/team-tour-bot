const { SlashCommandBuilder } = require('discord.js');
const {
    getReactionMap,
    getMatchups,
    getSettings,
    setReactionMap,
    setMatchups,
    setSettings,
    setWeeks,
    initFiles
} = require('./../../modules/database.module.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('init')
        .setDescription('Initialize Team Tour Bot and create necessary data files.'),
    
    async execute(interaction) {
        await interaction.reply('Initializing Team Tour Bot...');

        const guild = interaction.guild;

        // Ensure the folder and files exist
        await initFiles(guild);

        // Initialize or verify Reaction Map
        let reactionMap = await getReactionMap(guild);
        if (!reactionMap) {
            await setReactionMap(guild, new Map());
            await interaction.channel.send('Reaction Map created.');
        } else {
            await interaction.channel.send('Reaction Map already exists. Skipping...');
        }

        // Initialize or verify Matchups
        let matchups = await getMatchups(guild);
        if (!matchups) {
            await setMatchups(guild, new Map());
            await interaction.channel.send('Matchups created.');
        } else {
            await interaction.channel.send('Matchups already exist. Skipping...');
        }

        // Initialize or verify Settings
        let settings = await getSettings(guild);
        if (!settings) {
            await setSettings(guild, {});
            await interaction.channel.send('Settings created.');
        } else {
            await interaction.channel.send('Settings already exist. Skipping...');
        }

        // Initialize Weeks file
        await setWeeks(guild, []);
        await interaction.channel.send('Weeks file initialized.');

        await interaction.followUp('Initialization complete! Your bot is now ready to use.');
    },
};
