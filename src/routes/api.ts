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
//
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
  let body: TTSQueueItem = req.body;
  const { bits, content, isTos, sentAt, sentById, sentByUsername, voice } =
    body;
  if (!content || !sentAt || !sentById || !sentByUsername || !voice)
    return res.send(null);

  addTTS(body as any);
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
