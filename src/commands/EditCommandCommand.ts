import { prefix, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { customCommandModel } from "../models/command";
import {randomUUID} from "node:crypto"
import { UserRoles } from "../models/user";

const EditCommandCommand: ChatCommand = {
    enabled: true,
    name: "editcommand",
    aliases: ["editcmd", "changecommand"],
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
            description: "The new response of the edited custom command",
            required: true
        }
    ],
    run: async (client, user, content, message) => {
        content = content.trim();
        let cmd = content.split(' ')[0];
        if(!cmd) return reply(client, user, `Please provide a command trigger and response (!editcommand <trigger> <new_response>)`)
        let args = content.replace(cmd, '').trim();
        if(!args) return reply(client, user, `Please provide a command trigger and response (!editcommand <trigger> <new_response>)`)
        console.log(cmd)

        try {
            const customCommand = await customCommandModel.findOneAndUpdate({trigger: cmd}, {content: args}) 
            if(!customCommand) return reply(client, user, `Command ${cmd} does not exist`)

            reply(client, user, `Successfully Updated Command ${customCommand.trigger}`)
            
        } catch(e) {
            reply(client, user, `Failed while trying to delete command. Please try again.`)
        }

    },
}

export default EditCommandCommand;