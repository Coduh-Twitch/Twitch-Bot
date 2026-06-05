import { prefix, reply } from "../index";
import { ChatCommand } from "../classes/Types";
import { customCommandModel } from "../models/command";
import { randomUUID } from "node:crypto";
import { UserRoles } from "../models/user";

const DeleteCommandCommand: ChatCommand = {
  enabled: true,
  name: "deletecommand",
  aliases: ["delcmd", "removecommand", "delcommand", "delcom"],
  help: "Delete a previously created custom command",
  userLevel: UserRoles.MOD,
  args: [
    {
      name: "trigger",
      description: "The trigger of the custom command you'd like to delete",
      required: true,
    },
  ],
  run: async (client, user, content, message) => {
    content = content.trim();
    let cmd = content.split(" ")[0];
    console.log(cmd);

    try {
      const customCommand = await customCommandModel.findOneAndDelete({
        trigger: cmd,
      });
      if (!customCommand)
        return reply(client, user, `Command ${cmd} does not exist`);

      reply(
        client,
        user,
        `Successfully Deleted Command ${customCommand.trigger}`,
      );
    } catch (e) {
      reply(
        client,
        user,
        `Failed while trying to delete command. Please try again.`,
      );
    }
  },
};

export default DeleteCommandCommand;
