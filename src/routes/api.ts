import { Router } from "express";
import {
  apiClient,
  broadcasterApiClient,
  CHANNEL,
  client,
  commandsMap,
  lastFetchedClipId,
  reply,
  setFetchedClipId,
} from "..";
import axios, { get, post } from "axios";
import { pollModel } from "../models/polls";
import { customCommandModel } from "../models/command";
import { getTimer } from "../db/timer";
import { getNotice } from "../db/notice";
import { getClips, randomClip } from "../util";
import { getChosenClip, getClipVisibility, setChosenClip } from "../db/clip";
import { sessionModel } from "../models/session";
import { addTTS, getTTS, getTTSQueue, removeTTS } from "../db/tts";
import { TTSQueueItem } from "../classes/Types";
import {
  addSoundAlertToQueue,
  createSoundAlertReward,
  getSoundAlertFromQueue,
  getSoundAlertFromReward,
  getSoundAlertQueue,
  removeSoundAlertFromQueue,
} from "../db/soundalerts";
import { tts_queue } from "../db/schema";
import { getAmazonQueue, removeAmazonItem } from "../db/amazon";
import { getBotConfig, updateBotConfig } from "../db/botconfig";
import { getQueue, getQueueMembers } from "../db/queues";

function ordinal_suffix_of(i: number) {
  let j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return i.toLocaleString() + "st";
  }
  if (j === 2 && k !== 12) {
    return i.toLocaleString() + "nd";
  }
  if (j === 3 && k !== 13) {
    return i.toLocaleString() + "rd";
  }
  return i.toLocaleString() + "th";
}

const apiRouter = Router();

// apiRouter.post("/trigger-spotify-search", async (req, res) => {
//     let query = decodeURI(req.query.q.toString());
//     if(!query) return res.sendStatus(404);
//     let user = req.query.u.toString();
//     if(!user) return res.sendStatus(404);

//     reply(client, user, `Searching for "${query}" on Spotify...`)
//             try {

//                 const track = await get(`${BASE_URL}/spotify/search?q=${encodeURI(query)}`)
//                 if (!track || !track.data) {
//                     reply(client, user, `Search failed. Failed to find track "${query}"`)
//                     return;
//                 } else {
//                     const addToQueue = await post(`${BASE_URL}/spotify/queue/add-track`, { uri: track.data.uri })
//                     if (!addToQueue || addToQueue.status !== 200) {
//                         reply(client, user, `Failed to add track "${decodeURI(track.data.title)} - ${decodeURI(track.data.artist)}" to the queue. Please try another query.`)
//                         return;
//                     } else {
//                         reply(client, user, `Added track "${decodeURI(track.data.title)} - ${decodeURI(track.data.artist)}" to the queue!`)
//                     }
//                 }
//             } catch(e) {
//                 reply(client, user, `The service is currently unavailable. Is Spotify authenticated?`)
//             }
// })

apiRouter.get("/gamequeue", async (req, res) => {
  let queue = getQueue();
  const queueMembers = queue ? getQueueMembers(queue.id) : [];
  if (queue)
    (queue as any).members = queueMembers.sort(
      (a, b) => a.position - b.position,
    );
  const response = {
    ...(queue || null),
  };
  res.send(response);
});

apiRouter.get("/config", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);
  const config = getBotConfig(process.env.BOT_USER_ID);
  res.send(config);
});

apiRouter.post("/config/set/deaths/:count", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);
  const config = getBotConfig(process.env.BOT_USER_ID);
  const newConfig = updateBotConfig(config.id, {
    id: config.id,
    death_count: Number(req.params.count),
  });
  res.send(newConfig);
});

apiRouter.post("/config/slopmode/:mode", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);
  const config = getBotConfig(process.env.BOT_USER_ID);
  const newConfig = updateBotConfig(config.id, {
    id: config.id,
    slop_mode: Number(req.params.mode),
  });
  res.send(newConfig);
});

apiRouter.post("/config/videoid/:id", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);
  const config = getBotConfig(process.env.BOT_USER_ID);
  const newConfig = updateBotConfig(config.id, {
    id: config.id,
    custom_video_id: req.params.id,
  });
  res.send(newConfig);
});

apiRouter.post("/config/toggle/:overlay", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);
  const config = getBotConfig(process.env.BOT_USER_ID);
  let newConfig = null;
  if (req.params.overlay.toLowerCase() === "deaths") {
    newConfig = updateBotConfig(config.id, {
      show_death_count: !config.show_death_count,
      id: config.id,
    });
  } else if (req.params.overlay.toLowerCase() === "stuck") {
    newConfig = updateBotConfig(config.id, {
      show_stuck_count: !config.show_stuck_count,
      id: config.id,
    });
  }
  res.send(newConfig);
});

apiRouter.post("/config/set/stuck/:count", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);
  const config = getBotConfig(process.env.BOT_USER_ID);
  const newConfig = updateBotConfig(config.id, {
    id: config.id,
    stuck_count: Number(req.params.count),
  });
  res.send(newConfig);
});

