import { prefix, reply } from "..";
import { ChatCommand, UserRolesStringMap } from "../classes/Types";
import { customCommandModel } from "../models/command";
import { randomUUID } from "node:crypto"
import { UserRoles } from "../models/user";

const MoveCommandCommand: ChatCommand = {
    enabled: true,
    name: "movecommand",
    aliases: ["movecmd", "mvcommand", "swapcmd", "swapcommand"],
    help: "Swap a previously created custom command's trigger",
    userLevel: UserRoles.MOD,
    args: [
        {
            name: "trigger",
            description: "The trigger of the custom command you'd like to swap",
            required: true
        },
        {
            name: "new_trigger",
            description: "The new trigger of the edited custom command.",
            required: true
        }
    ],
    run: async (client, user, content, message) => {
        content = content.trim();
        let cmd = content.split(' ')[0];
        if (!cmd) return reply(client, user, `Please provide a command trigger and response (!movecmd <trigger> <new_trigger>)`)
        let args = content.replace(cmd, '').trim();
        if (!args) return reply(client, user, `Please provide a command trigger and response (!movecmd <trigger> <new_trigger>)`)
        console.log(cmd)


        try {

            const customCommand = await customCommandModel.findOneAndUpdate({ trigger: cmd }, { trigger: args })
            if (!customCommand) return reply(client, user, `Command ${cmd} does not exist`)

            reply(client, user, `Successfully Updated Command ${customCommand.trigger} (new trigger: ${args})`)


        } catch (e) {
            reply(client, user, `Failed while trying to update command. Please try again.`)
        }

    },
}

export default MoveCommandCommand;