import "dotenv/config";
import { RefreshingAuthProvider, StaticAuthProvider } from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat"
import { get, post } from "axios";
import { ChatCommand, SearchedTrack, UserRolesStringMap } from "./classes/Types";
// import SongRequestCommand from "./commands/SongRequestCommand";
// import QueueCommand from "./commands/QueueCommand";
// import NowPlayingCommand from "./commands/NowPlayingCommand";
import DiscordCommand from "./commands/DiscordCommand";
import TiktokCommand from "./commands/TiktokCommand";
// import GoogleAPI from "./classes/GoogleAPI";
import scheduledMessages, { scheduledMessageTimeout } from "./data/scheduledMessages";
import mongoose from "mongoose";
import { customCommandModel } from "./models/command";
import AddCommandCommand from "./commands/AddCommandCommand";
import DeleteCommandCommand from "./commands/DeleteCommandCommand";
import EditCommandCommand from "./commands/EditCommandCommand";
import express, { json } from "express"
import apiRouter from "./routes/api";
import Socket from "./classes/Socket";
import { sessionModel } from "./models/session";
import { AuthRoute } from "./routes/auth";
import { Axios } from "axios";
import { userModel, UserRoles } from "./models/user";
import { ensureFileSync, readJSONSync } from "fs-extra";
import { join } from "path";
import { cwd } from "process";
import GambleCommandCommand from "./commands/GambleCommand";
import { ApiClient } from "@twurple/api";
import PointsCommand from "./commands/PointsCommand";
import SetRoomCodeCommand from "./commands/SetRoomCodeCommand";
import RoomCodeCommand from "./commands/RoomCodeCommand";
import { getWeather, pinMessage } from "./util";
import { readdirSync } from "fs";
import { createRaffleParticipant, deleteRaffle, getAllRaffles, getRaffleParticipants } from "./db/raffle";
import RaffleCommand from "./commands/RaffleCommand";
import { DBRaffle } from "./db/schema";

export interface SessionData {
    userId: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    obtainmentTimestamp: number;
}

export interface Channel {
    broadcasterId: string;
    broadcasterName: string;
    beerioSessionId: string | null;
}

export interface TokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string[];
    token_type: string[];
}

export const SOCIAL_LINKS = {
    "discord": "https://discord.com/invite/cTVvyh3zke",
    "twitch": "https://www.twitch.tv/coduh",
    "clockapp": "https://www.tiktok.com/@coduhz",
}

export const KNOWN_BOT_NAMES = ["streamelements", "nightbot", "fossabot", "moobot", "streamlabs"]

export const CHANNEL = process.env.CHANNEL;
let thirtyWarnings: Map<string, boolean> = new Map();
let fifteenWarnings: Map<string, boolean> = new Map();
let sevenWarnings: Map<string, boolean> = new Map();


// export const authProvider = new StaticAuthProvider(process.env.CLIENT_ID, process.env.TOKEN);
export const authProvider = new RefreshingAuthProvider({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });
export const apiClient = new ApiClient({ authProvider });

export const client: ChatClient = new ChatClient({ authProvider, channels: [CHANNEL], })
let clientReady = false;
// export const googleApi: GoogleAPI = new GoogleAPI(process.env.YOUTUBE_KEY);
export const websocket: Socket = new Socket(parseInt(process.env.SOCKET_PORT));

export const prefix = "!";

export const commandsMap: Map<string, ChatCommand> = new Map<string, ChatCommand>();

// export const BASE_URL = process.env.SPOTIFY_APP_URL;
// export const CHANNEL_REWARDS = {
//     spotify_test: "9bbed441-e8e2-47d7-9364-b519d1030206"
// }

