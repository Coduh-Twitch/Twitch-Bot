"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const raffle_1 = require("../db/raffle");
const user_1 = require("../models/user");
const RaffleCommand = {
    enabled: true,
    help: "Start a raffle",
    name: "raffle",
    args: [
        {
            name: "amount",
            required: true,
            description: "The amount of points to put up in the raffle"
        },
    ],
    subCommands: [
        {
            name: "cancel",
            help: "Cancel the active raffle",
            args: [],
            userLevel: user_1.UserRoles.MOD
        }
    ],
    userLevel: user_1.UserRoles.MOD,
    run: async (client, user, content, message) => {
        let raffles = (0, raffle_1.getAllRaffles)();
        content = content.trim();
        let args = content.split(' ');
        let amount = args[0] || 1000;
        if (Number.isNaN(Number(amount))) {
            if (amount.toString() === "cancel") {
                let raffle = (0, raffle_1.getAllRaffles)()?.[0];
                if (raffle) {
                    let parts = (0, raffle_1.getRaffleParticipants)(raffle.id);
                    let dr = (0, raffle_1.deleteRaffle)(raffle.id);
                    (0, index_1.reply)(client, user, `GoldPLZ @${message.userInfo.userName} Cancelled the raffle for ${dr.points.toLocaleString()} point${dr.points === 1 ? "" : "s"} with ${parts.length} participant${parts.length === 1 ? "" : "s"}`);
                    return;
                }
                else
                    amount = 1000;
            }
            else
                amount = 1000;
        }
        amount = Number(amount);
        if (raffles.length > 0)
            return (0, index_1.reply)(client, user, `There is already an active raffle!`, message);
        if (amount > 10000)
            return (0, index_1.reply)(client, user, `WTRuck Are you insane? ${amount.toLocaleString()} is way too many points. (max 10k)`, message);
        let newRaffle = (0, raffle_1.createRaffle)({ creator_id: message.userInfo.userId, points: amount });
        (0, index_1.reply)(client, user, `DinoDance @${message.userInfo.userName} Started a raffle for ${newRaffle.points.toLocaleString()} point${newRaffle.points === 1 ? "" : "s"}! Type "pickme" in chat to for a chance to win!`);
    },
};
exports.default = RaffleCommand;
//# sourceMappingURL=RaffleCommand.js.map