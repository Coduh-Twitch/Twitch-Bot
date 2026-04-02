import "dotenv/config";
import { RefreshingAuthProvider, StaticAuthProvider } from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat"
import { get, post } from "axios";
import { ChatCommand, SearchedTrack } from "./classes/Types";
// import SongRequestCommand from "./commands/SongRequestCommand";
// import QueueCommand from "./commands/QueueCommand";
// import NowPlayingCommand from "./commands/NowPlayingCommand";
import DiscordCommand from "./commands/DiscordCommand";
import TiktokCommand from "./commands/TiktokCommand";
// import GoogleAPI from "./classes/GoogleAPI";
// import scheduledMessages from "./data/scheduledMessages";
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

// export const authProvider = new StaticAuthProvider(process.env.CLIENT_ID, process.env.TOKEN);
export const authProvider = new RefreshingAuthProvider({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });
export const apiClient = new ApiClient({authProvider});

export const client: ChatClient = new ChatClient({ authProvider, channels: [CHANNEL], })
let clientReady = false;
// export const googleApi: GoogleAPI = new GoogleAPI(process.env.YOUTUBE_KEY);
export const websocket: Socket = new Socket(parseInt(process.env.SOCKET_PORT));

export const prefix = "!";

export const BASE_URL = process.env.SPOTIFY_APP_URL;
export const CHANNEL_REWARDS = {
    spotify_test: "9bbed441-e8e2-47d7-9364-b519d1030206"
}

setInterval(async () => {
    if (!client) {
        console.log(``)
        return;
    }
    console.log(client.isConnected ? "Connected" : client.isConnecting ? "Connecting..." : "Not connected")
    if (!client.isConnected) {
        let botSession = await sessionModel.findOne({ userId: process.env.BOT_USER_ID });

        if (botSession) {
            let clientAuthDetail: { data: { data: any[] } } = await get(`https://api.twitch.tv/helix/users`, { headers: { "Authorization": `Bearer ${botSession.accessToken}`, "Client-Id": process.env.CLIENT_ID } })
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
                            let botDbUser = await userModel.findOne({twitchId: ud.id});
                            if(!botDbUser) {
                                await userModel.create({twitchId: ud.id, discordId: null, points: 0, role: UserRoles.BOT})
                            }
                        }
                    }
                }
                // console.log(authProvider.getCurrentScopesForUser(ud.id))
                // if (authProvider.getCurrentScopesForUser(ud.id) !== ud.scopes) {
                //     console.log(`Re-Authorize Client - Scopes do not match`)
                // } else {
                // }
            } else {
                console.log(`Re-Authorize Client - Could not fetch authorization details`)
            }
        } else {
            console.log(`Re-Authorize Client - Session not found`)
        }

    } else {

    }
}, 1e3)

let intervals: NodeJS.Timeout[] = [];

const app = express()

export function reply(c, user, content, msg?: ChatMessage): void {
    if (!msg) c.say(CHANNEL, `@${user} -> ${content}`)
    if (msg) c.say(CHANNEL, `${content}`, { replyTo: msg.id })
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
        // console.log(`Initializing Youtube API`)
        // await googleApi.initYoutube()
        console.log(`Client Connected!`)
        // await client.join(CHANNEL)
        // scheduledMessages.forEach(async sm => {

        //     if (sm.enabled) {
        //         let int = await setInterval(async () => {
        //             await client.action(CHANNEL, sm.content)
        //         }, sm.interval_ms)
        //         intervals.push(int);
        //     }
        // })

        // console.log(`Loaded ${scheduledMessages.filter(s => s.enabled !== false).length} scheduled message${scheduledMessages.filter(s => s.enabled !== false).length === 1 ? `` : `s`} (${scheduledMessages.filter(s => s.enabled !== true).length} disabled)`)
        // await loadCustomCommands(client, CHANNEL);
    })
    c.onJoin((channel, user) => {
        console.log(`[${user}] Joined Channel -> ${channel}`)
    })



    c.onMessage(async (channel, user, content, msg: ChatMessage) => {
        let pointsBackupPath = join(cwd(), "data", "streamElementsExport.json");
        console.log(pointsBackupPath)
        // if(msg.rewardId !== null) {
        //     if(msg.rewardId === CHANNEL_REWARDS.spotify_test) await runCommand(SongRequestCommand, client, user, content, msg)
        //     return;
        // }

        ensureFileSync(pointsBackupPath);

        let isBot = [...KNOWN_BOT_NAMES, process.env.BOT_USER_NAME].includes(user.toLowerCase());

        let dbUser = await userModel.findOne({twitchId: msg.userInfo.userId});
        if(!dbUser) {
            let pointsJson: {_total: number; users: {username: string; points: number;}[]} | null = null;
            try {
                pointsJson = readJSONSync(pointsBackupPath)
            } catch(e) {
                pointsJson = null;
            }
            let userPoints = pointsJson && pointsJson?.users && pointsJson.users.find(u => u.username.toLowerCase() === msg.userInfo.userName.toLowerCase()) ? pointsJson.users.find(u => u.username.toLowerCase() === msg.userInfo.userName.toLowerCase()).points : 0;

            let points = isBot ? 0 : userPoints;
            let role = UserRoles.DEFAULT;
            if(msg.userInfo.isVip) role = UserRoles.VIP;
            if(msg.userInfo.isMod) role = UserRoles.MOD;
            if(msg.userInfo.isBroadcaster) role = UserRoles.BROADCASTER;
            if(isBot) role = UserRoles.BOT;

            await userModel.create({twitchId: msg.userInfo.userId, discordId: null, points: points, role: role});
        } else {
            let role = UserRoles.DEFAULT;
            if(msg.userInfo.isVip) role = UserRoles.VIP;
            if(msg.userInfo.isMod) role = UserRoles.MOD;
            if(msg.userInfo.isBroadcaster) role = UserRoles.BROADCASTER;
            if(isBot) role = UserRoles.BOT;
            dbUser.role = role;

            await dbUser.save();
        }

        if(isBot) return;

        console.log(`[${channel}] Message Sent by ${user} -> ${content}`)
        let cmd = content.toLowerCase().split(/ +/)[0]

        let cmdNoPrefix = cmd.replace(prefix, "");

        const commands = await customCommandModel.find();
        if (commands !== null || commands.length > 0) {
            let customCmd = commands.find(c => c.trigger.toLowerCase() === cmd);
            if (customCmd) {
                reply(client, user, customCmd.content, msg);
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