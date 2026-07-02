import moment from "moment";
import { isLeadMod, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { userModel, UserRoles } from "../models/user";
import { giveaways } from "../db/schema";
import {
  createGiveaway,
  deleteGiveaway,
  getAllEntrants,
  getAllGiveaways,
  removeEntrant,
} from "../db/giveaways";

const GiveawayCommand: ChatCommand = {
  enabled: true,
  name: "giveaway",
  help: "Manage giveaways",
  subCommands: [
    {
      name: "start",
      help: "Start a new giveaway",
      userLevel: UserRoles.LEAD_MOD,
      args: [
        {
          name: "duration",
          description: "How long the giveaway should last (i.e. 7d = 1 week)",
          required: true,
        },
        {
          name: "winners",
          description: "How many people should win the giveaway? (default: 1)",
          required: true,
        },
        {
          name: "prize",
          description: "What is the prize of the giveaway?",
          required: true,
        },
      ],
    },
    {
      name: "cancel",
      help: "Cancel an existing giveaway",
      userLevel: UserRoles.LEAD_MOD,
      args: [],
    },
  ],
  userLevel: UserRoles.LEAD_MOD,
  run: async (client, user, content, message) => {
    let actions = GiveawayCommand.subCommands.map((sc) => sc.name);

    content = content.trim();
    let args = content.split(" ");
    let action = args[0];

    if (!action) action = message.userInfo.userName.toLowerCase();

    console.log(action);

    try {
      if (action && actions.includes(action)) {
        if (!isLeadMod(message.userInfo))
          return reply(
            client,
            user,
            `You must be Lead Moderator or higher to do that.`,
            message,
          );

        // action
        switch (action) {
          case "start": {
            let allGiveaways = getAllGiveaways();
            if (allGiveaways.length > 0)
              return reply(
                client,
                user,
                `Another giveaway is already running (${allGiveaways[0].prize})`,
                message,
              );
            let durationString = args?.[1];
            let duration = args?.[1];
            let durationUnit = duration
              ? duration.substring(duration.length - 1)
              : null;
            duration = durationUnit
              ? duration.replace(durationUnit, "").trim()
              : null;
            let duration_ms =
              duration && durationUnit
                ? moment
                    .duration(duration, durationUnit as any)
                    .asMilliseconds()
                : 0;
            console.log(duration);
            console.log(durationUnit);
            console.log(duration_ms);
            if (!duration || duration_ms <= 0)
              return reply(
                client,
                user,
                `Correct Usage: !${GiveawayCommand.name} ${action} {duration} {winners} {prize} (i.e. !${GiveawayCommand.name} ${action} 7d {winners} {prize})`,
                message,
              );

            let winners =
              args?.[2] && !Number.isNaN(Number(args[2])) ? Number(args[2]) : 0;

            if (!winners || winners <= 0)
              return reply(
                client,
                user,
                `Correct Usage: !${GiveawayCommand.name} ${action} ${durationString} {winners} {prize} (i.e. !${GiveawayCommand.name} ${action} ${durationString} 1 {prize})`,
                message,
              );

            console.log("winners", winners);
            args.shift();
            args.shift();
            args.shift();

            let prize = args.join(" ").trim();
            console.log("PRIZE", prize);
            if (!prize || prize === "")
              return reply(
                client,
                user,
                `Correct Usage: !${GiveawayCommand.name} ${action} ${durationString} ${winners} {prize} (i.e. !${GiveawayCommand.name} ${action} ${durationString} ${winners} Special Gift Card)`,
                message,
              );

            let endTime = new Date(Date.now() + duration_ms).getTime();

            let giveawayData: typeof giveaways.$inferInsert = {
              created_at: Date.now(),
              created_by: message.userInfo.userId,
              ends_at: endTime,
              winners,
              prize,
            };

            try {
              let newGiveaway = createGiveaway(giveawayData);
              let dateFormatter = new Intl.DateTimeFormat("en-US", {
                dateStyle: "long",
                timeStyle: "long",
                timeZone: "America/New_York",
              });

              return reply(
                client,
                user,
                `Started giveaway with ${newGiveaway.winners} winner${newGiveaway.winners === 1 ? "" : "s"} for ${newGiveaway.prize} | Giveaway ends ${dateFormatter.format(newGiveaway.ends_at)}`,
                message,
              );
            } catch (e) {
              return reply(client, user, `Failed to start giveaway`);
            }

            break;
          }
          case "cancel": {
            let allGiveaways = getAllGiveaways();
            if (allGiveaways.length <= 0)
              return reply(
                client,
                user,
                `There are no giveaways running.`,
                message,
              );

            try {
              let giveaway = allGiveaways[0];
              let entries = getAllEntrants(giveaway.id);

              for (const entry of entries) {
                removeEntrant(entry.giveaway_id, entry.user_id);
              }

              deleteGiveaway(giveaway.id);

              return reply(
                client,
                user,
                `Successfully cancelled the giveaway.`,
                message,
              );
            } catch (e) {
              return reply(client, user, `Failed to cancel giveaway`, message);
            }

            break;
          }
          default: {
            return reply(
              client,
              user,
              `Correct Usage: ${GiveawayCommand.subCommands.map((sc) => `!${GiveawayCommand.name} ${sc.name} ${sc.args.map((a) => `{${a.name}${a.required ? "*" : ""}}`).join(" ")}`).join("|")}`,
            );
          }
        }
      } else
        return reply(
          client,
          user,
          `Correct Usage: !${GiveawayCommand.name} ${GiveawayCommand.subCommands.map((sc) => `${sc.name} ${sc.args.map((a) => `{${a.name}${a.required ? "*" : ""}}`).join(" ")}`).join("|")}`,
        );
    } catch (e) {
      console.log(e);
      return reply(
        client,
        user,
        `Something went wrong. Please try again later.`,
      );
    }
  },
};

export default GiveawayCommand;
