import { reply } from "..";
import { ChatCommand } from "../classes/Types";
import { clearAmazonQueue, getAmazonQueue } from "../db/amazon";
import { getBotConfig, updateBotConfig } from "../db/botconfig";
import { UserRoles } from "../models/user";

const ClearAmazonQueueCommand: ChatCommand = {
  enabled: true,
  userLevel: UserRoles.LEAD_MOD,
  name: "clearazqueue",
  help: "Clear the Amazon product queue.",
  aliases: ["cazq"],
  args: [],
  run: async (client, user, content, message) => {
    let queue = getAmazonQueue();
    if (queue.length <= 0)
      return reply(client, user, `The Amazon queue is already empty.`, message);
    try {
      clearAmazonQueue();
      reply(
        client,
        user,
        `Cleared ${queue.length} item${queue.length === 1 ? "" : "s"} from the Amazon queue!`,
      );
    } catch (e) {
      reply(
        client,
        user,
        `Failed to remove ${queue.length} item${queue.length === 1 ? "" : "s"} from the Amazon queue NotLikeThis`,
      );
    }
  },
};

export default ClearAmazonQueueCommand;
