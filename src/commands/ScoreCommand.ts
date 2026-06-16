import { get, post } from "axios";
import {
  apiClient,
  broadcasterApiClient,
  ESPN,
  reply,
  SOCIAL_LINKS,
  userHasAuthority,
} from "../index";
import { ChatCommand } from "../classes/Types";
import { UserRoles } from "../models/user";
import { sessionModel } from "../models/session";
import { DBSession } from "../db/schema";
import { EspnCompetition, EspnSeason, EspnSeasonEvent } from "../classes/Espn";

const ScoreCommand: ChatCommand = {
  enabled: true,
  name: "score",
  help: "Get the score of the current sports event being tracked",
  userLevel: UserRoles.DEFAULT,
  subCommands: [
    {
      name: "refetch",
      userLevel: UserRoles.MOD,
      help: "Reset the current scores being tracked, and fetch the most current event",
      args: [],
    },
    {
      name: "mute",
      userLevel: UserRoles.MOD,
      help: "Mute Sports Alerts in the chat",
      args: [],
    },
    {
      name: "unmute",
      userLevel: UserRoles.MOD,
      help: "Unmute Sports Alerts in the chat",
      args: [],
    },
    {
      name: "choose",
      userLevel: UserRoles.MOD,
      help: "Manually choose the match to track",
      args: [
        {
          name: "basketball | soccer | football | baseball",
          description: `Set the tracked sport`,
          required: true,
        },
      ],
    },
    {
      name: "setsport",
      userLevel: UserRoles.MOD,
      help: "Set the current sport being tracked",
      args: [
        {
          name: "basketball | soccer | football | baseball",
          description: `Set the tracked sport`,
          required: false,
        },
      ],
    },
  ],
  aliases: ["scores"],
  run: async (client, user, content, message) => {
    let args = content
      .split(/ +/gim)
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a !== "");
    console.log("ARGS", args);

    if (
      !args?.[0] ||
      !ScoreCommand.subCommands.map((sc) => sc.name).includes(args?.[0])
    ) {
      if (ESPN.competition) {
        reply(client, user, `${ESPN.getScoreString()}`, message);
      } else {
        reply(client, user, `No competitions are being tracked`);
      }
    } else if (args[0] === "refetch" && ESPN.competition && ESPN.event) {
      if (!userHasAuthority(message.userInfo))
        return reply(
          client,
          user,
          `You must be Moderator or higher to do that`,
        );
      try {
        ESPN.resetListeners();
        reply(client, user, `Fetching the current event...`);
      } catch (e) {
        reply(client, user, `Failed to re-fetch ESPN data`);
      }
    } else if (args[0] === "setsport") {
      if (!userHasAuthority(message.userInfo))
        return reply(
          client,
          user,
          `You must be Moderator or higher to do that`,
        );
      try {
        let sports = Object.values(EspnSeason);
        if (!sports.includes(args[1] as any))
          return reply(
            client,
            user,
            `Failed to set sport to "${args[1]}", sport is not available (football, soccer, basketball)`,
          );
        ESPN.resetListeners();
        if (args[1] === "basketball") ESPN.setSeason(EspnSeason.BASKETBALL);
        if (args[1] === "soccer") ESPN.setSeason(EspnSeason.SOCCER);
        if (args[1] === "football") ESPN.setSeason(EspnSeason.FOOTBALL);
        // if (args[1] === "baseball") ESPN.setSeason(EspnSeason.BASEBALL);
        reply(
          client,
          user,
          `Set the tracked sport to ${sports.find((s) => s === args[1])} (${ESPN.getLeagueReadable()}) | The sport may auto-update depending on match availability`,
        );
      } catch (e) {
        reply(client, user, `Failed to re-fetch ESPN data`);
      }
    } else if (args[0] === "choose") {
      if (!userHasAuthority(message.userInfo))
        return reply(
          client,
          user,
          `You must be Moderator or higher to do that`,
        );
      try {
        let sports = Object.values(EspnSeason);
        if (!sports.includes(args[1] as any))
          return reply(
            client,
            user,
            `Failed to find sport "${args[1]}", sport is not available (football, soccer, basketball)`,
          );

        let sport = args[1] as EspnSeason;
        console.log("SPORT", sport);

        interface ChooseCompetitionOption {
          index: number;
          event: EspnSeasonEvent;
          competition: EspnCompetition;
        }

        let currentEvents = await ESPN.getAllEvents(sport);
        console.log("EVENT", currentEvents);
        if (!currentEvents || currentEvents.length <= 0)
          return reply(
            client,
            user,
            `There are no ${ESPN.getLeagueReadable(sport)} events happening right now`,
          );

        let currentCompetitions: EspnCompetition[] = [];
        let options: ChooseCompetitionOption[] = [];

        let i = 0;
        for (const event of currentEvents) {
          let comps = await ESPN.getAllCompetitions(event);
          console.log("COMPS", comps.length, comps);
          if (!comps || comps.length <= 0) continue;
          for (const comp of comps) {
            let statusRes = await get(comp.status.$ref);
            if (!statusRes || !statusRes.data) continue;
            if (statusRes.data.type.completed) continue;
            i += 1;
            currentCompetitions.push(comp);
            options.push({
              competition: comp,
              event: event,
              index: i,
            });
          }
        }

        if (!currentCompetitions || currentCompetitions.length <= 0)
          return reply(
            client,
            user,
            `There are no competitions for ${ESPN.getLeagueReadable(sport)} right now.`,
          );

        let mappedStr = [];
        let mappedIndex = 0;

        for (const o of options) {
          let str = `${o.index}: ${o.event.shortName} @ ${o.competition.venue.fullName}`;
          if ([...mappedStr, str].join(" | ").length > 500) continue;
          mappedStr.push(str);
        }

        reply(client, user, `< @${user} >`).then(() => {
          setTimeout(() => {
            reply(
              client,
              user,
              `Please choose a competition to track, type "0" to cancel.`,
            ).then(() => {
              setTimeout(() => {
                reply(
                  client,
                  user,
                  // `${options.map((o) => `${o.index}: ${o.event.shortName} @ ${o.competition.venue.fullName}`).join(" | ")}`,
                  mappedStr.join(" | "),
                ).then(() => {
                  setTimeout(() => {
                    reply(client, user, `< @${user} >`);
                  }, 5e2);
                });
              }, 5e2);
            });
          }, 5e2);
        });

        let listener = client.onMessage(async (ch, u, c, m) => {
          if (u.toLowerCase() === user.toLowerCase()) {
            let option = options.find((o) => o.index === Number(c));
            if (c === "0" || c.startsWith("0")) {
              listener.unbind();
              reply(client, user, `Cancelled!`);
              return;
            }
            if (!option || Number.isNaN(Number(c)))
              return reply(
                client,
                user,
                `"${c}" is an invalid competition (1-${options.sort((a, b) => b.index - a.index)[0].index})`,
                message,
              );
            if (option) {
              let comp = option.competition;
              let event = option.event;

              ESPN.setCompetition(sport, event, comp.id)
                .then(async (newComp) => {
                  reply(
                    client,
                    user,
                    `Now tracking ${ESPN.getLeagueReadable(sport)} event ${event.name} @ ${newComp.venue.fullName}`,
                  );
                  listener.unbind();
                })
                .catch((e) => {
                  console.log("ERROR", e);
                  reply(
                    client,
                    user,
                    `Failed to select competition ${option.index}. Please try again, or type "0" to cancel.`,
                  );
                });
            }
          }
        });

        // ESPN.resetListeners();
        // if (args[1] === "basketball") ESPN.setSeason(EspnSeason.BASKETBALL);
        // if (args[1] === "soccer") ESPN.setSeason(EspnSeason.SOCCER);
        // if (args[1] === "football") ESPN.setSeason(EspnSeason.FOOTBALL);
        // // if (args[1] === "baseball") ESPN.setSeason(EspnSeason.BASEBALL);
        // await reply(
        //   client,
        //   user,
        //   `Set the tracked sport to ${sports.find((s) => s === args[1])} (${ESPN.getLeagueReadable()}) | The sport may auto-update depending on match availability`,
        // );
      } catch (e) {
        reply(client, user, `Failed to re-fetch ESPN data`);
      }
    } else if (args[0] === "mute") {
      if (!userHasAuthority(message.userInfo))
        return reply(
          client,
          user,
          `You must be Moderator or higher to do that`,
        );
      if (!ESPN.muted) {
        let m = ESPN.mute();
        if (m) {
          reply(client, user, `Sports Alerts muted!`);
        } else return reply(client, user, `Sports Alerts are already muted.`);
      } else return reply(client, user, `Sports Alerts are already muted.`);
    } else if (args[0] === "unmute") {
      if (!userHasAuthority(message.userInfo))
        return reply(
          client,
          user,
          `You must be Moderator or higher to do that`,
        );
      if (ESPN.muted) {
        let m = ESPN.unmute();
        if (!m) {
          reply(client, user, `Sports Alerts unmuted!`);
        } else return reply(client, user, `Sports Alerts are not muted.`);
      } else return reply(client, user, `Sports Alerts are not muted.`);
    }
  },
};

export default ScoreCommand;
