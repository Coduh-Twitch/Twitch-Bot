import { get, post } from "axios";
import { apiClient, client, SOCIAL_LINKS } from ".";
import { userModel } from "./models/user";
import { sessionModel } from "./models/session";
import { Message } from "ircv3";

export const getDiscordCta = async (): Promise<string> => {
    const guildInvite = "cTVvyh3zke"
    const DISCORD_API_URL = `https://discord.com/api`
    const discordData = await (await get(`${DISCORD_API_URL}/invite/${guildInvite}`)).data;

    if (discordData || discordData !== null) {
            const profile = discordData.profile;
            const members: number = profile.member_count || 0;

    return `${members.toLocaleString()} LOCAL MILF${members === 1 ? "" : "S"} IN YOUR AREA! CLICK THE LINK TO FIND LOCALS NEAR YOU | ${SOCIAL_LINKS.discord}`;
    } else {
        return `HOT MILFS IN YOUR AREA! CLICK THE LINK TO FIND LOCALS NEAR YOU | ${SOCIAL_LINKS.discord}`;
    }
}

export const setRoomCode = async (roomCode: string): Promise<boolean> => {
    try {
        await userModel.findOneAndUpdate({twitchId: process.env.CHANNEL_ID}, {game_code: roomCode});
        return true;
    } catch(e) {
        return false;
    }
}

export const getRoomCode = async (): Promise<string> => {
    let dbUser = await userModel.findOne({twitchId: process.env.CHANNEL_ID});
    if(!dbUser || !dbUser?.game_code) return "No Room Code";
    
    return dbUser.game_code;
}

export const pinMessage = async (messageId: string): Promise<boolean> => {
    let session = await sessionModel.findOne({userId: process.env.BOT_USER_ID});
    if(!session) return false;

    let headers = {
        "Authorization": `Oauth ${session.accessToken}`,
        "Client-Id": "kimne78kx3ncx6brgo4mv6wki5h1ko"
    }

    try {
        let res = await post(`https://gql.twitch.tv/gql`, {"operationName":"PinChatMessage","variables":{"input":{"channelID":process.env.CHANNEL_ID,"messageID":messageId,"durationSeconds":1200,"type":"MOD"}}}, {headers});
        console.log(`pinning message ${messageId}`)
        console.log(res)
        
    } catch(e) {
        console.log(`failed to pin`)
        console.log(e)
    }
}

export const getWeather = async (location: string): Promise<{temperature_c: number; temperature_f: number; region: string; }> => {
    // https://wttr.in/$LOCATION?format=1
    let res = await get(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
    if(!res.data) return {temperature_c: 0, temperature_f: 0, region: "Region not found"};

    return {
        temperature_c: res.data.current_condition?.[0].temp_C,
        temperature_f: res.data.current_condition?.[0].temp_F,
        region: res.data.nearest_area[0].areaName[0].value
    }
}