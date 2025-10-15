const { ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');

// -------------------------
// Server Initialization
// -------------------------
exports.initNewServer = async function initNewServer(guild, client) {
    const directory = `./data/${guild.id}`;
    try {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }
    } catch (err) {
        console.error(err);
    }
    await module.exports.initFiles(guild);
    await createDefaultChannels(guild, client);
}

// Creates default channels and sets initial settings
async function createDefaultChannels(guild, client) {
    let adminRole = await guild.roles.create({ name: "Pick'em Admin" });
    let privatePermissionOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel] },
    ];
    let publicPermissionOverwrites = [
        { id: guild.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
    ];

    let category = await guild.channels.create({ name: 'pickems', type: ChannelType.GuildCategory });
    let consoleC = await guild.channels.create({
        name: 'pickems-console',
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: privatePermissionOverwrites,
    });
    let matchups = await guild.channels.create({
        name: 'matchups',
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: publicPermissionOverwrites
    });
    let leaderboard = await guild.channels.create({
        name: 'leaderboard',
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: publicPermissionOverwrites
    });
    let settings = await guild.channels.create({
        name: 'settings',
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: privatePermissionOverwrites
    });
    let pickemsMatchupCategory = await guild.channels.create({
        name: 'pickems-matchups',
        type: ChannelType.GuildCategory,
        permissionOverwrites: privatePermissionOverwrites
    });
    let pickemsMatchupArchiveCategory = await guild.channels.create({
        name: 'pickems-matchups-archive',
        type: ChannelType.GuildCategory,
        permissionOverwrites: privatePermissionOverwrites
    });

    // Init settings
    let settingsObject = {
        weeks: [],
        guildId: guild.id,
        matchupsChannelId: matchups.id,
        leaderboardChannelId: leaderboard.id,
        consoleChannelId: consoleC.id,
        settingsChannelId: settings.id,
        pickemsMatchupCategoryId: pickemsMatchupCategory.id,
        pickemsMatchupArchiveCategoryId: pickemsMatchupArchiveCategory.id,
    };

    await module.exports.setSettings(guild, settingsObject);
    await module.exports.writeToSettingsServer(client, guild, settingsObject);
}

// -------------------------
// File I/O
// -------------------------
exports.initFiles = async function initFiles(guild) {
    const directory = `./data/${guild.id}`;
    const files = {
        reactionMap: `${directory}/reactionMap.json`,
        matchups: `${directory}/matchups.json`,
        settings: `${directory}/settings.json`,
        lastMatchupMessages: `${directory}/lastMatchupMessages.json`,
        weeks: `${directory}/weeks.json`
    };

    try {
        if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

        if (!fs.existsSync(files.reactionMap)) await module.exports.setReactionMap(guild, new Map());
        if (!fs.existsSync(files.matchups)) await module.exports.setMatchups(guild, new Map());
        if (!fs.existsSync(files.settings)) await module.exports.setSettings(guild, {});
        if (!fs.existsSync(files.lastMatchupMessages)) await module.exports.setLastMatchupMessage(guild, {});
        if (!fs.existsSync(files.weeks)) await module.exports.setWeeks(guild, []);
    } catch (err) {
        console.error(err);
    }
};

exports.getObjectFromFile = async function getObjectFromFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) return reject(err);
            if (!data) return resolve(null);
            try {
                const obj = JSON.parse(data, module.exports.reviver);
                resolve(obj);
            } catch (e) {
                reject(e);
            }
        });
    });
};

exports.writeObjectToFile = async function writeObjectToFile(filePath, object) {
    return new Promise((resolve, reject) => {
        const str = JSON.stringify(object, module.exports.replacer, 2);
        fs.writeFile(filePath, str, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// JSON Map support
exports.replacer = function replacer(key, value) {
    if (value instanceof Map) return { dataType: 'Map', value: Array.from(value.entries()) };
    return value;
};

exports.reviver = function reviver(key, value) {
    if (value && value.dataType === 'Map') return new Map(value.value);
    return value;
};

// -------------------------
// CRUD Functions
// -------------------------
exports.getReactionMap = async (guild) => module.exports.getObjectFromFile(`./data/${guild.id}/reactionMap.json`);
exports.getMatchups = async (guild) => module.exports.getObjectFromFile(`./data/${guild.id}/matchups.json`);
exports.getSettings = async (guild) => module.exports.getObjectFromFile(`./data/${guild.id}/settings.json`);
exports.getWeeks = async (guild) => module.exports.getObjectFromFile(`./data/${guild.id}/weeks.json`);
exports.getLastMatchupMessage = async (guild) => module.exports.getObjectFromFile(`./data/${guild.id}/lastMatchupMessages.json`);

exports.setReactionMap = async (guild, obj) => module.exports.writeObjectToFile(`./data/${guild.id}/reactionMap.json`, obj);
exports.setMatchups = async (guild, obj) => module.exports.writeObjectToFile(`./data/${guild.id}/matchups.json`, obj);
exports.setSettings = async (guild, obj) => module.exports.writeObjectToFile(`./data/${guild.id}/settings.json`, obj);
exports.setWeeks = async (guild, obj) => module.exports.writeObjectToFile(`./data/${guild.id}/weeks.json`, obj);
exports.setLastMatchupMessage = async (guild, obj) => module.exports.writeObjectToFile(`./data/${guild.id}/lastMatchupMessages.json`, obj);

// -------------------------
// Channel ID getters
// -------------------------
exports.getMatchupsChannelId = async (guild) => (await module.exports.getSettings(guild))?.matchupsChannelId;
exports.getLeaderboardChannelId = async (guild) => (await module.exports.getSettings(guild))?.leaderboardChannelId;
exports.getConsoleChannelId = async (guild) => (await module.exports.getSettings(guild))?.consoleChannelId;
exports.getSettingsChannelId = async (guild) => (await module.exports.getSettings(guild))?.settingsChannelId;
exports.getPickemsMatchupCategoryId = async (guild) => (await module.exports.getSettings(guild))?.pickemsMatchupCategoryId;

// -------------------------
// Other helpers
// -------------------------
exports.writeToSettingsServer = async function writeToSettingsServer(client, guild, settings) {
    const text = "```" + JSON.stringify(settings, null, 2) + "```";
    const channelId = await module.exports.getSettingsChannelId(guild);
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;
    await channel.messages.fetch({ limit: 1 }).then(async messages => {
        if (messages.size === 0) {
            await channel.send(text);
        } else {
            const msg = Array.from(messages.values())[0];
            await msg.edit(text);
        }
    });
};

function prettyJson(jsonString) {
    const json = JSON.parse(jsonString);
    return JSON.stringify(json, null, 2);
}
