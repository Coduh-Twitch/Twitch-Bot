import {
  apiClient,
  getPinnedMessage,
  reply,
  sendAndPin,
  unpinMessage,
} from "../index";
import { ChatCommand } from "../classes/Types";
import { userModel, UserRoles } from "../models/user";
import { getRoomCode, setRoomCode } from "../util";
import { Message } from "ircv3";

const ClearRoomCodeCommand: ChatCommand = {
  enabled: true,
  name: "clearroomcode",
  aliases: ["crc", "clearcode"],
  help: "Clear the game code.",
  args: [],
  userLevel: UserRoles.MOD,
  run: async (client, user, content, message) => {
    try {
      let oldCode = await getRoomCode();
      if (!oldCode)
        return reply(client, user, `The code is already cleared.`, message);
      let set: boolean = await setRoomCode(null);
      if (set) {
        await client.say(process.env.CHANNEL, `Code has been cleared`);
        // await unpinMessage();
        let pinnedMessage = await getPinnedMessage();
        if (pinnedMessage && oldCode) {
          if (
            pinnedMessage.content.toLowerCase().includes(oldCode.toLowerCase())
          )
            await unpinMessage();
        }
      } else {
        reply(client, user, `Failed to clear Room Code`, message);
      }
    } catch (e) {
      reply(client, user, `Failed to clear Room Code`, message);
      console.log(e);
    }
  },
};

export default ClearRoomCodeCommand;
