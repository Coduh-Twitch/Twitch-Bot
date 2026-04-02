import { prefix, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { customCommandModel } from "../models/command";
import {randomUUID} from "node:crypto"

const DeleteCommandCommand: ChatCommand = {
    enabled: true,
    run: async (client, user, content, message) => {
        content = content.trim();
        let cmd = content.split(' ')[0];
        console.log(cmd)

        try {
            const customCommand = await customCommandModel.findOneAndDelete({trigger: cmd}) 
            if(!customCommand) return reply(client, user, `Command ${cmd} does not exist`)

            reply(client, user, `Successfully Deleted Command ${customCommand.trigger}`)
            
        } catch(e) {
            reply(client, user, `Failed while trying to delete command. Please try again.`)
        }

    },
}

export default DeleteCommandCommand;