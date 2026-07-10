import { prefix, reply } from "../index";
import { ChatCommand } from "../classes/Types";
import { customCommandModel } from "../models/command";
import { randomUUID } from "node:crypto";
import { userModel, UserRoles } from "../models/user";

// let betsMap: Map<string, boolean> = new Map<string, boolean>();

const GambleCommandCommand: ChatCommand = {
  enabled: true,
  name: "slots",
  aliases: ["roll", "gamble"],
  help: "99% of gamblers stop before they win... Just saying.",
  userLevel: UserRoles.DEFAULT,
  args: [
    {
      name: "amount",
      description:
        'The amount of points to roll. "all" to roll all of your points',
      required: true,
    },
  ],
  run: async (client, user, content, message) => {
    // if(betsMap.has(message.userInfo.userId)) {
    //     if(betsMap.get(message.userInfo.userId)) {
    //         betsMap.set(message.userInfo.userId, false);
    //         betsMap.delete(message.userInfo.userId)
    //         return reply(client, user, `Woah there! You need to wait a moment before rolling again. Don't want you getting a gamblin' addiction!`, message);
    //     }
    //     return;
    // } else {
    //     betsMap.set(message.userInfo.userId, true);
    // }
    content = content.trim();
    let gamblePts: any = content.split(" ")[0];
    if (gamblePts === "all") gamblePts = -1;
    if (!gamblePts || Number.isNaN(parseInt(gamblePts)))
      return reply(
        client,
        user,
        `Please provide an amount of points to roll (!roll <points>)`,
      );
    gamblePts = parseInt(gamblePts);

    let dbUser = await userModel.findOne({ twitchId: message.userInfo.userId });
    let points = dbUser ? dbUser.points : 0;

    if (gamblePts === -1) gamblePts = points;

    if (points < gamblePts)
      return reply(
        client,
        user,
        points === 0
          ? "You have no points. You are broke. :("
          : `You only have ${points} point${points === 1 ? "" : "s"} :(`,
      );
    if (gamblePts <= 0)
      return reply(
        client,
        user,
        points === 0
          ? "You have no points. You are broke. :("
          : `You have to bet more than 0 points.`,
      );

    try {
      let emotes = [
        "DinoDance",
        "PopNemo",
        "SUBtember",
        // "GoatEmotey",
        "PewPewPew",
        // "TwitchConHYPE",
        // "GoldPLZ",
        // "WeDidThat",
      ];
      let r1 = Math.floor(Math.random() * emotes.length);
      let r2 = Math.floor(Math.random() * emotes.length);
      let r3 = Math.floor(Math.random() * emotes.length);

      let e1 = emotes[r1] || emotes[0];
      let e2 = emotes[r2] || emotes[0];
      let e3 = emotes[r3] || emotes[0];

      let slotStr = `${e1} | ${e2} | ${e3}`;

      let win = false;
      let jackpot = false;

      let winMultis = [Math.random() * 1 * 0.5, 2]; // win, jackpot

      if ((e1 === e2 && e2 !== e3) || (e2 === e3 && e1 !== e3)) win = true;
      if (e1 === e2 && e2 === e3 && e1 === e3) jackpot = true;

      let winIndex = jackpot ? 1 : win ? 0 : -1;
      let winPoints =
        winIndex !== -1 ? Math.floor(gamblePts * winMultis[winIndex]) : 0;

      if (winIndex === -1) {
        await userModel.findOneAndUpdate(
          { twitchId: message.userInfo.userId },
          { points: points - gamblePts },
        );
        reply(
          client,
          user,
          `${slotStr} -> You lost ${gamblePts.toLocaleString()} point${gamblePts === 1 ? "" : "s"} :(`,
          message,
        );
      } else {
        await userModel.findOneAndUpdate(
          { twitchId: message.userInfo.userId },
          { points: points - gamblePts + winPoints },
        );
        reply(
          client,
          user,
          `${slotStr} -> ${jackpot ? "You won the jackpot! You" : "The house felt bad, so you"} got ${winPoints.toLocaleString()} point${winPoints === 1 ? "" : "s"}${jackpot ? "!" : " back before being thrown out the back door."}`,
          message,
        );
      }

      // setTimeout(() => {
      //     if(betsMap.has(message.userInfo.userId)) betsMap.delete(message.userInfo.userId)
      // },3e3)
    } catch (e) {
      reply(client, user, `Failed to roll. Please try again.`);
      // if(betsMap.has(message.userInfo.userId)) betsMap.delete(message.userInfo.userId)
    }
  },
};

export default GambleCommandCommand;
