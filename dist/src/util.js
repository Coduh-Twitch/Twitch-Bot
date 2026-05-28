"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeAgo = exports.getFollowedDate = exports.getUser = exports.shoutout = exports.setTags = exports.setTitle = exports.setGame = exports.getGame = exports.getWeather = exports.pinMessage = exports.getRoomCode = exports.setRoomCode = exports.getDiscordCta = void 0;
const axios_1 = require("axios");
const _1 = require(".");
const user_1 = require("./models/user");
const session_1 = require("./models/session");
const getDiscordCta = async () => {
    const guildInvite = "cTVvyh3zke";
    const DISCORD_API_URL = `https://discord.com/api`;
    const discordData = await (await (0, axios_1.get)(`${DISCORD_API_URL}/invite/${guildInvite}`)).data;
    if (discordData || discordData !== null) {
        const profile = discordData.profile;
        const members = profile.member_count || 0;
        return `${members.toLocaleString()} HOT SINGLE${members === 1 ? "" : "S"} IN YOUR AREA! CLICK THE LINK TO FIND LOCALS NEAR YOU | ${_1.SOCIAL_LINKS.discord}`;
    }
    else {
        return `HOT SINGLES IN YOUR AREA! CLICK THE LINK TO FIND LOCALS NEAR YOU | ${_1.SOCIAL_LINKS.discord}`;
    }
};
exports.getDiscordCta = getDiscordCta;
const setRoomCode = async (roomCode) => {
    try {
        await user_1.userModel.findOneAndUpdate({ twitchId: process.env.CHANNEL_ID }, { game_code: roomCode });
        return true;
    }
    catch (e) {
        return false;
    }
};
exports.setRoomCode = setRoomCode;
const getRoomCode = async () => {
    let dbUser = await user_1.userModel.findOne({ twitchId: process.env.CHANNEL_ID });
    if (!dbUser || !dbUser?.game_code)
        return "No Room Code";
    return dbUser.game_code;
};
exports.getRoomCode = getRoomCode;
const pinMessage = async (message, durationSeconds = null) => {
    let session = await session_1.sessionModel.findOne({ userId: process.env.BOT_USER_ID });
    if (!session)
        return false;
    let headers = {
        "Authorization": `Bearer ${session.accessToken}`,
        "Client-Id": process.env.CLIENT_ID
    };
    try {
        let res = await (0, axios_1.put)(`https://api.twitch.tv/helix/chat/pins?broadcaster_id=${process.env.CHANNEL_ID}&moderator_id=${process.env.BOT_USER_ID}&message_id=${message.id}${durationSeconds ? `&duration_seconds=${durationSeconds}` : ""}`, null, { headers });
        console.log(`pinning message ${message.id}`);
        console.log(res);
    }
    catch (e) {
        console.log(`failed to pin`);
        console.log(e);
    }
};
exports.pinMessage = pinMessage;
const getWeather = async (location) => {
    let res = await (0, axios_1.get)(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
    if (!res.data)
        return { temperature_c: 0, temperature_f: 0, region: "Region not found", emoji: "NotLikeThis" };
    let emoji = await (0, axios_1.get)(`https://wttr.in/${encodeURIComponent(location)}?format=%c`);
    if (!emoji.data)
        return { temperature_c: 0, temperature_f: 0, region: "Region not found", emoji: "NotLikeThis" };
    return {
        temperature_c: res.data.current_condition?.[0].temp_C,
        temperature_f: res.data.current_condition?.[0].temp_F,
        region: res.data.nearest_area[0].areaName[0].value,
        emoji: emoji.data
    };
};
exports.getWeather = getWeather;
const getGame = async (username) => {
    let stream = await _1.apiClient.streams.getStreamsByUserNames([username]);
    if (stream?.[0])
        stream = stream[0];
    let apiUser = await _1.apiClient.users.getUserByName(username);
    let apiChannel = await _1.apiClient.channels.getChannelInfoById(apiUser.id);
    return stream?.gameName || apiChannel?.gameName || null;
};
exports.getGame = getGame;
const setGame = async (gameName) => {
    if (!_1.broadcasterApiClient)
        return null;
    try {
        let game = await _1.apiClient.games.getGameByName(gameName);
        if (!game)
            return null;
        await _1.broadcasterApiClient.channels.updateChannelInfo(process.env.CHANNEL_ID, { gameId: game.id });
        return game.name;
    }
    catch (e) {
        console.log("ERROR SETTING GAME", e);
        return null;
    }
};
exports.setGame = setGame;
const setTitle = async (newTitle) => {
    if (!_1.broadcasterApiClient)
        return null;
    try {
        await _1.broadcasterApiClient.channels.updateChannelInfo(process.env.CHANNEL_ID, { title: newTitle });
        return newTitle;
    }
    catch (e) {
        console.log("ERROR SETTING TITLE", e);
        return null;
    }
};
exports.setTitle = setTitle;
const setTags = async (tags) => {
    if (!_1.broadcasterApiClient)
        return [];
    if (tags.length <= 0)
        return [];
    try {
        await _1.broadcasterApiClient.channels.updateChannelInfo(process.env.CHANNEL_ID, { tags: tags });
        return tags;
    }
    catch (e) {
        console.log("ERROR SETTING TITLE", e);
        return [];
    }
};
exports.setTags = setTags;
const shoutout = async (username) => {
    try {
        let apiUser = await _1.apiClient.users.getUserByName(username);
        if (!apiUser)
            return false;
        await _1.apiClient.asUser(process.env.BOT_USER_ID, async (ctx) => {
            await ctx.chat.shoutoutUser(process.env.CHANNEL_ID, apiUser.id);
        });
        return true;
    }
    catch (e) {
        console.log(e);
        return false;
    }
};
exports.shoutout = shoutout;
const getUser = async (login) => {
    try {
        let apiUser = await _1.apiClient.users.getUserByName(login);
        if (!apiUser)
            return null;
        return apiUser;
    }
    catch (e) {
        console.log(e);
        return null;
    }
};
exports.getUser = getUser;
const getFollowedDate = async (login) => {
    try {
        let apiUser = await _1.apiClient.users.getUserByName(login);
        if (!apiUser)
            return null;
        let broadcasterFollowers = await _1.broadcasterApiClient.channels.getChannelFollowers(process.env.CHANNEL_ID);
        if (!broadcasterFollowers.data || broadcasterFollowers.data.length <= 0)
            return null;
        let apiFollower = broadcasterFollowers.data.find(f => f.userId === apiUser.id);
        return apiFollower?.followDate || null;
    }
    catch (e) {
        console.log(e);
        return null;
    }
};
exports.getFollowedDate = getFollowedDate;
const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) {
        return interval + ' years ago';
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + ' months ago';
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + ' days ago';
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + ' hours ago';
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + ' minutes ago';
    }
    if (seconds < 10)
        return 'just now';
    return Math.floor(seconds) + ' seconds ago';
};
exports.timeAgo = timeAgo;
//# sourceMappingURL=util.js.map