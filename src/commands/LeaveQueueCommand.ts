import { apiClient, reply } from "..";
import { ChatCommand } from "../classes/Types";
import {
  addQueueMember,
  getQueue,
  getQueueMembers,
  isBanned,
  removeQueueMember,
} from "../db/queues";
import { DBRoles } from "../db/schema";
import { UserRoles } from "../models/user";

const LeaveQueueCommand: ChatCommand = {
  enabled: true,
  name: "leavequeue",
  aliases: ["leavegame", "leave"],
  help: "Leave the current game queue",
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    let dbQueue = getQueue();
    if (!dbQueue)
      return reply(client, user, `There is no queue right now`, message);

    let queueMembers = getQueueMembers(dbQueue.id);
    let queueMemberTarget =
      queueMembers.find((m) => m.id === message.userInfo.userId) || null;
    if (!queueMemberTarget)
      return reply(client, user, `You are not in the queue.`);

    try {
      let newParticipant = removeQueueMember(
        dbQueue.id,
        message.userInfo.userId,
      );

      reply(
        client,
        user,
        `Removed you from position #${newParticipant.position} in the queue`,
      );
    } catch (e) {
      console.log(e);
      reply(client, user, `Failed to leave queue. Please try again.`, message);
    }
  },
};

export default LeaveQueueCommand;
