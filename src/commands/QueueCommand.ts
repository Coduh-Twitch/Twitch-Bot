import { apiClient, reply, userHasAuthority } from "..";
import { ChatCommand } from "../classes/Types";
import {
  addQueueMember,
  clearParticipants,
  createQueue,
  deleteQueue,
  getQueue,
  getQueueMembers,
  isBanned,
  isInQueue,
  queueBan,
  queueUnban,
  removeQueueMember,
  shiftQueue,
  toggleQueueMemberBump,
  updateQueue,
} from "../db/queues";
import { DBRoles } from "../db/schema";
import { UserRoles } from "../models/user";

const QueueCommand: ChatCommand = {
  enabled: true,
  name: "gamequeue",
  aliases: ["gq"],
  help: "View the current game queue",
  userLevel: UserRoles.DEFAULT,
  subCommands: [
    {
      name: "create",
      help: "Create a new game queue",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Size",
          description: "The total amount of players to allow in the queue",
          required: true,
        },
        {
          name: "Game Title",
          description: "The game that this queue is for",
          required: true,
        },
      ],
    },
    {
      name: "delete",
      help: "Delete the current game queue",
      userLevel: UserRoles.MOD,
      args: [],
    },
    {
      name: "roundmembers",
      help: "Set the total number of players per-round",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Size",
          description: "The total amount of players per-round",
          required: true,
        },
      ],
    },
    {
      name: "setgame",
      help: "Set the game title of the current queue",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Game Title",
          description: "The game that this queue is for",
          required: true,
        },
      ],
    },
    {
      name: "max",
      help: "Set the total number of players allowed in the queue",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Size",
          description: "The total amount of players to allow in the queue",
          required: true,
        },
      ],
    },
    {
      name: "ban",
      help: "Ban a user from joining the queue",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Username",
          description: "The user to ban from the queue",
          required: true,
        },
      ],
    },
    {
      name: "unban",
      help: "Unban a previously queue-banned user",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Username",
          description: "The user to unban",
          required: true,
        },
      ],
    },
    {
      name: "remove",
      help: "Remove a user from the queue",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Username",
          description: "The user to remove from the queue",
          required: true,
        },
      ],
    },
    {
      name: "clear",
      help: "Clear some or all users from the queue",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "all",
          description: "Remove all users, or only non-Mod/VIP users?",
          required: false,
        },
      ],
    },
    {
      name: "bump",
      help: "Bump a user to the top of the queue",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Username",
          description: "The user to bump to the top of the queue",
          required: true,
        },
      ],
    },
    {
      name: "unbump",
      help: "Remove a user's bumped status",
      userLevel: UserRoles.MOD,
      args: [
        {
          name: "Username",
          description: "The user to unbump",
          required: true,
        },
      ],
    },
    {
      name: "shift",
      help: "Remove the first X players from the queue based on the players-per-round",
      userLevel: UserRoles.MOD,
      args: [],
    },
  ],
  run: async (client, user, content, message) => {
    content = content.trim();
    let action = content.split(" ")[0];
    if (
      !action ||
      ![
        "create",
        "roundmembers",
        "delete",
        "remove",
        "ban",
        "unban",
        "clear",
        "setgame",
        "max",
        "bump",
        "unbump",
        "shift",
      ].includes(action)
    ) {
      // send queue link
      let dbQueue = getQueue();
      if (!dbQueue)
        return reply(client, user, `There is not a queue currently open.`);
      let queueMembers = getQueueMembers(dbQueue.id);
      let target =
        queueMembers.find((m) => m.id === message.userInfo.userId) || null;

      reply(
        client,
        user,
        `${target ? `You are in the queue at position #${target.position} | ` : ""}View the full "${dbQueue.game}" Queue -> ${process.env.WEB_URL}/gamequeue`,
      );
      return;
    }

    if (!userHasAuthority(message.userInfo))
      return reply(
        client,
        user,
        `Only the broadcaster and moderators can do this`,
      );

    let args = content.replace(action, "").trim().split(/ +/s);

    if (action === "create") {
      let rosterSize = Number(args.shift());
      let game = args.join(" ");

      if (!rosterSize || Number.isNaN(rosterSize))
        return reply(
          client,
          user,
          `Command Usage: !gamequeue create <rosterSize> <Game Title>`,
        );
      if (!game || game === "")
        return reply(
          client,
          user,
          `Command Usage: !gamequeue create ${rosterSize} <Game Title>`,
        );

      try {
        let newQueue = createQueue({
          createdByUserId: message.userInfo.userId,
          game,
          maximumRosterSize: rosterSize,
        });
        clearParticipants(newQueue.id);

        reply(
          client,
          user,
          `Created queue of size ${newQueue.maximumRosterSize} for "${newQueue.game}". Set the round size with !gamequeue roundmembers <amount> (default: 8)`,
          message,
        );
      } catch (e) {
        console.log(e);
        reply(
          client,
          user,
          `Failed to create your queue. Please try again.`,
          message,
        );
      }
    }

    if (action === "delete") {
      try {
        let dbQueue = getQueue();

        if (!dbQueue)
          return reply(client, user, `There was no queue to delete.`);

        let deletedQueue = deleteQueue(dbQueue.id);
        clearParticipants(dbQueue.id, false);

        reply(
          client,
          user,
          `Deleted queue for "${deletedQueue ? deletedQueue.game : "Unknown"}"`,
          message,
        );
      } catch (e) {
        reply(
          client,
          user,
          `Failed to create your queue. Please try again.`,
          message,
        );
      }
    }

    if (action === "roundmembers") {
      let count = Number(args.shift());
      if (!count || Number.isNaN(count))
        return reply(
          client,
          user,
          `Command Usage: !gamequeue roundmembers <count>`,
        );

      let dbQueue = getQueue();

      try {
        let newQueue = dbQueue
          ? updateQueue(dbQueue.id, { membersPerRound: count })
          : createQueue({
              createdByUserId: message.userInfo.userId,
              maximumRosterSize: 24,
              membersPerRound: count,
            });

        reply(
          client,
          user,
          `Set members per round to ${count} for the "${newQueue.game}" queue!`,
        );
      } catch (e) {
        reply(
          client,
          user,
          `Failed to update your queue. Please try again.`,
          message,
        );
      }
    }

    if (action === "setgame") {
      let game = args.join(" ").trim();
      if (!game || game == "")
        return reply(
          client,
          user,
          `Command Usage: !gamequeue setgame <Game Title>`,
        );

      let dbQueue = getQueue();

      try {
        let newQueue = dbQueue
          ? updateQueue(dbQueue.id, { game })
          : createQueue({
              createdByUserId: message.userInfo.userId,
              maximumRosterSize: 24,
              game,
            });

        reply(client, user, `Set the queue game to "${newQueue.game}"!`);
      } catch (e) {
        reply(
          client,
          user,
          `Failed to update your queue. Please try again.`,
          message,
        );
      }
    }

    if (action === "max") {
      let count = Number(args.shift());
      if (!count || Number.isNaN(count))
        return reply(client, user, `Command Usage: !gamequeue max <count>`);

      let dbQueue = getQueue();

      try {
        let newQueue = dbQueue
          ? updateQueue(dbQueue.id, { maximumRosterSize: count })
          : createQueue({
              createdByUserId: message.userInfo.userId,
              maximumRosterSize: count,
              membersPerRound: count > 12 ? 12 : Math.floor(count / 2),
            });

        reply(
          client,
          user,
          `Set max size to ${count} for the "${newQueue.game}" queue!`,
        );
      } catch (e) {
        reply(
          client,
          user,
          `Failed to update the queue. Please try again.`,
          message,
        );
      }
    }

    if (action === "ban") {
      let target = args.shift().replace("@", "");
      if (!target || target == "")
        return reply(client, user, `Command Usage: !gamequeue ban <username>`);

      let apiUser = await apiClient.users.getUserByName(target.toLowerCase());
      if (!apiUser) return reply(client, user, `User "${target}" not found`);

      if (apiUser.id === message.channelId)
        return reply(client, user, `The broadcaster can not be queue banned`);
      if (apiUser.id === message.userInfo.userId)
        return reply(client, user, `You can not queue ban yourself`);

      try {
        if (isBanned(apiUser.id))
          return reply(
            client,
            user,
            `${apiUser.displayName} is already queue banned`,
          );
        queueBan(apiUser.id);

        reply(
          client,
          user,
          `Banned ${apiUser.displayName} from joining queues`,
        );
      } catch (e) {
        reply(
          client,
          user,
          `Failed to ban user from the queue. Please try again.`,
          message,
        );
      }
    }

    if (action === "unban") {
      let target = args.shift().replace("@", "");
      if (!target || target == "")
        return reply(
          client,
          user,
          `Command Usage: !gamequeue unban <username>`,
        );

      let apiUser = await apiClient.users.getUserByName(target.toLowerCase());
      if (!apiUser) return reply(client, user, `User "${target}" not found`);

      if (apiUser.id === message.userInfo.userId)
        return reply(client, user, `You can not queue unban yourself`);

      try {
        if (!isBanned(apiUser.id))
          return reply(
            client,
            user,
            `${apiUser.displayName} is not queue banned`,
          );
        queueUnban(apiUser.id);

        reply(
          client,
          user,
          `Unbanned ${apiUser.displayName}, they can resume joining queues`,
        );
      } catch (e) {
        reply(
          client,
          user,
          `Failed to unban user from the queue. Please try again.`,
          message,
        );
      }
    }

    if (action === "remove") {
      let target = args.shift().replace("@", "");
      if (!target || target == "")
        return reply(
          client,
          user,
          `Command Usage: !gamequeue remove <username>`,
        );

      let apiUser = await apiClient.users.getUserByName(target.toLowerCase());
      if (!apiUser) return reply(client, user, `User "${target}" not found`);

      if (apiUser.id === message.userInfo.userId)
        return reply(
          client,
          user,
          `Use !leave to remove yourself from the queue`,
        );

      try {
        let dbQueue = getQueue();

        if (!isInQueue(apiUser.id))
          return reply(
            client,
            user,
            `${apiUser.displayName} is not in the queue`,
          );
        removeQueueMember(dbQueue.id, apiUser.id);

        reply(client, user, `Removed ${apiUser.displayName} from the queue`);
      } catch (e) {
        reply(
          client,
          user,
          `Failed to remove user from the queue. Please try again.`,
          message,
        );
      }
    }

    if (action === "clear") {
      let all = args.shift().trim();

      if (all === "all") {
        try {
          let dbQueue = getQueue();

          clearParticipants(dbQueue.id, false);

          reply(client, user, `Removed all users from the queue`);
        } catch (e) {
          reply(
            client,
            user,
            `Failed to remove users from the queue. Please try again.`,
            message,
          );
        }
      } else {
        try {
          let dbQueue = getQueue();

          clearParticipants(dbQueue.id, true);

          reply(
            client,
            user,
            `Removed all non-Mod and non-VIP users from the queue`,
          );
        } catch (e) {
          reply(
            client,
            user,
            `Failed to remove users from the queue. Please try again.`,
            message,
          );
        }
      }
    }

    if (action === "bump") {
      let target = args.shift().replace("@", "");
      if (!target || target == "")
        return reply(client, user, `Command Usage: !gamequeue bump <username>`);

      let apiUser = await apiClient.users.getUserByName(target.toLowerCase());
      if (!apiUser) return reply(client, user, `User "${target}" not found`);

      if (apiUser.id === message.userInfo.userId)
        return reply(client, user, `You can not bump yourself.`);

      try {
        let dbQueue = getQueue();

        if (!isInQueue(apiUser.id))
          return reply(
            client,
            user,
            `${apiUser.displayName} is not in the queue`,
          );

        let queueMember = getQueueMembers(dbQueue.id).find(
          (m) => m.id === apiUser.id,
        );
        if (queueMember.bumped)
          return reply(
            client,
            user,
            `${apiUser.displayName} is already bumped. (Position #${queueMember.position})`,
          );

        let newParticipant = toggleQueueMemberBump(dbQueue.id, queueMember.id);

        reply(client, user, `Bumped ${apiUser.displayName}`);
      } catch (e) {
        reply(client, user, `Failed to bump user. Please try again.`, message);
      }
    }

    if (action === "unbump") {
      let target = args.shift().replace("@", "");
      if (!target || target == "")
        return reply(
          client,
          user,
          `Command Usage: !gamequeue unbump <username>`,
        );

      let apiUser = await apiClient.users.getUserByName(target.toLowerCase());
      if (!apiUser) return reply(client, user, `User "${target}" not found`);

      if (apiUser.id === message.userInfo.userId)
        return reply(client, user, `You can not unbump yourself.`);

      try {
        let dbQueue = getQueue();

        if (!isInQueue(apiUser.id))
          return reply(
            client,
            user,
            `${apiUser.displayName} is not in the queue`,
          );

        let queueMember = getQueueMembers(dbQueue.id).find(
          (m) => m.id === apiUser.id,
        );
        if (!queueMember.bumped)
          return reply(
            client,
            user,
            `${apiUser.displayName} is not bumped. (Position #${queueMember.position})`,
          );

        let newParticipant = toggleQueueMemberBump(
          dbQueue.id,
          queueMember.id,
          false,
        );

        reply(client, user, `Un-bumped ${apiUser.displayName}`);
      } catch (e) {
        reply(
          client,
          user,
          `Failed to unbump user. Please try again.`,
          message,
        );
      }
    }

    if (action === "shift") {
      let dbQueue = getQueue();
      if (!dbQueue) return reply(client, user, `There is no current queue.`);

      let queueMembers = getQueueMembers(dbQueue.id);

      if (queueMembers.length <= 0)
        return reply(client, user, `The queue is currently empty.`);

      if (queueMembers.length < dbQueue.membersPerRound)
        return reply(
          client,
          user,
          `There are not enough players in the queue to shift. Use "!gamequeue clear all" to clear the queue. (${queueMembers.length}/${dbQueue.membersPerRound} player${dbQueue.membersPerRound === 1 ? "" : "s"}/round)`,
        );

      try {
        let shifted = shiftQueue(dbQueue.id);
        reply(
          client,
          user,
          `Removed ${dbQueue.membersPerRound} player${dbQueue.membersPerRound === 1 ? "" : "s"} from the queue. `,
        );
      } catch (e) {
        reply(client, user, `Failed to shift the queue. Please try again.`);
      }
    }
  },
};

export default QueueCommand;
