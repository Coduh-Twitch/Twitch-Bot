"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const __1 = require("..");
const polls_1 = require("../models/polls");
const command_1 = require("../models/command");
function ordinal_suffix_of(i) {
    let j = i % 10, k = i % 100;
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
const apiRouter = (0, express_1.Router)();
apiRouter.post("/polls/start/:id", async (req, res) => {
    const pollId = decodeURI(req.params.id);
    const dbPoll = await polls_1.pollModel.findOne({ id: pollId });
    if (!dbPoll)
        return res.sendStatus(404);
    await (0, __1.reply)(__1.client, "POLLS", `| POLL STARTED -> ${dbPoll.title}`);
    await (0, __1.reply)(__1.client, "POLLS", `| Votes from Discord will be counted when the poll ends!`);
});
apiRouter.post("/polls/end/:id", async (req, res) => {
    const pollId = decodeURI(req.params.id);
    const dbPoll = await polls_1.pollModel.findOne({ id: pollId });
    if (!dbPoll)
        return res.sendStatus(404);
    await __1.client.say(__1.CHANNEL, `| POLL ENDED! -> ${dbPoll.title}`);
    let choices = [];
    Object.values(dbPoll.options).forEach(o => { choices.push({ text: o.text, votes: o.votes }); });
    choices = choices.sort((a, b) => b.votes - a.votes);
    await __1.client.say(__1.CHANNEL, `| 👑 WINNER -> ${choices[0].text} (${choices[0].votes} vote${choices[0].votes === 1 ? "" : "s"})`);
    if (choices[1].votes > 0)
        await __1.client.action(__1.CHANNEL, `| 🥈 RUNNER-UP -> ${choices[1].text} (${choices[1].votes} vote${choices[1].votes === 1 ? "" : "s"})`);
});
apiRouter.get("/commands", async (req, res) => {
    if (!__1.commandsMap || __1.commandsMap.size <= 0)
        return res.sendStatus(404);
    res.send({ commands: [...__1.commandsMap.values()] });
});
apiRouter.get("/custom-commands", async (req, res) => {
    let commands = await command_1.customCommandModel.find();
    if (!commands || commands.length <= 0)
        return res.sendStatus(404);
    res.send({ commands });
});
apiRouter.post("/discord/new-member", async (req, res) => {
    let json = req.body;
    if (!json?.username)
        return res.sendStatus(401);
    if (!json?.memberCount)
        return res.sendStatus(401);
    await (0, __1.reply)(__1.client, null, `@${json.username} joined the Discord! They are the ${ordinal_suffix_of(json.memberCount)} member! -> Join with !discord`);
});
exports.default = apiRouter;
//# sourceMappingURL=api.js.map