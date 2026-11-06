import { apiClient, isLeadMod, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { addAutoShoutoutCandidate, removeAutoShoutoutCandidate } from "../db/autoshoutouts";
import { UserRoles } from "../models/user";

const AutoShoutoutCommand: ChatCommand = {
  enabled: true,
  name: "autoshoutout",
  help: "Manage chatters who automatically receive a shoutout upon chatting",
  userLevel: UserRoles.LEAD_MOD,
  aliases: ["autoso", "aso", "ashoutout", "autoshout"],
  args: [
    {
      name: "add|remove",
      description: "Add or remove a user from the auto-shoutout list",
      required: true
    },{
      name: "user",
      description: "The user to add or remove from the auto-shoutout list",
      required: true
    }
  ],
  run: async (client, user, content, message) => {
    if (!isLeadMod(message.userInfo)) return reply(client, user, `You must be Lead Moderator or higher to do that.`);
    let actions = ["add", "remove"];

    content = content.trim();
    let args = content.split(" ");
    let action = args[0];

    if (!actions.includes(action)) return reply(client, user, `Correct usage: !autoshoutout {add|remove} {user}`);
    if (!args?.[1]) return reply(client, user, `Correct usage: !autoshoutout ${action} {user}`);

    let username = args[1].trim().replaceAll("@", "");

    let apiUser = await apiClient.users.getUserByName(username);
    if (!apiUser) return reply(client, user, `Could not find user "${username}"`);

    switch (action) {
      case "add": {
        try {
          addAutoShoutoutCandidate(apiUser.id);
          return reply(client, user, `Added @${apiUser.displayName} to the auto-shoutout list! Next time they chat, they will receive a shoutout.`)
        } catch (e) {
          reply(client, user, `Failed to add @${apiUser.displayName} to the auto-shoutout list. Try again?`)
        }
        break;
      }
      case "remove": {
        try {
          removeAutoShoutoutCandidate(apiUser.id);
          return reply(client, user, `Removed @${apiUser.displayName} from the auto-shoutout list.`)
        } catch (e) {
          reply(client, user, `Failed to remove @${apiUser.displayName} from the auto-shoutout list. Try again?`)
        }
        break;
      }
    }
  },
}

export default AutoShoutoutCommand;