setInterval(async () => {
    if (!client) {
        console.log(``)
        return;
    }
    // console.log(client.isConnected ? "Connected" : client.isConnecting ? "Connecting..." : "Not connected")
    if (!client.isConnected) {
        let botSession = await sessionModel.findOne({ userId: process.env.BOT_USER_ID });

        if (botSession) {
            let clientAuthDetail: { data: { data: any[] } } = { data: { data: null } };
            try {
                clientAuthDetail = await get(`https://api.twitch.tv/helix/users`, { headers: { "Authorization": `Bearer ${botSession.accessToken}`, "Client-Id": process.env.CLIENT_ID } })
            } catch (e) {
                clientAuthDetail = { data: { data: null } };
            }
            if (clientAuthDetail.data?.data?.[0]) {
                let ud = clientAuthDetail.data?.data?.[0];
                if (!authProvider.hasUser(ud.id)) {
                    console.log("BOT SESSION", botSession)
                    if (botSession.userId === ud.id) await authProvider.addUserForToken({
                        expiresIn: botSession.expiresIn, obtainmentTimestamp: botSession.obtainmentTimestamp, refreshToken: botSession.refreshToken, accessToken: botSession.accessToken
                    }, ['chat'])
                } else {
                    // await authProvider.addIntentsToUser(ud.id, ['chat'])
                    if (!client.isConnected) {
                        client.connect()
                        // await client.join(process.env.CHANNEL)
                        console.log(`Connecting to Chat`)
                        if (!clientReady) {
                            clientReady = true;
                            await initBot(client);
                            let botDbUser = await userModel.findOne({ twitchId: ud.id });
                            if (!botDbUser) {
                                await userModel.create({ twitchId: ud.id, discordId: null, points: 0, role: UserRoles.BOT })
                            }
                        }
                    }
                }
            } else {
                console.log(`Re-Authorize Client - Could not fetch authorization details`)
            }
        } else {
            console.log(`Re-Authorize Client - Session not found`)
        }

    } else {
        let raffles = getAllRaffles();
        raffles = raffles.filter(r => !r.winner_id);

        
        if(raffles.length <= 0) {
            if(sevenWarnings.size > 0) sevenWarnings.clear();
            if(fifteenWarnings.size > 0) fifteenWarnings.clear();
            if(fifteenWarnings.size > 0) thirtyWarnings.clear();
        } else {
            console.log("RAFFLES", raffles);
        }


        for (let i = 0; i < raffles.length; i++) {
            const raffle = raffles[i];
            let thirtySeconds = Date.now() + (30e3);
            let fifteenSeconds = Date.now() + (15e3);
            let sevenSeconds = Date.now() + (7e3);

            let raffleExpiration = raffle.expires_at.getTime();

            if(raffleExpiration <= thirtySeconds && !thirtyWarnings.has(raffle.id)) {
                thirtyWarnings.set(raffle.id, true);
                await reply(client, null, `The raffle expires in 30 seconds`)
            }

            if(raffleExpiration <= fifteenSeconds && !fifteenWarnings.has(raffle.id)) {
                fifteenWarnings.set(raffle.id, true);
                await reply(client, null, `The raffle expires in 15 seconds`)
            }

            if(raffleExpiration <= sevenSeconds && !sevenWarnings.has(raffle.id)) {
                sevenWarnings.set(raffle.id, true);
                await reply(client, null, `The raffle expires in 7 seconds`)
            }

            if(raffleExpiration <= Date.now()) {
                let participants = getRaffleParticipants(raffle.id);
                if(!raffle.winner_id) {
                    if(participants && participants.length > 0) {
                        let randomInd = Math.floor(Math.random() * participants.length);
                        let winnerId = participants[randomInd] || participants[0];
                        let winner = await apiClient.users.getUserById(winnerId);
                        if(winner) {
                            let dbUser = await userModel.findOne({twitchId: winner.id});
                            if(!dbUser) {
                                let newUser = new userModel({
                                    twitchId: winner.id,
                                    points: raffle.points,
                                    role: UserRoles.DEFAULT
                                })

                                await newUser.save();
                            } else {
                                dbUser.set("points", dbUser.points + raffle.points);
                                await dbUser.save();
                            }
                            deleteRaffle(raffle.id);
                            await reply(client, null, `FBtouchdown @${winner.displayName} won the raffle for ${raffle.points.toLocaleString()} point${raffle.points === 1 ? "" : "s"}!`)

                        } else {
                            await reply(client, null, `StinkyCheese The raffle winner had a heart attack and fucking died`);
                            deleteRaffle(raffle.id);
                        }

                    } else {
                        await reply(client, null, `Nobody entered the raffle NotLikeThis`);
                        deleteRaffle(raffle.id);
                    }
                } else deleteRaffle(raffle.id);
            }
        }
    }
}, 1e3)

