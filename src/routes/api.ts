import { Router } from "express";
import { CHANNEL, client, commandsMap, reply } from "..";
import { get, post } from "axios";
import { pollModel } from "../models/polls";
import { customCommandModel } from "../models/command";
import { getTimer } from "../db/timer";
import { getNotice } from "../db/notice";
import { getClips, randomClip } from "../util";
import { getChosenClip, setChosenClip } from "../db/clip";

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

apiRouter.post("/polls/start/:id", async (req, res) => {
    const pollId = decodeURI(req.params.id);
    const dbPoll = await pollModel.findOne({id: pollId});
    if(!dbPoll) return res.sendStatus(404);

    await reply(client, "POLLS", `| POLL STARTED -> ${dbPoll.title}`)
    await reply(client, "POLLS", `| Votes from Discord will be counted when the poll ends!`)
})

apiRouter.post("/polls/end/:id", async (req, res) => {
    const pollId = decodeURI(req.params.id);
    const dbPoll = await pollModel.findOne({id: pollId});
    if(!dbPoll) return res.sendStatus(404);

    await client.say(CHANNEL, `| POLL ENDED! -> ${dbPoll.title}`)

    let choices: {text: string, votes: number}[] = []
    Object.values(dbPoll.options).forEach(o => {choices.push({text: o.text, votes: o.votes})})
    choices = choices.sort((a, b) => b.votes - a.votes)

    await client.say(CHANNEL, `| 👑 WINNER -> ${choices[0].text} (${choices[0].votes} vote${choices[0].votes === 1 ? "" : "s"})`)
    if(choices[1].votes > 0) await client.action(CHANNEL, `| 🥈 RUNNER-UP -> ${choices[1].text} (${choices[1].votes} vote${choices[1].votes === 1 ? "" : "s"})`)
})

apiRouter.get("/commands", async (req, res) => {
    if(!commandsMap || commandsMap.size <= 0) return res.sendStatus(404);
    res.send({commands: [...commandsMap.values()]})
});

apiRouter.get("/custom-commands", async (req, res) => {
    let commands = await customCommandModel.find();
    if(!commands || commands.length <= 0) return res.sendStatus(404);
    res.send({commands})
});

apiRouter.get("/clips", async (req, res) => {
    let params = req.query;
    let sort: "views" | "newest" | "oldest" = "views";
    if(params.sort && ["views", "newest", "oldest"].includes(params.sort as string || "")) sort = params.sort as any;
    let clips = await getClips(false, sort);
    res.send(clips);
})

apiRouter.get("/clips/featured", async (req, res) => {
    let clips = await getClips(true);
    res.send(clips);
})

apiRouter.get("/clips/random", async (req, res) => {
    let clip = await randomClip();
    res.send(clip);
})

apiRouter.get("/clips/chosen", async (req, res) => {
    let clip = getChosenClip();
    res.send(clip);
})

apiRouter.post("/clips/finished", async (req, res) => {
    let authHeader = req.headers?.["key"]
    console.log("AUTH HEADER", authHeader)
    if(!req.headers || !authHeader) return res.sendStatus(403);
    if(authHeader && authHeader !== process.env.CLIENT_SECRET) return res.sendStatus(403);

    let clip = await randomClip();
    let newClip = setChosenClip(clip);
    res.send(newClip);
})

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
    if(!json?.username) return res.sendStatus(401);
    if(!json?.memberCount) return res.sendStatus(401);
    await reply(client, null, `@${json.username} joined the Discord! They are the ${ordinal_suffix_of(json.memberCount as number)} member! -> Join with !discord`)
})

export default apiRouter;