import { reply } from "..";
import { ChatCommand, UserRolesStringMap } from "../classes/Types";
import { UserRoles } from "../models/user";
import { shuffle } from "../util";

const magicBallResponses = shuffle([
  "Without a doubt.",
  "It is certain.",
  "It is decidedly so.",
  "You may rely on it.",
  "Most likely!",
  "Outlook good",
  "As I see it, yes.",
  "Yes!",
  "Signs point to yes.",
  "Very doubtful.",
  "My reply is no.",
  "Don't count on it.",
  "Outlook not so good.",
  "Better not tell you now.",
  "My sources say no.",
  "Ask again later.",
  "Reply hazy, try again.",
  "Concentrate and ask again.",
  "Cannot predict now.",
  "Maybe someday.",
  "Nothing.",
  "Neither.",
  "I don't think so.",
  "Try asking again.",
  "No!",
]);

const MagicBallCommand: ChatCommand = {
  enabled: true,
  userLevel: UserRoles.DEFAULT,
  name: "8ball",
  help: "Talk to the magic 8 ball",
  aliases: ["magicball", "genie"],
  run: async (client, user, content, message) => {
    let randomInt = Math.floor(Math.random() * magicBallResponses.length);
    let response = magicBallResponses[randomInt] || magicBallResponses[0];

    reply(client, user, `🎱 ${response}`, message);
  },
};

export default MagicBallCommand;
