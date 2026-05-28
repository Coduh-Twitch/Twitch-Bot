import { prefix, reply } from "../index";
import { ChatCommand, UserRolesStringMap } from "../classes/Types";
import { customCommandModel } from "../models/command";
import { randomUUID } from "node:crypto"
import { UserRoles } from "../models/user";

const EditCommandCommand: ChatCommand = {
    enabled: true,
    name: "editcommand",
    aliases: ["editcmd", "changecommand", "ec"],
    help: "Edit a previously created custom command's response",
    userLevel: UserRoles.MOD,
    args: [
        {
            name: "trigger",
            description: "The trigger of the custom command you'd like to edit",
            required: true
        },
        {
            name: "new_response",
            description: "The new response of the edited custom command. -level=UserRoles for permission levels",
            required: true
        }
    ],
    run: async (client, user, content, message) => {
        content = content.trim();
        let cmd = content.split(' ')[0];
        if (!cmd) return reply(client, user, `Please provide a command trigger and response (!editcommand <trigger> <new_response>)`)
        let args = content.replace(cmd, '').trim();
        if (!args) return reply(client, user, `Please provide a command trigger and response (!editcommand <trigger> <new_response>)`)
        console.log(cmd)



        try {
            if (args.startsWith("-level")) {
                args = args.split(" ")[0];
                let userLevel: UserRoles = Number(args.split("=")[1]);
                if (userLevel > UserRoles.DEFAULT) return reply(client, user, `Invalid Permission Level`);

                const customCommand = await customCommandModel.findOneAndUpdate({ trigger: cmd }, { userLevel: UserRolesStringMap[`${userLevel}`] })
                if (!customCommand) return reply(client, user, `Command ${cmd} does not exist`)

                reply(client, user, `Successfully Updated Command ${customCommand.trigger} (level: ${UserRolesStringMap[`${userLevel}`]})`)
            } else {
                const customCommand = await customCommandModel.findOneAndUpdate({ trigger: cmd }, { content: args })
                if (!customCommand) return reply(client, user, `Command ${cmd} does not exist`)

                reply(client, user, `Successfully Updated Command ${customCommand.trigger}`)
            }

        } catch (e) {
            reply(client, user, `Failed while trying to update command. Please try again.`)
        }

    },
}

export default EditCommandCommand;