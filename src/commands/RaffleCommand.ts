import { reply } from "..";
import { ChatCommand } from "../classes/Types";
import { createRaffle, getAllRaffles } from "../db/raffle";
import { UserRoles } from "../models/user";

const RaffleCommand: ChatCommand = {
    enabled: true,
    help: "Start a raffle",
    name: "raffle",
    userLevel: UserRoles.MOD, 
    run: async (client, user, content, message) => {
        let raffles = getAllRaffles();
        if(raffles.length > 0) return reply(client, user, `There is already an active raffle!`, message)

        content = content.trim();
        let args = content.split(' ');
        let amount = Number(args[0]);
        if(Number.isNaN(amount)) amount = 1000;

        let newRaffle = createRaffle({creator_id: message.userInfo.userId, points: amount});
        reply(client, user, `DinoDance @${message.userInfo.userName} Started a raffle for ${newRaffle.points.toLocaleString()} point${newRaffle.points === 1 ? "" : "s"}! Type "pickme" in chat to for a chance to win!`);
    },
}

export default RaffleCommand;