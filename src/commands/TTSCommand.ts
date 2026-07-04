import { reply } from "..";
import { TTSVoices } from "../classes/Types";
import { ChatCommand, UserRolesStringMap } from "../classes/Types";
import { getBotConfig } from "../db/botconfig";
import { addTTS, getTTSQueue, removeTTS } from "../db/tts";
import { UserRoles } from "../models/user";
import Filter from "leo-profanity";

const TTSCommand: ChatCommand = {
  enabled: true,
  userLevel: UserRoles.MOD,
  name: "tts",
  help: "Speak through TTS",
  subCommands: [
    // {
    //   name: "skip",
    //   help: "Skip the currently playing TTS",
    //   userLevel: UserRoles.MOD,
    //   args: [],
    // },
  ],
  run: async (client, user, content, message) => {
    content = content.trim();
    let split = content.split(" ");
    let subcommand = split[0];

    console.log("SPLIT", split);

    if (subcommand === "skip" && !split?.[1]) {
      let queue = getTTSQueue();
      if (!queue[0]) return reply(client, user, `TTS is not playing.`);
      let playingId = queue[0].id;
      removeTTS(playingId);
    } else {
      let botConfig = getBotConfig(process.env.BOT_USER_ID);
      if (!botConfig.command_tts_enabled)
        return reply(client, user, `The !tts command is currently disabled.`);
      if (content === "")
        return reply(client, user, `Operation Y.A.P. failed NotLikeThis`);
      try {
        let newTTS = addTTS({
          content: Filter.clean(content),
          sent_at: Date.now(),
          sent_by_id: message.userInfo.userId,
          sent_by_username: message.userInfo.displayName,
          voice: TTSVoices.ERIC,
        });
        let newQueue = getTTSQueue();
        let newTTSIndex = newQueue.indexOf(
          newQueue.find((tts) => tts.id === newTTS.id),
        );

        reply(
          client,
          user,
          `${newTTSIndex === 0 ? `Yapping Immediately...` : `TTS added to queue at position ${(newTTSIndex + 1).toLocaleString()}`}`,
          message,
        );
      } catch (e) {
        reply(client, user, `Operation Y.A.P. failed NotLikeThis`);
      }
    }
  },
};

export default TTSCommand;
