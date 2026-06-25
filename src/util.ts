import { get, post, put } from "axios";
import {
  apiClient,
  authProvider,
  broadcasterApiClient,
  client,
  SOCIAL_LINKS,
} from ".";
import { userModel } from "./models/user";
import { sessionModel } from "./models/session";
import { Message } from "ircv3";
import {
  HelixChannelFollower,
  HelixClip,
  HelixSentChatMessage,
  HelixStream,
  HelixUser,
} from "@twurple/api";
import { ensureDirSync, ensureFileSync, writeJSONSync } from "fs-extra";
import { join } from "path";
import { DataObject, getRawData } from "@twurple/common";
import { ChatMessage } from "@twurple/chat";

export const getDiscordCta = async (): Promise<string> => {
  const guildInvite = "cTVvyh3zke";
  const DISCORD_API_URL = `https://discord.com/api`;
  const discordData = await (
    await get(`${DISCORD_API_URL}/invite/${guildInvite}`)
  ).data;

  if (discordData || discordData !== null) {
    const profile = discordData.profile;
    const members: number = profile.member_count || 0;

    return `${members.toLocaleString()} HOT SINGLE${members === 1 ? "" : "S"} IN YOUR AREA! CLICK THE LINK TO FIND LOCALS NEAR YOU | ${SOCIAL_LINKS.discord}`;
  } else {
    return `HOT SINGLES IN YOUR AREA! CLICK THE LINK TO FIND LOCALS NEAR YOU | ${SOCIAL_LINKS.discord}`;
  }
};

export const setRoomCode = async (roomCode: string): Promise<boolean> => {
  try {
    await userModel.findOneAndUpdate(
      { twitchId: process.env.CHANNEL_ID },
      { game_code: roomCode },
    );
    return true;
  } catch (e) {
    return false;
  }
};

export const getRoomCode = async (): Promise<string | null> => {
  let dbUser = await userModel.findOne({ twitchId: process.env.CHANNEL_ID });
  if (!dbUser || !dbUser?.game_code) return null;

  return dbUser.game_code;
};

export const pinMessage = async (
  message: ChatMessage | HelixSentChatMessage,
  durationSeconds: number | null = null,
): Promise<boolean> => {
  let session = await sessionModel.findOne({ userId: process.env.BOT_USER_ID });
  if (!session) return false;

  let headers = {
    Authorization: `Bearer ${session.accessToken}`,
    "Client-Id": process.env.CLIENT_ID,
  };

  try {
    let res = await put(
      `https://api.twitch.tv/helix/chat/pins?broadcaster_id=${process.env.CHANNEL_ID}&moderator_id=${process.env.BOT_USER_ID}&message_id=${message.id}${durationSeconds ? `&duration_seconds=${durationSeconds}` : ""}`,
      null,
      { headers },
    );
    console.log(`pinning message ${message.id}`);
    console.log(res);
  } catch (e) {
    console.log(`failed to pin`);
    console.log(e);
  }
};

export const getWeather = async (
  location: string,
): Promise<{
  temperature_c: number;
  temperature_f: number;
  region: string;
  emoji: string;
}> => {
  // https://wttr.in/$LOCATION?format=1
  let res = await get(
    `https://wttr.in/${encodeURIComponent(location)}?format=j1`,
  );
  if (!res.data)
    return {
      temperature_c: 0,
      temperature_f: 0,
      region: "Region not found",
      emoji: "NotLikeThis",
    };

  let emoji = await get(
    `https://wttr.in/${encodeURIComponent(location)}?format=%c`,
  );
  if (!emoji.data)
    return {
      temperature_c: 0,
      temperature_f: 0,
      region: "Region not found",
      emoji: "NotLikeThis",
    };

  // ensureDirSync(join(process.cwd(), "tmp"))
  // ensureFileSync(join(process.cwd(), "tmp", "forecast.json"))
  // writeJSONSync(join(process.cwd(), "tmp", "forecast.json"), res.data, {encoding: "utf8"})

  return {
    temperature_c: res.data.current_condition?.[0].temp_C,
    temperature_f: res.data.current_condition?.[0].temp_F,
    region: res.data.nearest_area[0].areaName[0].value,
    emoji: emoji.data,
  };
};

export const getGame = async (username: string): Promise<string | null> => {
  let stream: HelixStream | HelixStream[] =
    await apiClient.streams.getStreamsByUserNames([username]);
  if (stream?.[0]) stream = stream[0];
  let apiUser = await apiClient.users.getUserByName(username);
  let apiChannel = await apiClient.channels.getChannelInfoById(apiUser.id);

  return (stream as HelixStream)?.gameName || apiChannel?.gameName || null;
};

export const setGame = async (gameName: string): Promise<string | null> => {
  if (!broadcasterApiClient) return null;
  try {
    // let stream = await apiClient.streams.getStreamByUserId(process.env.CHANNEL_ID);
    // if(!stream) return null;
    let game = await apiClient.games.getGameByName(gameName);
    if (!game) return null;
    await broadcasterApiClient.channels.updateChannelInfo(
      process.env.CHANNEL_ID,
      { gameId: game.id },
    );
    return game.name;
  } catch (e) {
    console.log("ERROR SETTING GAME", e);
    return null;
  }
};

