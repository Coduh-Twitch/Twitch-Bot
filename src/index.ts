import "dotenv/config";
import { RefreshingAuthProvider, StaticAuthProvider } from "@twurple/auth";
import { ChatClient, ChatMessage, ChatUser } from "@twurple/chat"
import axios, { AxiosError, get, post } from "axios";
import { ChatCommand, SearchedTrack, TwitchUser, UserRolesStringMap } from "./classes/Types";
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
import { ApiClient, HelixUser } from "@twurple/api";
import PointsCommand from "./commands/PointsCommand";
import SetRoomCodeCommand from "./commands/SetRoomCodeCommand";
import RoomCodeCommand from "./commands/RoomCodeCommand";
import { getFollowedDate, getGame, getUser, getWeather, pinMessage, setGame, setTags, setTitle, shoutout, timeAgo } from "./util";
import { readdirSync } from "fs";
import { createRaffleParticipant, deleteRaffle, getAllRaffles, getRaffleParticipants } from "./db/raffle";
import RaffleCommand from "./commands/RaffleCommand";
import { DBRaffle, timer } from "./db/schema";
import MoveCommandCommand from "./commands/MoveCommand";
import { EventSubWsListener } from "@twurple/eventsub-ws";
import NukeCommand from "./commands/NukeCommand";
import TimerCommand from "./commands/TimerCommand";
import { getTimer, setTimerLabel, setTimerPaused, setTimerSeconds, setTimerVisibility } from "./db/timer";
import moment from "moment";
import NoticeCommand from "./commands/NoticeCommand";

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

let gifterCounts: Map<string | undefined, number> = new Map();

let lastScheduledMessage = "";


// export const authProvider = new StaticAuthProvider(process.env.CLIENT_ID, process.env.TOKEN);
export const authProvider = new RefreshingAuthProvider({ clientId: process.env.CLIENT_ID, clientSecret: process.env.CLIENT_SECRET });
export const apiClient = new ApiClient({ authProvider });

// Broadcaster Auth
export let broadcasterAuthProvider: StaticAuthProvider | null = null;
export let broadcasterApiClient: ApiClient | null = null;
export let broadcasterEventSub: EventSubWsListener | null = null;

