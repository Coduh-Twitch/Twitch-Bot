import { reply } from "..";
import { ChatCommand } from "../classes/Types";
import { getBotConfig, updateBotConfig } from "../db/botconfig";
import { UserRoles } from "../models/user";

const ToggleTTSCommand: ChatCommand = {
  enabled: true,
  userLevel: UserRoles.LEAD_MOD,
  name: "toggletts",
  help: "Toggle TTS on/off",
  aliases: ["ttts"],
  args: [
    {
      name: "bits|points|command",
      description:
        "Toggle TTS redemptions for bits (cheers), channel points, or the !tts command",
      required: true,
    },
  ],
  run: async (client, user, content, message) => {
    content = content.trim();
    let args = content.split(" ").map((a) => a.trim().toLowerCase());
    if (!args[0] || !["bits", "points", "command"].includes(args[0]))
      return reply(
        client,
        user,
        `Correct usage: !${ToggleTTSCommand.name} ${ToggleTTSCommand.args[0].name}`,
      );

    if (args[0] === "bits") {
      try {
        let botConfig = getBotConfig(process.env.BOT_USER_ID);
        let set = !botConfig.cheer_tts_enabled;

        let newBotConfig = updateBotConfig(botConfig.id, {
          cheer_tts_enabled: set,
          id: botConfig.id,
        });

        reply(
          client,
          user,
          `Toggled TTS for bits ${newBotConfig.cheer_tts_enabled ? "ON" : "OFF"}`,
        );
      } catch (e) {
        reply(client, user, `Failed to toggle TTS for bits`);
      }
    }

    if (args[0] === "points") {
      try {
        let botConfig = getBotConfig(process.env.BOT_USER_ID);
        let set = !botConfig.reward_tts_enabled;

        let newBotConfig = updateBotConfig(botConfig.id, {
          reward_tts_enabled: set,
          id: botConfig.id,
        });

        reply(
          client,
          user,
          `Toggled TTS for channel points ${newBotConfig.reward_tts_enabled ? "ON" : "OFF"}`,
        );
      } catch (e) {
        reply(client, user, `Failed to toggle TTS for channel points`);
      }
    }

    if (args[0] === "command") {
      try {
        let botConfig = getBotConfig(process.env.BOT_USER_ID);
        let set = !botConfig.command_tts_enabled;

        let newBotConfig = updateBotConfig(botConfig.id, {
          command_tts_enabled: set,
          id: botConfig.id,
        });

        reply(
          client,
          user,
          `Toggled !tts command ${newBotConfig.command_tts_enabled ? "ON" : "OFF"}`,
        );
      } catch (e) {
        reply(client, user, `Failed to toggle !tts command`);
      }
    }
  },
};

export default ToggleTTSCommand;
