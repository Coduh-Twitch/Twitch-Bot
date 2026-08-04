import { apiClient, reply } from "..";
import { ChatCommand } from "../classes/Types";
import {
  addQueueMember,
  getQueue,
  getQueueMembers,
  isBanned,
} from "../db/queues";
import { DBRoles } from "../db/schema";
import { UserRoles } from "../models/user";

const JoinCommand: ChatCommand = {
  enabled: true,
  name: "joinqueue",
  aliases: ["joingame"],
  help: "Join the current game queue",
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    let dbQueue = getQueue();
    if (!dbQueue)
      return reply(client, user, `There is no queue right now`, message);
    if (isBanned(message.userInfo.userId))
      return reply(
        client,
        user,
        `You are banned from joining queues.`,
        message,
      );

    let queueMembers = getQueueMembers(dbQueue.id);
    let queueMemberTarget =
      queueMembers.find((m) => m.id === message.userInfo.userId) || null;
    if (queueMemberTarget)
      return reply(
        client,
        user,
        `You are already in the queue at position #${queueMemberTarget.position}`,
        message,
      );

    try {
      let apiUser = await apiClient.users.getUserById(message.userInfo.userId);
      if (!apiUser)
        return reply(client, user, `Failed to join queue. Please try again.`);

      let role = message.userInfo.isSubscriber
        ? DBRoles.SUBSCRIBER
        : message.userInfo.isVip
          ? DBRoles.VIP
          : message.userInfo.isMod || message.userInfo.isLeadMod
            ? DBRoles.MOD
            : DBRoles.DEFAULT;

      let newParticipant = addQueueMember(dbQueue.id, {
        id: message.userInfo.userId,
        avatar_url: apiUser.profilePictureUrl,
        queueId: dbQueue.id,
        username: apiUser.name,
        joined_at: Date.now(),
        role,
      });

      let participants = getQueueMembers(dbQueue.id);
      let joinedAtPosition = participants.indexOf(newParticipant) + 1;

      reply(
        client,
        user,
        `Joined the queue at position #${newParticipant.position}`,
      );
    } catch (e) {
      console.log(e);
      reply(client, user, `Failed to join queue. Please try again.`, message);
    }
  },
};

export default JoinCommand;