export const client: ChatClient = new ChatClient({ authProvider, channels: [CHANNEL], })
export const clientEventSub: EventSubWsListener = new EventSubWsListener({ apiClient });
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
    let tokenUser = broadcasterApiClient ? await broadcasterApiClient.users.getUserById(process.env.CHANNEL_ID) : null;

    if(!tokenUser && broadcasterApiClient !== null) {
        broadcasterApiClient = null;
        broadcasterAuthProvider = null;
        broadcasterEventSub = null;
    }
    if (!client) {
        console.log(``)
        return;
    }
    if (!broadcasterAuthProvider || !broadcasterApiClient || !broadcasterEventSub) {
        console.log("Initializing Broadcaster auth provider")
        let sessionRes = await get(`${process.env.WEB_URL}/api/session?key=${process.env.CLIENT_SECRET}`);
        console.log("SESSION", sessionRes.data)
        if (!sessionRes || !sessionRes.data || !sessionRes.data?.data) {
            console.log(`Broadcaster Auth Session not found.`)
        } else {
            let session: { user: TwitchUser | null; access_token: string | null; } = sessionRes.data.data;
            if (session.user && session.access_token) {
                if (session.user.id === process.env.CHANNEL_ID) {

                    console.log(`Loading session for @${session.user.display_name}`);
                    broadcasterAuthProvider = new StaticAuthProvider(process.env.CLIENT_ID, session.access_token);
                    broadcasterApiClient = new ApiClient({ authProvider: broadcasterAuthProvider });
                    broadcasterEventSub = new EventSubWsListener({ apiClient: broadcasterApiClient });
                    broadcasterEventSub.start();
                } else {
                    console.log(`Broadcaster Auth ID does not match environment variable ${session.user.id} / ${process.env.CHANNEL_ID}`)
                }
            } else {
                console.log(`Broadcaster Auth Session not found.`)
            }
        }
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
                            clientEventSub.start();
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


        if (raffles.length <= 0) {
            if (sevenWarnings.size > 0) sevenWarnings.clear();
            if (fifteenWarnings.size > 0) fifteenWarnings.clear();
            if (fifteenWarnings.size > 0) thirtyWarnings.clear();
        } else {
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
                await reply(client, null, `The raffle expires in 30 seconds`)
            }

            if (raffleExpiration <= fifteenSeconds && !fifteenWarnings.has(raffle.id)) {
                fifteenWarnings.set(raffle.id, true);
                await reply(client, null, `The raffle expires in 15 seconds`)
            }

            if (raffleExpiration <= sevenSeconds && !sevenWarnings.has(raffle.id)) {
                sevenWarnings.set(raffle.id, true);
                await reply(client, null, `The raffle expires in 7 seconds`)
            }

            if (raffleExpiration <= Date.now()) {
                let participants = getRaffleParticipants(raffle.id);
                if (!raffle.winner_id) {
                    if (participants && participants.length > 0) {
                        let randomInd = Math.floor(Math.random() * participants.length);
                        let winnerId = participants[randomInd] || participants[0];
                        let winner = await apiClient.users.getUserById(winnerId);
                        if (winner) {
                            let dbUser = await userModel.findOne({ twitchId: winner.id });
                            if (!dbUser) {
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

        await pinMessage(m);
    }).catch(e => {
        console.log("Failed to send chat message via Helix", e)
    })
}

export async function unpinMessage(): Promise<void> {
    let session = await sessionModel.findOne({userId: process.env.BOT_USER_ID});
    if(!session) return;

    let headers = {
        "Authorization": `Bearer ${session.accessToken}`,
        "Client-Id": process.env.CLIENT_ID
    }

    let pinnedMessage = (await get(`https://api.twitch.tv/helix/chat/pins?broadcaster_id=${process.env.CHANNEL_ID}&moderator_id=${process.env.BOT_USER_ID}`, {headers})).data?.data?.[0] || null;
    if(!pinnedMessage || !pinnedMessage.message_id) return;

    try {
        (await axios.delete(`https://api.twitch.tv/helix/chat/pins?broadcaster_id=${process.env.CHANNEL_ID}&moderator_id=${process.env.BOT_USER_ID}&message_id=${pinnedMessage.message_id}`, {headers}))
    } catch(e) {
        console.log("failed to unpin message", e)
    }
}

export async function runCommand(command: ChatCommand, c, user, content, msg) {
    if (!command.enabled) return;
    await command.run(c, user, content, msg)
}

export function userHasAuthority(user: ChatUser): boolean {
    return [user.isMod, user.isBroadcaster].includes(true);
}

authProvider.onRefresh(async (userId, tokenData) => await sessionModel.findOneAndUpdate({ userId: userId }, tokenData));

app.use(json());
app.use("/api", apiRouter)
app.use("/auth", AuthRoute)

async function initBot(c: ChatClient) {
    // Timers
    setInterval(async () => {
        let timer = getTimer();
        if (!timer.paused && timer.seconds > 0) {
            let set = setTimerSeconds(timer.seconds - 1);
        }
    }, 1e3);

    // Hand out points to all chatters
    setInterval(async () => {
        let stream = await apiClient.streams.getStreamByUserId(process.env.BOT_USER_ID);

        if(stream) {

            let chatters = await apiClient.asUser(process.env.BOT_USER_ID, async ctx => {
                return await ctx.chat.getChatters(process.env.CHANNEL_ID);
            });
            if(chatters.data) {
                console.log(`Found ${chatters.total} chatter(s)`)
                for(const chatter of chatters.data) {
                    let basePoints = 200;
                    let randomPoints = Math.floor(Math.random() * 100);
                    let points = basePoints + randomPoints;
                    
                    let dbChatter = await userModel.findOne({twitchId: chatter.userId});
                    if(!dbChatter) {
                        let newChatter = new userModel({
                            twitchId: chatter.userId,
                            role: UserRoles.DEFAULT,
                            points: points
                        });
                        
                        await newChatter.save()
                        
                        console.log(`Created DB entry for chatter ${chatter.userDisplayName}`)
                    } else {
                        dbChatter.set("points", dbChatter.points + points);
                        await dbChatter.save();
                        console.log(`Update DB entry for chatter ${chatter.userDisplayName} (+${points} pts)`)
                    }
                }
            }
        } else {
            console.log(`Stream offline - Skipping point handout`)
        }

    },300e3);

    if (clientEventSub && broadcasterEventSub) {
        // EventSub
        clientEventSub.onChannelFollow(process.env.CHANNEL_ID, process.env.BOT_USER_ID, async (ev) => {
            await reply(c, ev.userDisplayName, `DinoDance Thank you for the follow @${ev.userDisplayName}!`);
        })

        clientEventSub.onChannelShoutoutReceive(process.env.CHANNEL_ID, process.env.BOT_USER_ID, async ev => {
            await reply(c, ev.shoutingOutBroadcasterDisplayName, `@${ev.shoutingOutBroadcasterDisplayName} just shouted out the channel! Give them a follow! -> twitch.tv/${ev.shoutingOutBroadcasterDisplayName}`)
        })

        broadcasterEventSub.onChannelVipAdd(process.env.CHANNEL_ID, async ev => {
            await reply(c, ev.userDisplayName, `DinoDance @${ev.userDisplayName} was given VIP! New shiny diamond!`);
        })

        broadcasterEventSub.onChannelHypeTrainBeginV2(process.env.CHANNEL_ID, async ev => {
            await reply(c, ev.broadcasterName, `TwitchConHYPE HYPE TRAIN! A level ${ev.level} Hype Train has started! PogChamp`)
        })


        broadcasterEventSub.onStreamOnline(process.env.CHANNEL_ID, async ev => {
            let stream = await ev.getStream();
            await reply(c, ev.broadcasterDisplayName, `@${ev.broadcasterDisplayName} is now live! "${stream.title}" -> Playing "${stream.gameName}"!`)
        })
    }

    // Chat Client

    c.onConnect(async () => {
        let dev = process.argv.includes("-dev");
        console.log("Initializing Local Websocket Server")
        if (client.isConnected && !websocket.initialized) await websocket.initServerAndSocket();

        console.log("Loading Commands Map...")
        let dirPath = join(process.cwd(), `${dev ? "src" : "dist/src"}`, "commands")
        console.log("Checking Commands Dir", dirPath)
        readdirSync(dirPath).filter(file => file.endsWith(dev ? ".ts" : ".js")).forEach(file => {
            let command: ChatCommand = (require(join(dirPath, file))).default;
            if (command && command.help && command.enabled) {
                let cmdCopy = command;
                cmdCopy.userLevel = UserRolesStringMap[`${cmdCopy.userLevel}`] as any;
                (cmdCopy.subCommands || []).forEach(subcommand => {
                    subcommand.userLevel = UserRolesStringMap[`${subcommand.userLevel}`] as any;
                })
                commandsMap.set(file.split(".")[0].toLowerCase(), cmdCopy);
            }
        })

        // console.log(`Initializing Youtube API`)
        // await googleApi.initYoutube()
        console.log(`Client Connected!`)
        // await client.join(CHANNEL)
        // scheduledMessages.forEach(async sm => {
        let stream = await apiClient.streams.getStreamByUserName(process.env.CHANNEL);
        // let stream = true;
        if (scheduledMessages.length > 0 && stream) {
            let int = await setInterval(async () => {
                let filtered = await Promise.all(scheduledMessages.filter(async m => (await m.getContent()) !== null));
                let rand = Math.floor(Math.random() * filtered.length);

                let sm = scheduledMessages[rand];

                if (lastScheduledMessage !== sm.id) {
                    lastScheduledMessage = sm.id;
                    let content = await sm.getContent()
                    if (content) await apiClient.chat.sendChatMessageAsApp(process.env.BOT_USER_ID, process.env.CHANNEL_ID, content)
                }

            }, scheduledMessageTimeout)
            intervals.push(int);
        }
        // })
    })
    c.onJoin((channel, user) => {
        console.log(`[${user}] Joined Channel -> ${channel}`)
    })

    c.onRaid(async (channel, raider, raid, msg) => {
        let game = await getGame(raider);
        reply(c, null, `DinoDance @${raider} thank you for the RAID! ${raider} just brought in ${raid.viewerCount.toLocaleString()} viewer${raid.viewerCount === 1 ? "" : "s"}${game ? ` from their ${game} stream!` : "!"} PewPewPew`)
    })

    c.onResub(async (channel, user, sub, msg) => {
        if ((sub.streak || 0) > 1) await reply(c, user, `@${user} just resubscribed ${sub.isPrime ? "for free with Twitch Prime! PrimeMe" : `at Tier ${(Number(sub.plan) || 1000) / 1000}! DinoDance`} They've been subscribed for ${sub.streak || 1} month${(sub.streak || 1) === 1 ? "" : "s"}`)
    })

    c.onSubGift(async (channel, user, sub, msg) => {
        const gifterName = sub.gifter;
        const giftCount = gifterCounts.get(gifterName) ?? 0;
        if (giftCount > 0) {
            gifterCounts.set(gifterName, giftCount - 1);
        } else {
            await reply(c, user, `${gifterName || "Anonymous"} gifted a Tier ${(Number(sub.plan) || 1000) / 1000} sub to @${sub.displayName}! DinoDance`)
        }
    })

    c.onCommunitySub(async (channel, user, sub, msg) => {
        const giftCount = gifterCounts.get(user) ?? 0;
        gifterCounts.set(user, giftCount - 1);
        await reply(c, user, `${user || "Anonymous"} gifted ${sub.count} Tier ${(Number(sub.plan) || 1000) / 1000} sub${sub.count === 1 ? "" : "s"} to the community! DinoDance`)

    })

    c.onSub(async (channel, user, sub, msg) => {
        await reply(c, user, `@${user} just subscribed ${sub.isPrime ? "for free with Twitch Prime! PrimeMe" : `at Tier ${(Number(sub.plan) || 1000) / 1000}! DinoDance`}`)
    })

    c.onSlow(async (channel, slowEnabled, slowDelay) => {
        if (slowEnabled) {
            c.say(channel, `⏱️ ${slowDelay ? `A ${slowDelay}s slowmode has been enabled.` : `Slowmode has been enabled.`}`)
        } else {
            c.say(channel, "⏱️ Slowmode has been disabled!")
        }
    })

    c.onFollowersOnly(async (channel, enabled, timeRequired) => {
        c.say(channel, `💜 Follower-Only mode has been ${enabled ? `enabled` : `disabled`}!${timeRequired ? ` Chatters must follow for at least ${timeRequired} minute${timeRequired === 1 ? "" : "s"}.` : ``}`)
    })

    c.onEmoteOnly(async (channel, enabled) => {
        c.say(channel, `DinoDance LUL SeemsGood Emote-Only mode has been ${enabled ? `enabled` : `disabled`}`)
    })

    c.onSubsOnly(async (channel, enabled) => {
        c.say(channel, `Subscriber-Only mode has been ${enabled ? `enabled` : `disabled`}.${enabled ? "Only Subscribers and Moderators may chat" : ""}`)
    })

    c.onStandardPayForward(async (channel, user, forward, msg) => {
        await reply(c, user, `@${user} just paid forward their sub from ${forward.originalGifterDisplayName || "Anonymous"}!`)
    })

    c.onMessage(async (channel, user, content, msg: ChatMessage) => {
        if (msg.isFirst) {
            await reply(c, user, `Welcome to the chat, @${user}!`, msg)
        }
        let pointsBackupPath = join(cwd(), "data", "streamElementsExport.json");
        console.log(pointsBackupPath)

        ensureFileSync(pointsBackupPath);

        let isBot = [...KNOWN_BOT_NAMES, process.env.BOT_USER_NAME].includes(user.toLowerCase());

        console.log(content)

        if (isBot) return;
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


        if (!content.startsWith(prefix) && content.trim().toLowerCase().startsWith("pickme")) {
            // Raffles
            let raffle = getAllRaffles()?.[0];
            if (raffle) {
                let participants = getRaffleParticipants(raffle.id);

                if (!participants.some(p => p.id === msg.userInfo.userId)) {
                    if (participants && (participants.length <= 0 && raffle.creator_id === msg.userInfo.userId)) {
                        reply(client, user, `Someone else has to join the raffle before you can join!`, msg)
                    } else {
                        createRaffleParticipant({ raffle_id: raffle.id, id: msg.userInfo.userId });
                        await reply(client, user, `@${msg.userInfo.displayName} joined the raffle for ${raffle.points.toLocaleString()} point${raffle.points === 1 ? "" : "s"}! Type "pickme" in chat for a chance to win!`, msg);
                    }
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
                let userLevel = customCmd.userLevel || UserRolesStringMap[`${UserRoles.DEFAULT}`];

                function checkPermission(role: "vip" | "moderator" | "bot" | "broadcaster", checkBroadcaster: boolean = true): boolean {
                    console.log("CHECKING ROLE", role)
                    console.log("IS VIP (or mod)", (msg.userInfo.isVip || msg.userInfo.isMod))
                    console.log("IS BROADCASTER", (msg.userInfo.isBroadcaster))
                    console.log("IS MOD", (msg.userInfo.isMod) || (msg.userInfo.isLeadMod))
                    console.log("IS BOT", msg.userInfo.userName === process.env.BOT_USER_NAME.toLowerCase())
                    if (checkBroadcaster && msg.userInfo.isBroadcaster) return true;
                    if (role === "vip" && (msg.userInfo.isVip || msg.userInfo.isMod)) return true;
                    if (role === "broadcaster" && msg.userInfo.isBroadcaster) return true;
                    if (role === "moderator" && (msg.userInfo.isMod || msg.userInfo.isLeadMod)) return true;
                    if (role === "bot" && msg.userInfo.userName === process.env.BOT_USER_NAME.toLowerCase()) return true;

                    return false;
                }

                if (userLevel !== "Viewer") {
                    console.log("customCmd", customCmd.trigger)
                    console.log("user level", userLevel)
                    if (!checkPermission(userLevel.toLowerCase() as any, true)) return await reply(c, user, `You must be ${userLevel} or higher to do that!`, msg)
                }

                let content = customCmd.content;

                // let regex = new RegExp(/((?:\{)([a-zA-Z]*)( ?)(.*)\b(?:\}))/gm);
                // let regex = /\{([a-zA-Z]\w*)(\s+((\{[^\}]*\}|[^\}])*))?\}/gm;
                // let regex = /\{([a-zA-Z]\w*)( ({?[^\{\}]*)}?)?\}/gm;

                // let regex = /\{([a-zA-Z]\w*)(?:\s+((?:\{[^{}]*\}|[^{}])*))?\}/gm;

                // let placeholders: string[][] | RegExpMatchArray = content.match(regex);
                // console.log(placeholders)
                // if (placeholders && placeholders.length > 0) placeholders = placeholders.map(p => {
                //     let split = p
                //     // .replace("{", "").replace("}", "")
                //     .split(/ +/);
                //     if(split[0].startsWith("{")) split[0] = split[0].replace("{","");
                //     if(split[0].endsWith("}")) split[0] = split[0].slice(0, split[0].length - 1)
                //     if(split[1] && split[1].endsWith("}")) split[1] = split[1].slice(0, split[1].length - 1);
                //     let plName = split[0];
                //     split.shift();

                //     return [plName, split[0] ? split.join(" ") : null];
                // });

                // console.log("PLACEHOLDERS", placeholders)


                // for (let i = 0; i < placeholders?.length || 0; i++) {
                //     const pl: string[] = placeholders[i] as string[];
                //     console.log("PL", pl)
                //     // if(pl[1] && pl[1].endsWith("}")) pl[1] = pl[1].slice(0, pl[1].length - 1);

                //     let replaceWith = "";
                //     switch (pl[0]) {
                //         case "random": {
                //             let randSplit: number[] = pl[1] ? pl[1].split("-").map(i => Number(i)) : [0, 10];

                //             let random = Math.floor(Math.random() * randSplit[1]);
                //             if (random < randSplit[0]) random = random + (randSplit[0] - random);
                //             replaceWith = random.toLocaleString();
                //             break;
                //         }

                //         case "weatherin": {
                //             let replaceArgs = pl[1].match(/{[0-9]}|{query}/gm);
                //             let query = pl[1];

                //             if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                //                 let rawArgIndex = a.replace("{", "").replace("}", "");
                //                 let argsIndex = Number(rawArgIndex);
                //                 if (!Number.isNaN(argsIndex)) {
                //                     let arg = args[argsIndex];
                //                     query = pl[1].replaceAll(`{${argsIndex}}`, arg);
                //                 } else {
                //                     if (rawArgIndex.toLowerCase() === "query") {
                //                         query = pl[1].replaceAll("{query}", args.join(" "));
                //                     }
                //                 }
                //             })

                //             try {
                //                 let forecast = await getWeather(query.trim() === "" ? "Hell norway" : query);
                //                 replaceWith = `${forecast.temperature_c}° C | ${forecast.temperature_f}° F in ${forecast.region}`
                //             } catch (e) {
                //                 replaceWith = `Error Fetching Weather`
                //             }

                //             break;
                //         }

                //         case "coinflip": {
                //             let m1 = crypto.getRandomValues(new Uint8Array(1));
                //             let rand = m1[0];

                //             console.log(rand);

                //             let isHeads = rand >= 100;

                //             replaceWith = isHeads ? "Heads" : "Tails";

                //             break;
                //         }

                //         case "sender": {
                //             replaceWith = `@${msg.userInfo.displayName}`;
                //             break;
                //         }

                //         case "touser": {
                //             // let replaceArgs = pl[1].match(/args/gm);
                //             let mention = args?.[0] || msg.userInfo.userName;
                //             replaceWith = `${mention.replaceAll("@", "").toLowerCase()}`;

                //             break;
                //         }

                //         case "game": {
                //             let replaceArgs = pl[1].match(/{[0-9]}|{sender}|{touser}/gm);
                //             let query = pl[1];

                //             if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                //                 let rawArgIndex = a.replace("{", "").replace("}", "");
                //                 let argsIndex = Number(rawArgIndex);
                //                 if (!Number.isNaN(argsIndex)) {
                //                     let arg = args[argsIndex];
                //                     console.log("ARG", arg)
                //                     query = pl[1].replaceAll(`{${argsIndex}}`, arg);
                //                     console.log("query", query);
                //                 } else {
                //                     if (rawArgIndex.toLowerCase() === "sender") {
                //                         query = pl[1].replaceAll("{sender}", `@${msg.userInfo.userName}`);
                //                     }
                //                     if (rawArgIndex.toLowerCase() === "touser") {
                //                         let mention = args?.[0] || msg.userInfo.userName;
                //                         query = pl[1].replaceAll("{touser}", mention.replaceAll("@", ""));
                //                     }
                //                 }
                //             })

                //             try {
                //                 query = query.replaceAll("@", "");
                //                 let game = await getGame(query);
                //                 replaceWith = game || "Error Fetching Stream";
                //             } catch (e) {
                //                 replaceWith = `Error Fetching Stream`;
                //             }

                //             break;
                //         }

                //         case "shoutout": {
                //             let replaceArgs = pl[1].match(/{[0-9]}|{sender}|{touser}/gm);
                //             let query = pl[1];

                //             if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                //                 let rawArgIndex = a.replace("{", "").replace("}", "");
                //                 let argsIndex = Number(rawArgIndex);
                //                 if (!Number.isNaN(argsIndex)) {
                //                     let arg = args[argsIndex];
                //                     console.log("ARG", arg)
                //                     query = pl[1].replaceAll(`{${argsIndex}}`, arg);
                //                     console.log("query", query);
                //                 } else {
                //                     if (rawArgIndex.toLowerCase() === "sender") {
                //                         query = pl[1].replaceAll("{sender}", `@${msg.userInfo.userName}`);
                //                     }
                //                     if (rawArgIndex.toLowerCase() === "touser") {
                //                         let mention = args?.[0] || msg.userInfo.userName;
                //                         query = pl[1].replaceAll("{touser}", mention.replaceAll("@", ""));
                //                     }
                //                 }
                //             })

                //             try {
                //                 query = query.replaceAll("@", "");
                //                 let shout = await shoutout(query);
                //                 replaceWith = shout ? "" : "Error Shouting Out";
                //             } catch (e) {
                //                 replaceWith = `Error Shouting Out`;
                //             }

                //             break;
                //         }

                //         case "setgame": {
                //             let replaceArgs = pl[1].match(/{[0-9]}|{query}/);
                //             let query = pl[1];

                //             if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                //                 let rawArgIndex = a.replace("{", "").replace("}", "");
                //                 let argsIndex = Number(rawArgIndex);
                //                 if (!Number.isNaN(argsIndex)) {
                //                     let arg = args[argsIndex];
                //                     query = pl[1].replaceAll(`{${argsIndex}}`, arg);
                //                 } else {
                //                     if (rawArgIndex.toLowerCase() === "query") {
                //                         query = pl[1].replaceAll("{query}", args.join(" "));
                //                     }
                //                 }
                //             })

                //             try {
                //                 let gameSet = await setGame(query.trim());
                //                 replaceWith = gameSet ? gameSet : "Error Setting Game"
                //             } catch (e) {
                //                 replaceWith = `Error Setting Game`
                //             }

                //             break;
                //         }

                //         case "title": {
                //             console.log("SET TITLE", pl)
                //             let replaceArgs = pl[1].match(/{[0-9]}|{query}/);
                //             let query = pl[1];

                //             if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                //                 let rawArgIndex = a.replace("{", "").replace("}", "");
                //                 let argsIndex = Number(rawArgIndex);
                //                 if (!Number.isNaN(argsIndex)) {
                //                     let arg = args[argsIndex];
                //                     query = pl[1].replaceAll(`{${argsIndex}}`, arg);
                //                 } else {
                //                     if (rawArgIndex.toLowerCase() === "query") {
                //                         query = pl[1].replaceAll("{query}", args.join(" "));
                //                     }
                //                 }
                //             })

                //             try {
                //                 let titleSet = await setTitle(query.trim());
                //                 replaceWith = titleSet ? titleSet : "Error Setting Title"
                //             } catch (e) {
                //                 replaceWith = `Error Setting Title`
                //             }

                //             break;
                //         }

                //     }
                //     content = content.replace(`{${pl[0]}${pl[1] ? ` ${pl[1]}` : ""}}`, replaceWith);
                // }

                // placeholders.forEach(async pl => {

                // })

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
                            let randSplit: number[] = tagContent ? tagContent.split("-").map((i: string) => Number(i.trim())) : [0, 10];

                            let random = Math.floor(Math.random() * randSplit[1]);
                            if (random < randSplit[0]) random = random + (randSplit[0] - random);
                            replaceWith = random.toLocaleString();
                            break;
                        }

                        case "weatherin": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/gm);
                            let query = tagContent;

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "query") {
                                        query = query.replaceAll("{query}", args.join(" "));
                                    }
                                }
                            })

                            try {
                                let forecast = await getWeather(query.trim() === "" ? "Hell norway" : query);
                                replaceWith = `${forecast.emoji} ${forecast.temperature_c}° C | ${forecast.temperature_f}° F in ${forecast.region}`
                            } catch (e) {
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

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    console.log("ARG", arg)
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                    console.log("query", query);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "sender") {
                                        query = query.replaceAll("{sender}", `@${msg.userInfo.userName}`);
                                    }
                                    if (rawArgIndex.toLowerCase() === "touser") {
                                        let mention = args?.[0] || msg.userInfo.userName;
                                        query = query.replaceAll("{touser}", mention.replaceAll("@", ""));
                                    }
                                }
                            })

                            try {
                                query = query.replaceAll("@", "");
                                if (query.trim() === "") query = channel;
                                let game = await getGame(query);
                                replaceWith = game || "Error Fetching Stream";
                            } catch (e) {
                                replaceWith = `Error Fetching Stream`;
                            }

                            break;
                        }

                        case "shoutout": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{sender}|{touser}/gm);
                            let query = tagContent;

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    console.log("ARG", arg)
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                    console.log("query", query);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "sender") {
                                        query = query.replaceAll("{sender}", `${msg.userInfo.userName}`);
                                    }
                                    if (rawArgIndex.toLowerCase() === "touser") {
                                        let mention = args?.[0] || msg.userInfo.userName;
                                        query = query.replaceAll("{touser}", mention.replaceAll("@", ""));
                                    }
                                }
                            })

                            try {
                                query = query.replaceAll("@", "");
                                let shout = await shoutout(query);
                                replaceWith = shout ? "" : "Error Shouting Out";
                            } catch (e) {
                                replaceWith = `Error Shouting Out`;
                            }

                            break;
                        }

                        case "setgame": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let query = tagContent;

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "query") {
                                        query = query.replaceAll("{query}", args.join(" "));
                                    }
                                }
                            })

                            try {
                                let gameSet = await setGame(query.trim());
                                replaceWith = gameSet ? gameSet : "Error Setting Game"
                            } catch (e) {
                                replaceWith = `Error Setting Game`
                            }

                            break;
                        }

                        case "settitle": {
                            console.log("SET TITLE", [tagName, tagContent])
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let query = tagContent;

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "query") {
                                        query = query.replaceAll("{query}", args.join(" "));
                                    }
                                }
                            })

                            try {
                                if (query.includes("{") || query.includes("}")) {
                                    replaceWith = "Title may not contain curly braces"
                                } else {
                                    let titleSet = await setTitle(query.trim());
                                    replaceWith = titleSet ? titleSet : "Error Setting Title"
                                }
                            } catch (e) {
                                replaceWith = `Error Setting Title`
                            }

                            break;
                        }

                        case "settags": {
                            console.log("SET TAGS", [tagName, tagContent])
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let query = tagContent;

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "query") {
                                        query = query.replaceAll("{query}", args.join(" "));
                                    }
                                }
                            })

                            try {
                                if (query.includes("{") || query.includes("}")) {
                                    replaceWith = "Tags may not contain curly braces"
                                } else {
                                    let tagSplit = query.split(",").map(q => q.trim().replaceAll(" ", ""));
                                    if (tagSplit.length > 0) {
                                        console.log("TAGS", tagSplit)
                                        let tagSet = await setTags(tagSplit);
                                        replaceWith = tagSet.length > 0 ? tagSet.join(", ") : "Error Setting Tags"
                                    } else replaceWith = "Error Setting Tags"
                                }
                            } catch (e) {
                                replaceWith = `Error Setting Tags`
                            }

                            break;
                        }

                        case "accountage": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{sender}|{touser}/gm);
                            let query = tagContent;

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    console.log("ARG", arg)
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                    console.log("query", query);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "sender") {
                                        query = query.replaceAll("{sender}", `@${msg.userInfo.userName}`);
                                    }
                                    if (rawArgIndex.toLowerCase() === "touser") {
                                        let mention = args?.[0] || msg.userInfo.userName;
                                        query = query.replaceAll("{touser}", mention.replaceAll("@", ""));
                                    }
                                }
                            })

                            // let timeFormatter = Intl.DateTimeFormat("en-US", {

                            // })

                            try {
                                query = query.replaceAll("@", "");
                                let user = await getUser(query !== "" ? query : msg.userInfo.userName);
                                replaceWith = user ? `${timeAgo(user.creationDate)}` : `Error Fetching User`;
                            } catch (e) {
                                replaceWith = `Error Fetching User`;
                            }

                            break;
                        }

                        case "followage": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{sender}|{touser}/gm);
                            let query = tagContent;

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    console.log("ARG", arg)
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                    console.log("query", query);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "sender") {
                                        query = query.replaceAll("{sender}", `@${msg.userInfo.userName}`);
                                    }
                                    if (rawArgIndex.toLowerCase() === "touser") {
                                        let mention = args?.[0] || msg.userInfo.userName;
                                        query = query.replaceAll("{touser}", mention.replaceAll("@", ""));
                                    }
                                }
                            })

                            // let timeFormatter = Intl.DateTimeFormat("en-US", {

                            // })

                            try {
                                query = query.replaceAll("@", "");
                                let followedDate = await getFollowedDate(query !== "" ? query : msg.userInfo.userName);
                                replaceWith = followedDate ? `${timeAgo(followedDate)}` : `never`;
                            } catch (e) {
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
                            } else {
                                try {
                                    let { data, status } = await get(url);
                                    if (!data) {
                                        replaceWith = `Server responded with status ${status}`;
                                    } else {
                                        let finalVal = data;
                                        console.log("DATA", data);
                                        const keys = path ? path.split(".") : [];
                                        console.log("KEYS", keys)
                                        if (keys.length > 0) {
                                            for (const key of keys) {
                                                let checkKey: string | number = `${key}`;
                                                if (key.trim() !== "" && !Number.isNaN(Number(key))) checkKey = Number(key);
                                                console.log("CHECK KEY", checkKey);

                                                if (finalVal && finalVal[checkKey] !== undefined) {
                                                    finalVal = finalVal[checkKey];
                                                } else {
                                                    finalVal = null;
                                                    break;
                                                }
                                            }
                                        } else if ((typeof data) === "string") {
                                            finalVal = data;
                                        } else finalVal = null;
                                        console.log("FINAL", finalVal);

                                        replaceWith = finalVal ? `${decode ? decodeURIComponent(finalVal) : finalVal}` : "Invalid Path"
                                    }
                                } catch (e) {
                                    console.log(e);
                                    replaceWith = `Fetch Failed`
                                }
                            }

                            break;
                        }

                        case "pin": {
                            console.log("PIN", [tagName, tagContent])
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let query = tagContent;

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "query") {
                                        query = query.replaceAll("{query}", args.join(" "));
                                    }
                                }
                            })

                            try {
                                if (query.includes("{") || query.includes("}")) {
                                    replaceWith = "May not contain curly braces"
                                } else {
                                    try {
                                        await sendAndPin(client, user, query);
                                        replaceWith = query;
                                    } catch (e) {
                                        replaceWith = "Error Updating Pinned Message"
                                    }
                                }
                            } catch (e) {
                                replaceWith = `Error Updating Pinned Message`
                            }

                            break;
                        }

                        case "timer": {
                            let replaceArgs = tagContent.match(/{[0-9]}|{query}/);
                            let querySplit = tagContent.split(" ");
                            let query = querySplit[0];
                            querySplit.shift();
                            let label = querySplit.join(" ").trim();

                            if (replaceArgs && replaceArgs.length > 0) replaceArgs.forEach(a => {

                                let rawArgIndex = a.replace("{", "").replace("}", "");
                                let argsIndex = Number(rawArgIndex);
                                if (!Number.isNaN(argsIndex)) {
                                    let arg = args[argsIndex];
                                    query = query.replaceAll(`{${argsIndex}}`, arg);
                                } else {
                                    if (rawArgIndex.toLowerCase() === "query") {
                                        query = query.replaceAll("{query}", args.join(" "));
                                    }
                                }
                            })

                            try {
                                if (query.includes("{") || query.includes("}")) {
                                    replaceWith = "Query may not contain curly braces"
                                } else {
                                    let duration = query;
                                    let durationUnit = duration ? duration.substring(duration.length - 1) : null;
                                    duration = durationUnit ? duration.replace(durationUnit, "").trim() : null;
                                    let duration_seconds = (duration && durationUnit) ? moment.duration(duration, durationUnit as any).asSeconds() : 0;
                                    console.log(duration)
                                    console.log(durationUnit)
                                    console.log(duration_seconds)
                                    if (!duration || duration_seconds === 0) replaceWith = `Error Starting Timer`
                                    if (duration_seconds >= 2505600) replaceWith = `Error Starting Timer`

                                    let newTimer = setTimerSeconds(duration_seconds);
                                    if(label !== "") setTimerLabel(label);
                                    if(newTimer.paused) setTimerPaused(false);
                                    if (!newTimer.visible) setTimerVisibility(true);

                                    let formattedDuration = moment.duration(newTimer.seconds, "seconds").format(`${newTimer.seconds >= 86400 ? "DD:" : ""}${newTimer.seconds >= 3600 ? "HH:" : ""}${newTimer.seconds >= 60 ? "mm:" : "[00:]"}ss`);

                                    replaceWith = `Started timer for ${formattedDuration}${label !== "" ? ` with label "${label}"` : ""}`
                                }
                            } catch (e) {
                                replaceWith = `Error Starting Timer`
                            }

                            break;
                        }

                    }
                    content = content.replace(`{${tagName}${tagContent ? ` ${tagContent}` : ""}}`, replaceWith);
                }

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
            if (["editcmd", "editcommand", "changecommand", "ec"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(EditCommandCommand, client, user, content.split(cmd)[1], msg)
            if (["setcode", "setroomcode", "src",].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(SetRoomCodeCommand, client, user, content.split(cmd)[1], msg)
            if (["movecmd", "mvcommand", "swapcmd", "swapcommand", "movecommand"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(MoveCommandCommand, client, user, content.split(cmd)[1], msg)
            if (["code", "roomcode", "rc", "join", "lobby", "room"].includes(cmdNoPrefix)) await runCommand(RoomCodeCommand, client, user, content.split(cmd)[1], msg)
            if (["raffle"].includes(cmdNoPrefix) && (msg.userInfo.isMod || msg.userInfo.isBroadcaster)) await runCommand(RaffleCommand, client, user, content.split(cmd)[1], msg)
            if (["nuke", "kms", "seppuku"].includes(cmdNoPrefix)) await runCommand(NukeCommand, client, user, content.split(cmd)[1], msg)
            if (["timer"].includes(cmdNoPrefix)) await runCommand(TimerCommand, client, user, content.split(cmd)[1], msg)
            if (["notice"].includes(cmdNoPrefix)) await runCommand(NoticeCommand, client, user, content.split(cmd)[1], msg)
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