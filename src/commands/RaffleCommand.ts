import { reply } from "../index";
import { ChatCommand } from "../classes/Types";
import {
  createRaffle,
  deleteRaffle,
  getAllRaffles,
  getRaffleParticipants,
} from "../db/raffle";
import { UserRoles } from "../models/user";

const RaffleCommand: ChatCommand = {
  enabled: true,
  help: "Start a raffle",
  name: "raffle",
  args: [
    {
      name: "amount",
      required: true,
      description: "The amount of points to put up in the raffle",
    },
  ],
  subCommands: [
    {
      name: "cancel",
      help: "Cancel the active raffle",
      args: [],
      userLevel: UserRoles.MOD,
    },
  ],
  userLevel: UserRoles.MOD,
  run: async (client, user, content, message) => {
    let raffles = getAllRaffles();

    content = content.trim();
    let args = content.split(" ");
    let amount = args[0] || 1000;
    if (Number.isNaN(Number(amount))) {
      if (amount.toString() === "cancel") {
        let raffle = getAllRaffles()?.[0];

        if (raffle) {
          let parts = getRaffleParticipants(raffle.id);
          let dr = deleteRaffle(raffle.id);
          reply(
            client,
            user,
            `GoldPLZ @${message.userInfo.userName} Cancelled the raffle for ${dr.points.toLocaleString()} point${dr.points === 1 ? "" : "s"} with ${parts.length} participant${parts.length === 1 ? "" : "s"}`,
          );

          return;
        } else amount = 1000;
      } else amount = 1000;
    }
    amount = Number(amount);
    if (raffles.length > 0)
      return reply(client, user, `There is already an active raffle!`, message);
    if (amount > 100000)
      return reply(
        client,
        user,
        `WTRuck Are you insane? ${amount.toLocaleString()} is way too many points. (max 100k)`,
        message,
      );

    let newRaffle = createRaffle({
      creator_id: message.userInfo.userId,
      points: amount,
    });
    reply(
      client,
      user,
      `DinoDance @${message.userInfo.userName} Started a raffle for ${newRaffle.points.toLocaleString()} point${newRaffle.points === 1 ? "" : "s"}! Type "pickme" in chat to for a chance to win!`,
    );
  },
};

export default RaffleCommand;