let intervals: NodeJS.Timeout[] = [];

const app = express()

export function reply(c: ChatClient, user: string | null, content, msg?: ChatMessage): void {
    if (!msg) apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content)
    if (msg) apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content, { replyParentMessageId: msg.id })
}

export async function sendAndPin(c: ChatClient, user, content) {
    apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content).then(async m => {
        console.log("sent message via helix ", m.id)
        await pinMessage(m.id);
    }).catch(e => {
        console.log("Failed to send chat message via Helix", e)
    })
}

export async function runCommand(command: ChatCommand, c, user, content, msg) {
    if (!command.enabled) return;
    await command.run(c, user, content, msg)
}

authProvider.onRefresh(async (userId, tokenData) => await sessionModel.findOneAndUpdate({ userId: userId }, tokenData));

app.use(json());
app.use("/api", apiRouter)
app.use("/auth", AuthRoute)

async function initBot(c) {
    c.onConnect(async () => {
        console.log("Initializing Local Websocket Server")
        if (client.isConnected && !websocket.initialized) await websocket.initServerAndSocket();

        console.log("Loading Commands Map...")
        readdirSync(join(process.cwd(), "src", "commands")).forEach(file => {
            let command: ChatCommand = (require(join(process.cwd(), "src", "commands", file))).default;
            if (command && command.help && command.enabled) {
                let cmdCopy = command;
                cmdCopy.userLevel = UserRolesStringMap[`${cmdCopy.userLevel}`] as any;
                commandsMap.set(file.split(".")[0].toLowerCase(), cmdCopy);
            }
        })

        // console.log(`Initializing Youtube API`)
        // await googleApi.initYoutube()
        console.log(`Client Connected!`)
        // await client.join(CHANNEL)
        // scheduledMessages.forEach(async sm => {
        // let stream = await apiClient.streams.getStreamByUserName(process.env.CHANNEL);
        let stream = true;
        if (scheduledMessages.length > 0 && stream) {
            let int = await setInterval(async () => {
                let filtered = await Promise.all(scheduledMessages.filter(async m => (await m.getContent()) !== null));
                let rand = Math.floor(Math.random() * filtered.length);

                let sm = scheduledMessages[rand];

                let content = await sm.getContent()
                if (content) await apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content)
            }, scheduledMessageTimeout)
            intervals.push(int);
        }
        // })
    })
    c.onJoin((channel, user) => {
        console.log(`[${user}] Joined Channel -> ${channel}`)
    })



    c.onMessage(async (channel, user, content, msg: ChatMessage) => {
        let pointsBackupPath = join(cwd(), "data", "streamElementsExport.json");
        console.log(pointsBackupPath)

        ensureFileSync(pointsBackupPath);

        let isBot = [...KNOWN_BOT_NAMES, process.env.BOT_USER_NAME].includes(user.toLowerCase());

        console.log(content)

        let dbUser = await userModel.findOne({ twitchId: msg.userInfo.userId });
        if (!dbUser) {
            let pointsJson: { _total: number; users: { username: string; points: number; }[] } | null = null;
            try {
                pointsJson = readJSONSync(pointsBackupPath)
            } catch (e) {
                pointsJson = null;
            }
            let userPoints = pointsJson && pointsJson?.users && pointsJson.users.find(u => u.username.toLowerCase() === msg.userInfo.userName.toLowerCase()) ? pointsJson.users.find(u => u.username.toLowerCase() === msg.userInfo.userName.toLowerCase()).points : 0;

            let points = isBot ? 0 : userPoints;
            let role = UserRoles.DEFAULT;
            if (msg.userInfo.isVip) role = UserRoles.VIP;
            if (msg.userInfo.isMod) role = UserRoles.MOD;
            if (msg.userInfo.isBroadcaster) role = UserRoles.BROADCASTER;
            if (isBot) role = UserRoles.BOT;

            await userModel.create({ twitchId: msg.userInfo.userId, discordId: null, points: points, role: role });
        } else {
            let role = UserRoles.DEFAULT;
            if (msg.userInfo.isVip) role = UserRoles.VIP;
            if (msg.userInfo.isMod) role = UserRoles.MOD;
            if (msg.userInfo.isBroadcaster) role = UserRoles.BROADCASTER;
            if (isBot) role = UserRoles.BOT;
            dbUser.role = role;

            await dbUser.save();
        }

        if (isBot) return;

        if(!content.startsWith(prefix) && content.trim().toLowerCase().startsWith("pickme")) {
            // Raffles
            let raffle = getAllRaffles()?.[0];
            if(raffle) {
                let participants = getRaffleParticipants(raffle.id);
                if(!participants.some(p => p.id === msg.userInfo.userId)) {
                    createRaffleParticipant({raffle_id: raffle.id, id: msg.userInfo.userId});
                    await reply(client, user, `@${msg.userInfo.displayName} joined the raffle for ${raffle.points.toLocaleString()} point${raffle.points === 1 ? "" : "s"}! Type "pickme" in chat for a chance to win!`, msg);
                }
            }
        }

        console.log(`[${channel}] Message Sent by ${user} -> ${content}`)
        let cmd = content.toLowerCase().split(/ +/)[0]
        let args: string[] = content.replace(cmd, "").trim().split(" ");

        let cmdNoPrefix = cmd.replace(prefix, "");

        const commands = await customCommandModel.find();
        if (commands !== null || commands.length > 0) {
            let customCmd = commands.find(c => c.trigger.toLowerCase() === cmd);
            if (customCmd) {
                let content = customCmd.content;

                // let regex = new RegExp(/((?:\{)([a-zA-Z]*)( ?)(.*)\b(?:\}))/gm);
                let regex = /\{([a-zA-Z]\w*)( ({?[^{}]*)}?)?\}/gm;

                let placeholders: string[][] | RegExpMatchArray = content.match(regex);
                console.log(placeholders)
                if(placeholders && placeholders.length > 0) placeholders = placeholders.map(p => {
                    let split = p.replace("{", "").replace("}", "").split(/ +/);
                    let plName = split[0];
                    split.shift();

                    return [plName, split[0] ? split.join(" ") : null];
                });

                console.log(placeholders)

                

                for (let i = 0; i < placeholders?.length || 0; i++) {
                    const pl = placeholders[i];

                    let replaceWith = "";
                    switch (pl[0]) {
                        case "random": {
                            let randSplit: number[] = pl[1] ? pl[1].split("-").map(i => Number(i)) : [0, 10];

                            let random = Math.floor(Math.random() * randSplit[1]);
                            if (random < randSplit[0]) random = random + (randSplit[0] - random);
                            replaceWith = random.toLocaleString();
                            break;
                        }

                        case "weatherin": {
                            let replaceArgs = pl[1].match(/{[0-9]}|{query}/gm);
                            let query = pl[1];

                            console.log("REPLACE", replaceArgs)

                            if(replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {
                                
                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if(!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    console.log("ARG",arg)
                                    query = pl[1].replaceAll(`{${argsIndex}}`, arg);
                                    console.log("query", query);
                                } else {
                                    if(rawArgIndex.toLowerCase() === "query") {
                                    console.log("ARG","QUERY")
                                        query = pl[1].replaceAll("{query}", args.join(" "));
                                        console.log("query", query);
                                    }
                                }
                            })

                            try {
                                let forecast = await getWeather(query.trim() === "" ? "Hell norway" : query);
                                replaceWith = `${forecast.temperature_c}° C | ${forecast.temperature_f}° F in ${forecast.region}`
                            } catch(e) {
                                replaceWith = `Error Fetching Weather`
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
                            replaceWith = `@${msg.userInfo.displayName}`;
                            break;
                        }
                    }
                    content = content.replace(`{${pl[0]}${pl[1] ? ` ${pl[1]}` : ""}}`, replaceWith)
                }

                // placeholders.forEach(async pl => {

                // })

                reply(client, user, content, msg);
            }
        }

        if (cmd.length > 0) {
            // if (["sr", "songrequest"].includes(cmdNoPrefix)) await runCommand(SongRequestCommand, client, user, content.split(cmd)[1], msg)
            // if (["q", "queue", "songs", "songlist"].includes(cmdNoPrefix)) await runCommand(QueueCommand, client, user, content.split(cmd)[1], msg)
            // if (["np", "current", "song", "playing", "nowplaying"].includes(cmdNoPrefix)) await runCommand(NowPlayingCommand, client, user, content.split(cmd)[1], msg)
            if (["discordserver", "disc", "dc", "discord"].includes(cmdNoPrefix)) await runCommand(DiscordCommand, client, user, content.split(cmd)[1], msg)
            // if (["inst", "gram", "insta", "instagram"].includes(cmdNoPrefix)) await runCommand(InstagramCommand, client, user, content.split(cmd)[1], msg)
            // if (["yt", "tube", "youtube", "videos"].includes(cmdNoPrefix)) await runCommand(YoutubeCommand, client, user, content.split(cmd)[1], msg)
            if (["tt", "tiktok", "clockapp",].includes(cmdNoPrefix)) await runCommand(TiktokCommand, client, user, content.split(cmd)[1], msg)
            if (["roll", "gamble", "slots",].includes(cmdNoPrefix)) await runCommand(GambleCommandCommand, client, user, content.split(cmd)[1], msg)
            if (["points", "pts"].includes(cmdNoPrefix)) await runCommand(PointsCommand, client, user, content.split(cmd)[1], msg)
            if (["addcmd", "ac", "addcommand",].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(AddCommandCommand, client, user, content.split(cmd)[1], msg)
            if (["delcommand", "deletecommand", "removecommand", "delcmd"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(DeleteCommandCommand, client, user, content.split(cmd)[1], msg)
            if (["editcmd", "editcommand", "changecommand",].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(EditCommandCommand, client, user, content.split(cmd)[1], msg)
            if (["setcode", "setroomcode", "src",].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(SetRoomCodeCommand, client, user, content.split(cmd)[1], msg)
            if (["code", "roomcode", "rc", "join", "lobby", "room"].includes(cmdNoPrefix)) await runCommand(RoomCodeCommand, client, user, content.split(cmd)[1], msg)
            if (["raffle"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(RaffleCommand, client, user, content.split(cmd)[1], msg)
            // if (["join"].includes(cmdNoPrefix)) await runCommand(JoinCommand, client, user, content.split(cmd)[1], msg)

        }


    })

    c.onDisconnect((manually, reason) => {
        if (intervals.length > 0) intervals.forEach(i => clearInterval(i))
        console.log("Client Disconnected", reason ? reason : "No Reason")
    })
}



// async function loadCustomCommands(c: ChatClient, channel: string) {


//     console.log(`Attempting to load ${commands.length} custom commands\n${commands.map(l => `${l.trigger}`).join(", ")}`)

//     c.onMessage((ch, us, ct, msg) => {
//         if(ch !== channel) return;
//         let cmd = ct.toLowerCase().split(/ +/)[0]
//         let customCmd = commands.find(c => c.trigger.toLowerCase() === cmd);
//         if(!customCmd) return;

//     })
// }
mongoose.connect(process.env.MONGO_URI, { appName: "coduh", dbName: "duh" }).then(() => {
    console.log(`MongoDB Connected`)
}).catch(e => {
    console.log(`MongoDB failed to connect`, e)
})
app.listen(process.env.PORT, (e) => {
    if (e) {
        console.log(`Webserver failed to connect`, e)
    } else {
        console.log(`Webserver connected`)
    }
})