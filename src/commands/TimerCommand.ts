import moment from "moment";
import { isLeadMod, reply, userHasAuthority } from "..";
import { ChatCommand } from "../classes/Types";
import {
  getTimer,
  setTimerLabel,
  setTimerLabelVisibility,
  setTimerPaused,
  setTimerSeconds,
  setTimerVisibility,
} from "../db/timer";
import { UserRoles } from "../models/user";
import durationFormat from "moment-duration-format";

durationFormat(moment);

const TimerCommand: ChatCommand = {
  enabled: true,
  name: "timer",
  help: "View the status of the current timer",
  subCommands: [
    {
      name: "set",
      help: "Set the duration of the timer, and display/hide it (0 = hide)",
      userLevel: UserRoles.LEAD_MOD,
      args: [
        {
          name: "duration",
          description: "The duration of the timer",
          required: true,
        },
      ],
    },
    {
      name: "show",
      help: "Show the timer on screen",
      userLevel: UserRoles.LEAD_MOD,
      args: [],
    },
    {
      name: "hide",
      help: "Hide the timer from the screen",
      userLevel: UserRoles.LEAD_MOD,
      args: [],
    },
    {
      name: "pause",
      help: "Pause the timer",
      userLevel: UserRoles.LEAD_MOD,
      args: [],
    },
    {
      name: "unpause",
      help: "Unpause the timer",
      userLevel: UserRoles.LEAD_MOD,
      args: [],
    },
    {
      name: "label",
      help: "Set the label of the timer",
      userLevel: UserRoles.LEAD_MOD,
      args: [
        {
          name: 'new_label | "default" | "hide"',
          description: "The new timer label",
          required: true,
        },
      ],
    },
  ],
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    content = content.trim();
    let args = content.split(/ +/);

    console.log("args", args);

    let subcommand = args[0].toLowerCase();
    let subcommandData = TimerCommand.subCommands.find(
      (sc) => sc.name.toLowerCase() === subcommand,
    );
    let authority = isLeadMod(message.userInfo);
    if (!authority || !subcommand || !subcommandData) {
      // !timer?
      let timer = getTimer();
      let formattedDuration = moment
        .duration(timer.seconds, "seconds")
        .format(
          `${timer.seconds >= 86400 ? "DD:" : ""}${timer.seconds >= 3600 ? "HH:" : ""}${timer.seconds >= 60 ? "mm:" : "[00:]"}ss`,
        );

      await reply(
        client,
        user,
        `⏱️ ${timer.paused ? `The timer is paused!${timer.seconds === 0 ? "" : ` There is ${formattedDuration} remaining.`}` : timer.seconds === 0 ? "The timer is not running!" : `The timer has ${formattedDuration} remaining!`}`,
        message,
      );
    } else if (subcommand && subcommandData) {
      if (subcommand === "set") {
        try {
          let duration = args?.[1];
          let durationUnit = duration
            ? duration.substring(duration.length - 1)
            : null;
          duration = durationUnit
            ? duration.replace(durationUnit, "").trim()
            : null;
          let duration_seconds =
            duration && durationUnit
              ? moment.duration(duration, durationUnit as any).asSeconds()
              : 0;
          console.log(duration);
          console.log(durationUnit);
          console.log(duration_seconds);
          if (!duration || duration_seconds === 0)
            return reply(
              client,
              user,
              `Correct Usage: !${TimerCommand.name} ${subcommand} {duration} (i.e. !${TimerCommand.name} ${subcommand} 20m)`,
              message,
            );
          if (duration_seconds >= 2505600)
            return reply(
              client,
              user,
              `Duration must be less than 29 days`,
              message,
            );

          let newTimer = setTimerSeconds(duration_seconds);
          if (!newTimer.visible) setTimerVisibility(true);

          let formattedDuration = moment
            .duration(newTimer.seconds, "seconds")
            .format(
              `${newTimer.seconds >= 86400 ? "DD:" : ""}${newTimer.seconds >= 3600 ? "HH:" : ""}${newTimer.seconds >= 60 ? "mm:" : "[00:]"}ss`,
            );

          reply(
            client,
            user,
            `⏱️ Set the timer to ${formattedDuration}`,
            message,
          );
        } catch (e) {
          return reply(
            client,
            user,
            `Correct Usage: !${TimerCommand.name} ${subcommand} {duration} (i.e. !${TimerCommand.name} ${subcommand} 20m)`,
            message,
          );
        }
      }

      if (subcommand === "show") {
        let timer = getTimer();
        if (timer.visible)
          return reply(client, user, `The timer is already visible!`, message);
        try {
          setTimerVisibility(true);
          reply(client, user, `Showing the timer!`, message);
        } catch (e) {
          return reply(
            client,
            user,
            `Failed to change timer visibility`,
            message,
          );
        }
      }

      if (subcommand === "hide") {
        let timer = getTimer();
        if (!timer.visible)
          return reply(client, user, `The timer is already hidden!`, message);
        try {
          setTimerVisibility(false);
          reply(client, user, `Hiding the timer!`, message);
        } catch (e) {
          return reply(
            client,
            user,
            `Failed to change timer visibility`,
            message,
          );
        }
      }

      if (subcommand === "pause") {
        let timer = getTimer();
        if (timer.paused)
          return reply(client, user, `The timer is already paused!`, message);
        try {
          setTimerPaused(true);
          reply(client, user, `Paused the timer!`, message);
        } catch (e) {
          return reply(client, user, `Failed to pause timer`, message);
        }
      }

      if (subcommand === "unpause") {
        let timer = getTimer();
        if (!timer.paused)
          return reply(client, user, `The timer is not paused!`, message);
        try {
          setTimerPaused(false);
          reply(client, user, `Unpaused the timer!`, message);
        } catch (e) {
          return reply(client, user, `Failed to unpause timer`, message);
        }
      }

      if (subcommand === "label") {
        args.shift();
        let label = args.join(" ").trim();
        if (!label || label === "")
          return reply(
            client,
            user,
            `!${TimerCommand.name} ${subcommand} {new_label}`,
            message,
          );
        if (label.toLowerCase() === "default") label = "Active Timer";
        if (label.toLowerCase() === "hide") {
          setTimerLabelVisibility(false);
          return reply(client, user, `Hiding the timer label`, message);
        } else {
          setTimerLabelVisibility(true);
        }
        try {
          setTimerLabel(label);
          reply(client, user, `Set timer label to: "${label}"!`, message);
        } catch (e) {
          return reply(client, user, `Failed to set timer label`, message);
        }
      }
    }
  },
};

export default TimerCommand;
