"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandsMap = exports.prefix = exports.websocket = exports.clientEventSub = exports.client = exports.broadcasterEventSub = exports.broadcasterApiClient = exports.broadcasterAuthProvider = exports.apiClient = exports.authProvider = exports.CHANNEL = exports.KNOWN_BOT_NAMES = exports.SOCIAL_LINKS = void 0;
exports.reply = reply;
exports.sendAndPin = sendAndPin;
exports.runCommand = runCommand;
require("dotenv/config");
const auth_1 = require("@twurple/auth");
const chat_1 = require("@twurple/chat");
const axios_1 = require("axios");
const Types_1 = require("./classes/Types");
const DiscordCommand_1 = __importDefault(require("./commands/DiscordCommand"));
const TiktokCommand_1 = __importDefault(require("./commands/TiktokCommand"));
const scheduledMessages_1 = __importStar(require("./data/scheduledMessages"));
const mongoose_1 = __importDefault(require("mongoose"));
const command_1 = require("./models/command");
const AddCommandCommand_1 = __importDefault(require("./commands/AddCommandCommand"));
const DeleteCommandCommand_1 = __importDefault(require("./commands/DeleteCommandCommand"));
const EditCommandCommand_1 = __importDefault(require("./commands/EditCommandCommand"));
const express_1 = __importStar(require("express"));
const api_1 = __importDefault(require("./routes/api"));
const Socket_1 = __importDefault(require("./classes/Socket"));
const session_1 = require("./models/session");
const auth_2 = require("./routes/auth");
const user_1 = require("./models/user");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const process_1 = require("process");
const GambleCommand_1 = __importDefault(require("./commands/GambleCommand"));
const api_2 = require("@twurple/api");
const PointsCommand_1 = __importDefault(require("./commands/PointsCommand"));
const SetRoomCodeCommand_1 = __importDefault(require("./commands/SetRoomCodeCommand"));
const RoomCodeCommand_1 = __importDefault(require("./commands/RoomCodeCommand"));
const util_1 = require("./util");
const fs_1 = require("fs");
const raffle_1 = require("./db/raffle");
const RaffleCommand_1 = __importDefault(require("./commands/RaffleCommand"));
const MoveCommand_1 = __importDefault(require("./commands/MoveCommand"));
const eventsub_ws_1 = require("@twurple/eventsub-ws");
const NukeCommand_1 = __importDefault(require("./commands/NukeCommand"));
exports.SOCIAL_LINKS = {
    "discord": "https://discord.com/invite/cTVvyh3zke",
    "twitch": "https://www.twitch.tv/coduh",
    "clockapp": "https://www.tiktok.com/@coduhz",
};
exports.KNOWN_BOT_NAMES = ["streamelements", "nightbot", "fossabot", "moobot", "streamlabs"];
exports.CHANNEL = process.env.CHANNEL;
let thirtyWarnings = new Map();
let fifteenWarnings = new Map();
let sevenWarnings = new Map();
let gifterCounts = new Map();
let lastScheduledMessage = "";
exports.authProvider = new auth_1.RefreshingAuthProvider({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });
exports.apiClient = new api_2.ApiClient({ authProvider: exports.authProvider });
exports.broadcasterAuthProvider = null;
exports.broadcasterApiClient = null;
exports.broadcasterEventSub = null;
exports.client = new chat_1.ChatClient({ authProvider: exports.authProvider, channels: [exports.CHANNEL], });
exports.clientEventSub = new eventsub_ws_1.EventSubWsListener({ apiClient: exports.apiClient });
let clientReady = false;
exports.websocket = new Socket_1.default(parseInt(process.env.SOCKET_PORT));
exports.prefix = "!";
exports.commandsMap = new Map();
setInterval(async () => {
    if (!exports.client) {
        console.log(``);
        return;
    }
    if (!exports.broadcasterAuthProvider || !exports.broadcasterApiClient || !exports.broadcasterEventSub) {
        console.log("Initializing Broadcaster auth provider");
        let sessionRes = await (0, axios_1.get)(`${process.env.WEB_URL}/api/session?key=${process.env.CLIENT_SECRET}`);
        console.log("SESSION", sessionRes.data);
        if (!sessionRes || !sessionRes.data || !sessionRes.data?.data) {
            console.log(`Broadcaster Auth Session not found.`);
        }
        else {
            let session = sessionRes.data.data;
            if (session.user && session.access_token) {
                if (session.user.id === process.env.CHANNEL_ID) {
                    console.log(`Loading session for @${session.user.display_name}`);
                    exports.broadcasterAuthProvider = new auth_1.StaticAuthProvider(process.env.CLIENT_ID, session.access_token);
                    exports.broadcasterApiClient = new api_2.ApiClient({ authProvider: exports.broadcasterAuthProvider });
                    exports.broadcasterEventSub = new eventsub_ws_1.EventSubWsListener({ apiClient: exports.broadcasterApiClient });
                    exports.broadcasterEventSub.start();
                }
                else {
                    console.log(`Broadcaster Auth ID does not match environment variable ${session.user.id} / ${process.env.CHANNEL_ID}`);
                }
            }
            else {
                console.log(`Broadcaster Auth Session not found.`);
            }
        }
    }
    if (!exports.client.isConnected) {
        let botSession = await session_1.sessionModel.findOne({ userId: process.env.BOT_USER_ID });
        if (botSession) {
            let clientAuthDetail = { data: { data: null } };
            try {
                clientAuthDetail = await (0, axios_1.get)(`https://api.twitch.tv/helix/users`, { headers: { "Authorization": `Bearer ${botSession.accessToken}`, "Client-Id": process.env.CLIENT_ID } });
            }
            catch (e) {
                clientAuthDetail = { data: { data: null } };
            }
            if (clientAuthDetail.data?.data?.[0]) {
                let ud = clientAuthDetail.data?.data?.[0];
                if (!exports.authProvider.hasUser(ud.id)) {
                    console.log("BOT SESSION", botSession);
                    if (botSession.userId === ud.id)
                        await exports.authProvider.addUserForToken({
                            expiresIn: botSession.expiresIn, obtainmentTimestamp: botSession.obtainmentTimestamp, refreshToken: botSession.refreshToken, accessToken: botSession.accessToken
                        }, ['chat']);
                }
                else {
                    if (!exports.client.isConnected) {
                        exports.client.connect();
                        console.log(`Connecting to Chat`);
                        if (!clientReady) {
                            clientReady = true;
                            await initBot(exports.client);
                            let botDbUser = await user_1.userModel.findOne({ twitchId: ud.id });
                            if (!botDbUser) {
                                await user_1.userModel.create({ twitchId: ud.id, discordId: null, points: 0, role: user_1.UserRoles.BOT });
                            }
                            exports.clientEventSub.start();
                        }
                    }
                }
            }
            else {
                console.log(`Re-Authorize Client - Could not fetch authorization details`);
            }
        }
        else {
            console.log(`Re-Authorize Client - Session not found`);
        }
    }
    else {
        let raffles = (0, raffle_1.getAllRaffles)();
        raffles = raffles.filter(r => !r.winner_id);
        if (raffles.length <= 0) {
            if (sevenWarnings.size > 0)
                sevenWarnings.clear();
            if (fifteenWarnings.size > 0)
                fifteenWarnings.clear();
            if (fifteenWarnings.size > 0)
                thirtyWarnings.clear();
        }
        else {
            console.log("RAFFLES", raffles);
        }
        for (let i = 0; i < raffles.length; i++) {
            const raffle = raffles[i];
            let thirtySeconds = Date.now() + (30e3);
            let fifteenSeconds = Date.now() + (15e3);
            let sevenSeconds = Date.now() + (7e3);
            let raffleExpiration = raffle.expires_at.getTime();
            if (raffleExpiration <= thirtySeconds && !thirtyWarnings.has(raffle.id)) {
                thirtyWarnings.set(raffle.id, true);
                await reply(exports.client, null, `The raffle expires in 30 seconds`);
            }
            if (raffleExpiration <= fifteenSeconds && !fifteenWarnings.has(raffle.id)) {
                fifteenWarnings.set(raffle.id, true);
                await reply(exports.client, null, `The raffle expires in 15 seconds`);
            }
            if (raffleExpiration <= sevenSeconds && !sevenWarnings.has(raffle.id)) {
                sevenWarnings.set(raffle.id, true);
                await reply(exports.client, null, `The raffle expires in 7 seconds`);
            }
            if (raffleExpiration <= Date.now()) {
                let participants = (0, raffle_1.getRaffleParticipants)(raffle.id);
                if (!raffle.winner_id) {
                    if (participants && participants.length > 0) {
                        let randomInd = Math.floor(Math.random() * participants.length);
                        let winnerId = participants[randomInd] || participants[0];
                        let winner = await exports.apiClient.users.getUserById(winnerId);
                        if (winner) {
                            let dbUser = await user_1.userModel.findOne({ twitchId: winner.id });
                            if (!dbUser) {
                                let newUser = new user_1.userModel({
                                    twitchId: winner.id,
                                    points: raffle.points,
                                    role: user_1.UserRoles.DEFAULT
                                });
                                await newUser.save();
                            }
                            else {
                                dbUser.set("points", dbUser.points + raffle.points);
                                await dbUser.save();
                            }
                            (0, raffle_1.deleteRaffle)(raffle.id);
                            await reply(exports.client, null, `FBtouchdown @${winner.displayName} won the raffle for ${raffle.points.toLocaleString()} point${raffle.points === 1 ? "" : "s"}!`);
                        }
                        else {
                            await reply(exports.client, null, `StinkyCheese The raffle winner had a heart attack and fucking died`);
                            (0, raffle_1.deleteRaffle)(raffle.id);
                        }
                    }
                    else {
                        await reply(exports.client, null, `Nobody entered the raffle NotLikeThis`);
                        (0, raffle_1.deleteRaffle)(raffle.id);
                    }
                }
                else
                    (0, raffle_1.deleteRaffle)(raffle.id);
            }
        }
    }
}, 1e3);
let intervals = [];
const app = (0, express_1.default)();
function reply(c, user, content, msg) {
    if (!msg)
        exports.apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content);
    if (msg)
        exports.apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content, { replyParentMessageId: msg.id });
}
async function sendAndPin(c, user, content) {
    exports.apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content).then(async (m) => {
        console.log("sent message via helix ", m.id);
        await (0, util_1.pinMessage)(m);
    }).catch(e => {
        console.log("Failed to send chat message via Helix", e);
    });
}
async function runCommand(command, c, user, content, msg) {
    if (!command.enabled)
        return;
    await command.run(c, user, content, msg);
}
exports.authProvider.onRefresh(async (userId, tokenData) => await session_1.sessionModel.findOneAndUpdate({ userId: userId }, tokenData));
app.use((0, express_1.json)());
app.use("/api", api_1.default);
app.use("/auth", auth_2.AuthRoute);
async function initBot(c) {
    if (exports.clientEventSub && exports.broadcasterEventSub) {
        exports.clientEventSub.onChannelFollow(process.env.CHANNEL_ID, process.env.BOT_USER_ID, async (ev) => {
            await reply(c, ev.userDisplayName, `DinoDance Thank you for the follow @${ev.userDisplayName}!`);
        });
        exports.clientEventSub.onChannelShoutoutReceive(process.env.CHANNEL_ID, process.env.BOT_USER_ID, async (ev) => {
            await reply(c, ev.shoutingOutBroadcasterDisplayName, `@${ev.shoutingOutBroadcasterDisplayName} just shouted out the channel! Give them a follow! -> twitch.tv/${ev.shoutingOutBroadcasterDisplayName}`);
        });
        exports.broadcasterEventSub.onChannelVipAdd(process.env.CHANNEL_ID, async (ev) => {
            await reply(c, ev.userDisplayName, `DinoDance @${ev.userDisplayName} was given VIP! New shiny diamond!`);
        });
        exports.broadcasterEventSub.onChannelHypeTrainBeginV2(process.env.CHANNEL_ID, async (ev) => {
            await reply(c, ev.broadcasterName, `TwitchConHYPE HYPE TRAIN! A level ${ev.level} Hype Train has started! PogChamp`);
        });
        exports.broadcasterEventSub.onStreamOnline(process.env.CHANNEL_ID, async (ev) => {
            let stream = await ev.getStream();
            await reply(c, ev.broadcasterDisplayName, `@${ev.broadcasterDisplayName} is now live! "${stream.title}" -> Playing "${stream.gameName}"!`);
        });
    }
    c.onConnect(async () => {
        let dev = process.argv.includes("-dev");
        console.log("Initializing Local Websocket Server");
        if (exports.client.isConnected && !exports.websocket.initialized)
            await exports.websocket.initServerAndSocket();
        console.log("Loading Commands Map...");
        let dirPath = (0, path_1.join)(process.cwd(), `${dev ? "src" : "dist/src"}`, "commands");
        console.log("Checking Commands Dir", dirPath);
        (0, fs_1.readdirSync)(dirPath).filter(file => file.endsWith(dev ? ".ts" : ".js")).forEach(file => {
            let command = (require((0, path_1.join)(dirPath, file))).default;
            if (command && command.help && command.enabled) {
                let cmdCopy = command;
                cmdCopy.userLevel = Types_1.UserRolesStringMap[`${cmdCopy.userLevel}`];
                (cmdCopy.subCommands || []).forEach(subcommand => {
                    subcommand.userLevel = Types_1.UserRolesStringMap[`${subcommand.userLevel}`];
                });
                exports.commandsMap.set(file.split(".")[0].toLowerCase(), cmdCopy);
            }
        });
        console.log(`Client Connected!`);
        let stream = true;
        if (scheduledMessages_1.default.length > 0 && stream) {
            let int = await setInterval(async () => {
                let filtered = await Promise.all(scheduledMessages_1.default.filter(async (m) => (await m.getContent()) !== null));
                let rand = Math.floor(Math.random() * filtered.length);
                let sm = scheduledMessages_1.default[rand];
                if (lastScheduledMessage !== sm.id) {
                    lastScheduledMessage = sm.id;
                    let content = await sm.getContent();
                    if (content)
                        await exports.apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content);
                }
            }, scheduledMessages_1.scheduledMessageTimeout);
            intervals.push(int);
        }
    });
    c.onJoin((channel, user) => {
        console.log(`[${user}] Joined Channel -> ${channel}`);
    });
    c.onRaid(async (channel, raider, raid, msg) => {
        let game = await (0, util_1.getGame)(raider);
        reply(c, null, `DinoDance @${raider} thank you for the RAID! ${raider} just brought in ${raid.viewerCount.toLocaleString()} viewer${raid.viewerCount === 1 ? "" : "s"}${game ? ` from their ${game} stream!` : "!"} PewPewPew`);
    });
    c.onResub(async (channel, user, sub, msg) => {
        if ((sub.streak || 0) > 1)
            await reply(c, user, `@${user} just resubscribed ${sub.isPrime ? "for free with Twitch Prime! PrimeMe" : `at Tier ${(Number(sub.plan) || 1000) / 1000}! DinoDance`} They've been subscribed for ${sub.streak || 1} month${(sub.streak || 1) === 1 ? "" : "s"}`);
    });
    c.onSubGift(async (channel, user, sub, msg) => {
        const gifterName = sub.gifter;
        const giftCount = gifterCounts.get(gifterName) ?? 0;
        if (giftCount > 0) {
            gifterCounts.set(gifterName, giftCount - 1);
        }
        else {
            await reply(c, user, `${gifterName || "Anonymous"} gifted a Tier ${(Number(sub.plan) || 1000) / 1000} sub to @${sub.displayName}! DinoDance`);
        }
    });
    c.onCommunitySub(async (channel, user, sub, msg) => {
        const giftCount = gifterCounts.get(user) ?? 0;
        gifterCounts.set(user, giftCount - 1);
        await reply(c, user, `${user || "Anonymous"} gifted ${sub.count} Tier ${(Number(sub.plan) || 1000) / 1000} sub${sub.count === 1 ? "" : "s"} to the community! DinoDance`);
    });
    c.onSub(async (channel, user, sub, msg) => {
        await reply(c, user, `@${user} just subscribed ${sub.isPrime ? "for free with Twitch Prime! PrimeMe" : `at Tier ${(Number(sub.plan) || 1000) / 1000}! DinoDance`}`);
    });
    c.onSlow(async (channel, slowEnabled, slowDelay) => {
        if (slowEnabled) {
            c.say(channel, `⏱️ ${slowDelay ? `A ${slowDelay}s slowmode has been enabled.` : `Slowmode has been enabled.`}`);
        }
        else {
            c.say(channel, "⏱️ Slowmode has been disabled!");
        }
    });
    c.onFollowersOnly(async (channel, enabled, timeRequired) => {
        c.say(channel, `💜 Follower-Only mode has been ${enabled ? `enabled` : `disabled`}!${timeRequired ? ` Chatters must follow for at least ${timeRequired} minute${timeRequired === 1 ? "" : "s"}.` : ``}`);
    });
    c.onEmoteOnly(async (channel, enabled) => {
        c.say(channel, `DinoDance LUL SeemsGood Emote-Only mode has been ${enabled ? `enabled` : `disabled`}`);
    });
    c.onSubsOnly(async (channel, enabled) => {
        c.say(channel, `Subscriber-Only mode has been ${enabled ? `enabled` : `disabled`}.${enabled ? "Only Subscribers and Moderators may chat" : ""}`);
    });
    c.onStandardPayForward(async (channel, user, forward, msg) => {
        await reply(c, user, `@${user} just paid forward their sub from ${forward.originalGifterDisplayName || "Anonymous"}!`);
    });
    c.onMessage(async (channel, user, content, msg) => {
        if (msg.isFirst) {
            await reply(c, user, `Welcome to the chat, @${user}!`, msg);
        }
        let pointsBackupPath = (0, path_1.join)((0, process_1.cwd)(), "data", "streamElementsExport.json");
        console.log(pointsBackupPath);
        (0, fs_extra_1.ensureFileSync)(pointsBackupPath);
        let isBot = [...exports.KNOWN_BOT_NAMES, process.env.BOT_USER_NAME].includes(user.toLowerCase());
        console.log(content);
        if (isBot)
            return;
        let dbUser = await user_1.userModel.findOne({ twitchId: msg.userInfo.userId });
        if (!dbUser) {
            let pointsJson = null;
            try {
                pointsJson = (0, fs_extra_1.readJSONSync)(pointsBackupPath);
            }
            catch (e) {
                pointsJson = null;
            }
            let userPoints = pointsJson && pointsJson?.users && pointsJson.users.find(u => u.username.toLowerCase() === msg.userInfo.userName.toLowerCase()) ? pointsJson.users.find(u => u.username.toLowerCase() === msg.userInfo.userName.toLowerCase()).points : 0;
            let points = isBot ? 0 : userPoints;
            let role = user_1.UserRoles.DEFAULT;
            if (msg.userInfo.isVip)
                role = user_1.UserRoles.VIP;
            if (msg.userInfo.isMod)
                role = user_1.UserRoles.MOD;
            if (msg.userInfo.isBroadcaster)
                role = user_1.UserRoles.BROADCASTER;
            if (isBot)
                role = user_1.UserRoles.BOT;
            await user_1.userModel.create({ twitchId: msg.userInfo.userId, discordId: null, points: points, role: role });
        }
        else {
            let role = user_1.UserRoles.DEFAULT;
            if (msg.userInfo.isVip)
                role = user_1.UserRoles.VIP;
            if (msg.userInfo.isMod)
                role = user_1.UserRoles.MOD;
            if (msg.userInfo.isBroadcaster)
                role = user_1.UserRoles.BROADCASTER;
            if (isBot)
                role = user_1.UserRoles.BOT;
            dbUser.role = role;
            await dbUser.save();
        }
        if (!content.startsWith(exports.prefix) && content.trim().toLowerCase().startsWith("pickme")) {
            let raffle = (0, raffle_1.getAllRaffles)()?.[0];
            if (raffle) {
                let participants = (0, raffle_1.getRaffleParticipants)(raffle.id);
                if (!participants.some(p => p.id === msg.userInfo.userId)) {
                    if (participants && (participants.length <= 0 && raffle.creator_id === msg.userInfo.userId)) {
                        reply(exports.client, user, `Someone else has to join the raffle before you can join!`, msg);
                    }
                    else {
                        (0, raffle_1.createRaffleParticipant)({ raffle_id: raffle.id, id: msg.userInfo.userId });
                        await reply(exports.client, user, `@${msg.userInfo.displayName} joined the raffle for ${raffle.points.toLocaleString()} point${raffle.points === 1 ? "" : "s"}! Type "pickme" in chat for a chance to win!`, msg);
                    }
                }
            }
        }
        console.log(`[${channel}] Message Sent by ${user} -> ${content}`);
        let cmd = content.toLowerCase().split(/ +/)[0];
        let args = content.replace(cmd, "").trim().split(" ");
        let cmdNoPrefix = cmd.replace(exports.prefix, "");
        const commands = await command_1.customCommandModel.find();
        if (commands !== null || commands.length > 0) {
            let customCmd = commands.find(c => c.trigger.toLowerCase() === cmd);
            if (customCmd) {
                let userLevel = customCmd.userLevel || Types_1.UserRolesStringMap[`${user_1.UserRoles.DEFAULT}`];
                function checkPermission(role, checkBroadcaster = true) {
                    console.log("CHECKING ROLE", role);
                    console.log("IS VIP (or mod)", (msg.userInfo.isVip || msg.userInfo.isMod));
                    console.log("IS BROADCASTER", (msg.userInfo.isBroadcaster));
                    console.log("IS MOD", (msg.userInfo.isMod));
                    console.log("IS BOT", msg.userInfo.userName === process.env.BOT_USER_NAME.toLowerCase());
                    if (checkBroadcaster && msg.userInfo.isBroadcaster)
                        return true;
                    if (role === "vip" && (msg.userInfo.isVip || msg.userInfo.isMod))
                        return true;
                    if (role === "broadcaster" && msg.userInfo.isBroadcaster)
                        return true;
                    if (role === "moderator" && msg.userInfo.isMod)
                        return true;
                    if (role === "bot" && msg.userInfo.userName === process.env.BOT_USER_NAME.toLowerCase())
                        return true;
                    return false;
                }
                if (userLevel !== "Viewer") {
                    if (!checkPermission(userLevel.toLowerCase(), true))
                        return await reply(c, user, `You must be ${userLevel} or higher to do that!`, msg);
                }
                let content = customCmd.content;
                const regex = /\{([a-zA-Z]\w*)(?:\s+((?:\{[^{}]*\}|[^{}])+))?\}/gm;
                let match;
                const results = [];
                regex.lastIndex = 0;
                while ((match = regex.exec(content)) !== null) {
                    const fullMatch = match[0];
                    const tagName = match[1];
                    const tagContent = match[2] || "";
                    results.push({ fullMatch, tagName, tagContent });
                }
                for (const placeholder of results) {
                    let replaceWith = "";
                    const { tagName, tagContent, fullMatch } = placeholder;
                    switch (tagName) {
                        case "random": {
                            let randSplit = tagContent ? tagContent.split("-").map((i) => Number(i.trim())) : [0, 10];
                            let random = Math.floor(Math.random() * randSplit[1]);
                            if (random < randSplit[0])
                                random = random + (randSplit[0] - random);
                            replaceWith = random.toLocaleString();
                            break;
                        }
                        case "weatherin": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/gm);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "query") {
                                            query = query.replaceAll("{query}", args.join(" "));
                                        }
                                    }
                                });
                            try {
                                let forecast = await (0, util_1.getWeather)(query.trim() === "" ? "Hell norway" : query);
                                replaceWith = `${forecast.emoji} ${forecast.temperature_c}° C | ${forecast.temperature_f}° F in ${forecast.region}`;
                            }
                            catch (e) {
                                replaceWith = `Error Fetching Weather`;
                            }
                            break;
                        }
                        case "coinflip": {
                            let m1 = crypto.getRandomValues(new Uint8Array(1));
                            let rand = m1[0];
                            console.log(rand);
                            let isHeads = rand >= 100;
                            replaceWith = isHeads ? "Heads" : "Tails";
                            break;
                        }
                        case "sender": {
                            replaceWith = `${msg.userInfo.displayName}`;
                            break;
                        }
                        case "channel": {
                            replaceWith = channel;
                            break;
                        }
                        case "touser": {
                            let mention = args?.[0] || msg.userInfo.userName;
                            replaceWith = `${mention.replaceAll("@", "").toLowerCase()}`;
                            break;
                        }
                        case "game": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{sender}|{touser}/gm);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        console.log("ARG", arg);
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                        console.log("query", query);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "sender") {
                                            query = query.replaceAll("{sender}", `@${msg.userInfo.userName}`);
                                        }
                                        if (rawArgIndex.toLowerCase() === "touser") {
                                            let mention = args?.[0] || msg.userInfo.userName;
                                            query = query.replaceAll("{touser}", mention.replaceAll("@", ""));
                                        }
                                    }
                                });
                            try {
                                query = query.replaceAll("@", "");
                                if (query.trim() === "")
                                    query = channel;
                                let game = await (0, util_1.getGame)(query);
                                replaceWith = game || "Error Fetching Stream";
                            }
                            catch (e) {
                                replaceWith = `Error Fetching Stream`;
                            }
                            break;
                        }
                        case "shoutout": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{sender}|{touser}/gm);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        console.log("ARG", arg);
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                        console.log("query", query);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "sender") {
                                            query = query.replaceAll("{sender}", `${msg.userInfo.userName}`);
                                        }
                                        if (rawArgIndex.toLowerCase() === "touser") {
                                            let mention = args?.[0] || msg.userInfo.userName;
                                            query = query.replaceAll("{touser}", mention.replaceAll("@", ""));
                                        }
                                    }
                                });
                            try {
                                query = query.replaceAll("@", "");
                                let shout = await (0, util_1.shoutout)(query);
                                replaceWith = shout ? "" : "Error Shouting Out";
                            }
                            catch (e) {
                                replaceWith = `Error Shouting Out`;
                            }
                            break;
                        }
                        case "setgame": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "query") {
                                            query = query.replaceAll("{query}", args.join(" "));
                                        }
                                    }
                                });
                            try {
                                let gameSet = await (0, util_1.setGame)(query.trim());
                                replaceWith = gameSet ? gameSet : "Error Setting Game";
                            }
                            catch (e) {
                                replaceWith = `Error Setting Game`;
                            }
                            break;
                        }
                        case "settitle": {
                            console.log("SET TITLE", [tagName, tagContent]);
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "query") {
                                            query = query.replaceAll("{query}", args.join(" "));
                                        }
                                    }
                                });
                            try {
                                if (query.includes("{") || query.includes("}")) {
                                    replaceWith = "Title may not contain curly braces";
                                }
                                else {
                                    let titleSet = await (0, util_1.setTitle)(query.trim());
                                    replaceWith = titleSet ? titleSet : "Error Setting Title";
                                }
                            }
                            catch (e) {
                                replaceWith = `Error Setting Title`;
                            }
                            break;
                        }
                        case "settags": {
                            console.log("SET TAGS", [tagName, tagContent]);
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "query") {
                                            query = query.replaceAll("{query}", args.join(" "));
                                        }
                                    }
                                });
                            try {
                                if (query.includes("{") || query.includes("}")) {
                                    replaceWith = "Tags may not contain curly braces";
                                }
                                else {
                                    let tagSplit = query.split(",").map(q => q.trim().replaceAll(" ", ""));
                                    if (tagSplit.length > 0) {
                                        console.log("TAGS", tagSplit);
                                        let tagSet = await (0, util_1.setTags)(tagSplit);
                                        replaceWith = tagSet.length > 0 ? tagSet.join(", ") : "Error Setting Tags";
                                    }
                                    else
                                        replaceWith = "Error Setting Tags";
                                }
                            }
                            catch (e) {
                                replaceWith = `Error Setting Tags`;
                            }
                            break;
                        }
                        case "accountage": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{sender}|{touser}/gm);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        console.log("ARG", arg);
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                        console.log("query", query);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "sender") {
                                            query = query.replaceAll("{sender}", `@${msg.userInfo.userName}`);
                                        }
                                        if (rawArgIndex.toLowerCase() === "touser") {
                                            let mention = args?.[0] || msg.userInfo.userName;
                                            query = query.replaceAll("{touser}", mention.replaceAll("@", ""));
                                        }
                                    }
                                });
                            try {
                                query = query.replaceAll("@", "");
                                let user = await (0, util_1.getUser)(query !== "" ? query : msg.userInfo.userName);
                                replaceWith = user ? `${(0, util_1.timeAgo)(user.creationDate)}` : `Error Fetching User`;
                            }
                            catch (e) {
                                replaceWith = `Error Fetching User`;
                            }
                            break;
                        }
                        case "followage": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{sender}|{touser}/gm);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        console.log("ARG", arg);
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                        console.log("query", query);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "sender") {
                                            query = query.replaceAll("{sender}", `@${msg.userInfo.userName}`);
                                        }
                                        if (rawArgIndex.toLowerCase() === "touser") {
                                            let mention = args?.[0] || msg.userInfo.userName;
                                            query = query.replaceAll("{touser}", mention.replaceAll("@", ""));
                                        }
                                    }
                                });
                            try {
                                query = query.replaceAll("@", "");
                                let followedDate = await (0, util_1.getFollowedDate)(query !== "" ? query : msg.userInfo.userName);
                                replaceWith = followedDate ? `${(0, util_1.timeAgo)(followedDate)}` : `never`;
                            }
                            catch (e) {
                                replaceWith = `never`;
                            }
                            break;
                        }
                        case "urlfetch": {
                            let split = tagContent.split(" ");
                            let url = split?.[0];
                            let path = split?.[1];
                            let decode = (split?.[path ? 2 : 1] && split[path ? 2 : 1].toLowerCase() === "decode");
                            if (!url || url.trim() === "") {
                                replaceWith = "Invalid URL";
                            }
                            else {
                                try {
                                    let { data, status } = await (0, axios_1.get)(url);
                                    if (!data) {
                                        replaceWith = `Server responded with status ${status}`;
                                    }
                                    else {
                                        let finalVal = data;
                                        console.log("DATA", data);
                                        const keys = path ? path.split(".") : [];
                                        console.log("KEYS", keys);
                                        if (keys.length > 0) {
                                            for (const key of keys) {
                                                let checkKey = `${key}`;
                                                if (key.trim() !== "" && !Number.isNaN(Number(key)))
                                                    checkKey = Number(key);
                                                console.log("CHECK KEY", checkKey);
                                                if (finalVal && finalVal[checkKey] !== undefined) {
                                                    finalVal = finalVal[checkKey];
                                                }
                                                else {
                                                    finalVal = null;
                                                    break;
                                                }
                                            }
                                        }
                                        else if ((typeof data) === "string") {
                                            finalVal = data;
                                        }
                                        else
                                            finalVal = null;
                                        console.log("FINAL", finalVal);
                                        replaceWith = finalVal ? `${decode ? decodeURIComponent(finalVal) : finalVal}` : "Invalid Path";
                                    }
                                }
                                catch (e) {
                                    console.log(e);
                                    replaceWith = `Fetch Failed`;
                                }
                            }
                            break;
                        }
                        case "pin": {
                            console.log("PIN", [tagName, tagContent]);
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let query = tagContent;
                            if (replaceArgs && replaceArgs.length > 0)
                                replaceArgs.forEach(a => {
                                    let rawArgIndex = a.replace("{", "").replace("}", "");
                                    let argsIndex = Number(rawArgIndex);
                                    if (!Number.isNaN(argsIndex)) {
                                        let arg = args[argsIndex];
                                        query = query.replaceAll(`{${argsIndex}}`, arg);
                                    }
                                    else {
                                        if (rawArgIndex.toLowerCase() === "query") {
                                            query = query.replaceAll("{query}", args.join(" "));
                                        }
                                    }
                                });
                            try {
                                if (query.includes("{") || query.includes("}")) {
                                    replaceWith = "May not contain curly braces";
                                }
                                else {
                                    try {
                                        await sendAndPin(exports.client, user, query);
                                        replaceWith = query;
                                    }
                                    catch (e) {
                                        replaceWith = "Error Updating Pinned Message";
                                    }
                                }
                            }
                            catch (e) {
                                replaceWith = `Error Updating Pinned Message`;
                            }
                            break;
                        }
                    }
                    content = content.replace(`{${tagName}${tagContent ? ` ${tagContent}` : ""}}`, replaceWith);
                }
                reply(exports.client, user, content, msg);
            }
        }
        if (cmd.length > 0) {
            if (["discordserver", "disc", "dc", "discord"].includes(cmdNoPrefix))
                await runCommand(DiscordCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["tt", "tiktok", "clockapp",].includes(cmdNoPrefix))
                await runCommand(TiktokCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["roll", "gamble", "slots",].includes(cmdNoPrefix))
                await runCommand(GambleCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["points", "pts"].includes(cmdNoPrefix))
                await runCommand(PointsCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["addcmd", "ac", "addcommand",].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster))
                await runCommand(AddCommandCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["delcommand", "deletecommand", "removecommand", "delcmd"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster))
                await runCommand(DeleteCommandCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["editcmd", "editcommand", "changecommand", "ec"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster))
                await runCommand(EditCommandCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["setcode", "setroomcode", "src",].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster))
                await runCommand(SetRoomCodeCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["movecmd", "mvcommand", "swapcmd", "swapcommand", "movecommand"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster))
                await runCommand(MoveCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["code", "roomcode", "rc", "join", "lobby", "room"].includes(cmdNoPrefix))
                await runCommand(RoomCodeCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["raffle"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster))
                await runCommand(RaffleCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
            if (["nuke", "kms", "seppuku"].includes(cmdNoPrefix))
                await runCommand(NukeCommand_1.default, exports.client, user, content.split(cmd)[1], msg);
        }
    });
    c.onDisconnect((manually, reason) => {
        if (intervals.length > 0)
            intervals.forEach(i => clearInterval(i));
        console.log("Client Disconnected", reason ? reason : "No Reason");
    });
}
mongoose_1.default.connect(process.env.MONGO_URI, { appName: "coduh", dbName: "duh" }).then(() => {
    console.log(`MongoDB Connected`);
}).catch(e => {
    console.log(`MongoDB failed to connect`, e);
});
app.listen(process.env.PORT, (e) => {
    if (e) {
        console.log(`Webserver failed to connect`, e);
    }
    else {
        console.log(`Webserver connected`);
    }
});
//# sourceMappingURL=index.js.map