apiRouter.get("/amazon/queue", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);
  let queue = getAmazonQueue();
  queue = queue.map((q) => {
    q.categories = q.categories.split("#") as any;
    return q;
  });
  res.send(queue);
});

apiRouter.post("/amazon/queue/remove/:asin", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);
  let queue = getAmazonQueue();
  if (!queue.some((q) => q.asin === req.params.asin)) return res.send(null);
  let removed = removeAmazonItem(req.params.asin);

  res.send(removed);
});

apiRouter.get("/soundalerts/end/:id", async (req, res) => {
  if (getSoundAlertFromQueue(req.params.id))
    return res.send(removeSoundAlertFromQueue(req.params.id));

  res.send(null);
});

apiRouter.get("/soundalerts/queue", async (req, res) => {
  res.send(getSoundAlertQueue());
});

apiRouter.post("/soundalerts/test/:rewardid", async (req, res) => {
  if (!req.headers["key"] || req.headers["key"] !== process.env.CLIENT_SECRET)
    return res.send(null);

  let alertItem = getSoundAlertFromReward(req.params.rewardid);
  if (alertItem) {
    addSoundAlertToQueue({
      alert_name: alertItem.name,
      audio_path: alertItem.audio_path,
      reward_id: alertItem.reward_id,
      sent_at: Date.now(),
      sent_by_id: "1234",
      sent_by_username: "Testing",
    });
  }

  res.send(alertItem);
});

apiRouter.post("/soundalerts/create", async (req, res) => {
  console.log("REQUEST", req);
  let data = req.body;
  let url = data?.url;
  let name = data?.name;
  let cost = data?.cost;
  let color = data?.color;
  console.log("SOUND ALERT CREATE BODY", data);

  if (!data || !url || !name || !cost || !color || (cost && cost <= 0))
    return res.send({ data: null });

  try {
    let newReward = await broadcasterApiClient.channelPoints.createCustomReward(
      process.env.CHANNEL_ID,
      {
        cost,
        title: name,
        backgroundColor: color,
        isEnabled: true,
        prompt: `Play a ${name}`,
        globalCooldown: 5,
      },
    );

    if (!newReward) return res.send({ data: null });

    let newDbReward = createSoundAlertReward({
      audio_path: url,
      created_at: Date.now(),
      name: newReward.title,
      reward_id: newReward.id,
    });

    return res.send({ data: newDbReward });
  } catch (e) {
    console.log(e);
    return res.send({ data: null });
  }
});

apiRouter.get("/tts/end/:id", async (req, res) => {
  if (getTTS(req.params.id)) return res.send(removeTTS(req.params.id));

  res.send(null);
});

apiRouter.get("/tts/skip/:id", async (req, res) => {
  if (getTTS(req.params.id)) return res.send(removeTTS(req.params.id));

  res.send(null);
});

apiRouter.get("/tts/queue", async (req, res) => {
  res.send(
    getTTSQueue().map(
      (tts) =>
        ({
          id: tts.id,
          bits: tts.bits,
          streak: tts.streak,
          content: tts.content,
          isTos: tts.is_tos,
          sentAt: tts.sent_at,
          sentById: tts.sent_by_id,
          sentByUsername: tts.sent_by_username,
          voice: tts.voice,
        }) as TTSQueueItem,
    ),
  );
});

apiRouter.post("/tts/add", async (req, res) => {
  let body: typeof tts_queue.$inferInsert = req.body;
  const {
    bits,
    content,
    is_tos,
    sent_at,
    sent_by_id,
    sent_by_username,
    voice,
    streak,
  } = body;
  if (!content || !sent_at || !sent_by_id || !sent_by_username || !voice)
    return res.send(null);

  let tts = addTTS(body as any);
  res.send(tts);
});

apiRouter.get("/tts/:id", async (req, res) => {
  let tts = getTTS(req.params.id);
  if (!tts) return res.send(null);

  res.send({
    id: tts.id,
    bits: tts.bits,
    content: tts.content,
    isTos: tts.is_tos,
    sentAt: tts.sent_at,
    sentById: tts.sent_by_id,
    sentByUsername: tts.sent_by_username,
    voice: tts.voice,
  });
});

apiRouter.post("/polls/start/:id", async (req, res) => {
  const pollId = decodeURI(req.params.id);
  const dbPoll = await pollModel.findOne({ id: pollId });
  if (!dbPoll) return res.sendStatus(404);

  await reply(client, "POLLS", `| POLL STARTED -> ${dbPoll.title}`);
  await reply(
    client,
    "POLLS",
    `| Votes from Discord will be counted when the poll ends!`,
  );
});