export const setTitle = async (newTitle: string): Promise<string | null> => {
  if (!broadcasterApiClient) return null;
  try {
    await broadcasterApiClient.channels.updateChannelInfo(
      process.env.CHANNEL_ID,
      { title: newTitle },
    );
    return newTitle;
  } catch (e) {
    console.log("ERROR SETTING TITLE", e);
    return null;
  }
};

export const setTags = async (tags: string[]): Promise<string[]> => {
  if (!broadcasterApiClient) return [];
  if (tags.length <= 0) return [];
  try {
    await broadcasterApiClient.channels.updateChannelInfo(
      process.env.CHANNEL_ID,
      { tags: tags },
    );
    return tags;
  } catch (e) {
    console.log("ERROR SETTING TITLE", e);
    return [];
  }
};

export const shoutout = async (username: string): Promise<boolean> => {
  try {
    let apiUser = await apiClient.users.getUserByName(username);
    if (!apiUser) return false;
    await apiClient.asUser(process.env.BOT_USER_ID, async (ctx) => {
      await ctx.chat.shoutoutUser(process.env.CHANNEL_ID, apiUser.id);
    });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const getUser = async (login: string): Promise<HelixUser | null> => {
  try {
    let apiUser = await apiClient.users.getUserByName(login);
    if (!apiUser) return null;

    return apiUser;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const getFollowedDate = async (login: string): Promise<Date | null> => {
  try {
    let apiUser = await apiClient.users.getUserByName(login);
    if (!apiUser) return null;

    let broadcasterFollowers =
      await broadcasterApiClient.channels.getChannelFollowers(
        process.env.CHANNEL_ID,
      );
    // console.log(broadcasterFollowers.data)
    if (!broadcasterFollowers.data || broadcasterFollowers.data.length <= 0)
      return null;

    let apiFollower = broadcasterFollowers.data.find(
      (f) => f.userId === apiUser.id,
    );

    console.log("API FOLLOW DATE", apiFollower?.followDate || null);

    return apiFollower?.followDate || null;
  } catch (e) {
    console.log("GETFOLLOWEDDATE ERROR", e);
    return null;
  }
};

export interface Clip {
  id: string;
  title: string;
  game: string;
  gameId: string;
  createdDate: Date;
  featured: boolean;
  creatorName: string;
  creatorId: string;
  embedUrl: string;
  views: number;
  channel: string;
  duration_seconds: number;
  portrait_download_url: string | null;
  download_url: string;
  creator_profile_image: string;
}

export const getClips = async (
  featured_only: boolean = false,
  sort_by: "views" | "newest" | "oldest" = "views",
): Promise<Clip[]> => {
  try {
    let testing = false;
    let testUser = await apiClient.users.getUserByName("coduh");
    let clips = await broadcasterApiClient.clips.getClipsForBroadcaster(
      testing ? testUser.id : process.env.CHANNEL_ID,
    );

    console.log("clips", clips.data);
    if (!clips.data) return [];
    // console.log("data", clips.data)

    let filteredClips: Clip[] =
      (await Promise.all(
        clips.data.map(async (clip: HelixClip) => {
          let game = await clip.getGame();

          let clipper = await clip.getCreator();

          let clipData: Clip = {
            id: clip.id,
            game: game.name,
            gameId: game.id,
            createdDate: clip.creationDate,
            title: clip.title,
            creatorName: clip.creatorDisplayName,
            creatorId: clip.creatorId,
            featured: clip.isFeatured,
            embedUrl: clip.embedUrl,
            views: clip.views,
            channel: clip.broadcasterDisplayName.toLowerCase(),
            duration_seconds: clip.duration,
            download_url: "",
            portrait_download_url: null,
            creator_profile_image: clipper.profilePictureUrl,
          };

          return clipData;
        }),
      )) || [];

    if (featured_only) filteredClips = filteredClips.filter((c) => c.featured);
    if (sort_by === "views")
      filteredClips = filteredClips.sort((a, b) => b.views - a.views);
    if (sort_by === "newest")
      filteredClips = filteredClips.sort(
        (a, b) => b.createdDate.getTime() - a.createdDate.getTime(),
      );
    if (sort_by === "oldest")
      filteredClips = filteredClips.sort(
        (a, b) => a.createdDate.getTime() - b.createdDate.getTime(),
      );

    return filteredClips.filter((c) => c !== null);
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const randomClip = async (
  exclude_id: string | null = null,
): Promise<Clip> => {
  let clips = await getClips(false, "newest");
  if (exclude_id) console.log("Excluding ID", exclude_id);
  if (exclude_id) clips = clips.filter((c) => c.id !== exclude_id);
  let random = clips[Math.floor(Math.random() * clips.length)] || clips[0];
  // if (!random) return {
  //     id: "ClipNotFound",
  //     title: "No Clips Found :(",
  //     createdDate: new Date(),
  //     creatorId: "1234",
  //     creatorName: "ShortBotduh",
  //     embedUrl: `https://twitch.tv/${process.env.CHANNEL}`,
  //     featured: false,
  //     game: "Nothing",
  //     gameId: "1234",
  //     views: 0,
  //     channel: process.env.CHANNEL,
  //     duration_seconds: 0,
  //     download_url: "",
  //     portrait_download_url: ""
  // }

  return random;
};

export const timeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) {
    return interval + " years ago";
  }

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months ago";
  }

  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days ago";
  }

  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours ago";
  }

  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes ago";
  }

  if (seconds < 10) return "just now";

  return Math.floor(seconds) + " seconds ago";
};
