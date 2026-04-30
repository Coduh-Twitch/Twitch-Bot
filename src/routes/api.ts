import { Router } from "express";
import { CHANNEL, client, commandsMap, reply } from "..";
import { get, post } from "axios";
import { pollModel } from "../models/polls";

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
})

export default apiRouter;