apiRouter.post("/polls/end/:id", async (req, res) => {
  const pollId = decodeURI(req.params.id);
  const dbPoll = await pollModel.findOne({ id: pollId });
  if (!dbPoll) return res.sendStatus(404);

  await client.say(CHANNEL, `| POLL ENDED! -> ${dbPoll.title}`);

  let choices: { text: string; votes: number }[] = [];
  Object.values(dbPoll.options).forEach((o) => {
    choices.push({ text: o.text, votes: o.votes });
  });
  choices = choices.sort((a, b) => b.votes - a.votes);

  await client.say(
    CHANNEL,
    `| 👑 WINNER -> ${choices[0].text} (${choices[0].votes} vote${choices[0].votes === 1 ? "" : "s"})`,
  );
  if (choices[1].votes > 0)
    await client.action(
      CHANNEL,
      `| 🥈 RUNNER-UP -> ${choices[1].text} (${choices[1].votes} vote${choices[1].votes === 1 ? "" : "s"})`,
    );
});

apiRouter.get("/commands", async (req, res) => {
  if (!commandsMap || commandsMap.size <= 0) return res.sendStatus(404);
  res.send({ commands: [...commandsMap.values()] });
});

apiRouter.get("/custom-commands", async (req, res) => {
  let commands = await customCommandModel.find();
  if (!commands || commands.length <= 0) return res.sendStatus(404);
  res.send({ commands });
});

apiRouter.get("/clips", async (req, res) => {
  let params = req.query;
  let sort: "views" | "newest" | "oldest" = "views";
  if (
    params.sort &&
    ["views", "newest", "oldest"].includes((params.sort as string) || "")
  )
    sort = params.sort as any;
  let clips = await getClips(false, sort);
  res.send(clips);
});

apiRouter.get("/clips/featured", async (req, res) => {
  let clips = await getClips(true);
  res.send(clips);
});

apiRouter.get("/clips/random", async (req, res) => {
  let clip = await randomClip();
  if (!getChosenClip()) setChosenClip(clip);
  res.send(clip);
});

apiRouter.get("/clips/chosen", async (req, res) => {
  let clip = getChosenClip();

  // let downloadInfo: {
  //     data: {
  //         clip_id: string;
  //         landscape_download_url: string;
  //         portrait_download_url: string | null;
  //     }[]
  // } | any = await apiClient.callApi({
  //     type: "helix", url: "clips/downloads", method: "GET", query: {
  //         clip_id: clip.id,
  //         editor_id: process.env.CHANNEL_ID,
  //         broadcaster_id: process.env.CHANNEL_ID
  //     }
  // })

  // let sessionRes = await get(`${process.env.WEB_URL}/api/session?key=${process.env.CLIENT_SECRET}`);
  //     if (!sessionRes || !sessionRes.data || !sessionRes.data?.data) {
  //         console.log(`Broadcaster Auth Session not found.`)
  //     }

  let sessionRes = await sessionModel.findOne({
    userId: process.env.BOT_USER_ID,
  });
  console.log("SESSION", sessionRes);

  let headers = {
    Authorization: `Bearer ${sessionRes.accessToken}`,
    "Client-Id": process.env.CLIENT_ID,
  };

  if (clip.id !== "ClipNotFound") {
    let downloadInfo = await axios.get(
      `https://api.twitch.tv/helix/clips/downloads?editor_id=${sessionRes.userId}&broadcaster_id=${process.env.CHANNEL_ID}&clip_id=${clip.id}`,
      { headers },
    );

    // console.log(clip.id)
    // console.log("DOWNLOAD", downloadInfo.data)

    // if (!downloadInfo || !downloadInfo.data || !downloadInfo.data?.data?.[0]) return null;

    downloadInfo = downloadInfo.data.data[0];
    // console.log("DOWNLOAD", downloadInfo)
    clip.download_url = (downloadInfo as any).landscape_download_url || null;
    clip.portrait_download_url =
      (downloadInfo as any).portrait_download_url || null;

    setFetchedClipId(clip.id);
  }

  clip.createdDate = clip.createdDate;

  res.send({ clip: clip, visible: getClipVisibility() });
});

apiRouter.post("/clips/finished", async (req, res) => {
  let authHeader = req.headers?.["key"];
  if (!req.headers || !authHeader) return res.sendStatus(403);
  if (authHeader && authHeader !== process.env.CLIENT_SECRET)
    return res.sendStatus(403);

  let currentId = null;
  let query = req.query;
  console.log("QUERY", query);
  if (query["current"]) currentId = query["current"];

  let clip = await randomClip(currentId);
  let newClip = setChosenClip(clip);
  res.send(newClip);
});

apiRouter.get("/clips/visible", async (req, res) => {
  let visiblity = getClipVisibility();
  res.send(visiblity);
});

apiRouter.get("/timer", async (req, res) => {
  let timer = getTimer();
  res.send(timer);
});

apiRouter.get("/notice", async (req, res) => {
  let notice = getNotice();
  res.send(notice);
});

apiRouter.post("/discord/new-member", async (req, res) => {
  let json = req.body;
  if (!json?.username) return res.sendStatus(401);
  if (!json?.memberCount) return res.sendStatus(401);
  await reply(
    client,
    null,
    `@${json.username} joined the Discord! They are the ${ordinal_suffix_of(json.memberCount as number)} member! -> Join with !discord`,
  );
});

export default apiRouter;
