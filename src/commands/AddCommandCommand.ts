import { prefix, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { customCommandModel } from "../models/command";
import {randomUUID} from "node:crypto"

const AddCommandCommand: ChatCommand = {
    enabled: true,
    run: async (client, user, content, message) => {
        
        console.log(content);
        content = content.trim();
        let cmd = content.split(' ')[0];
        if(!cmd) return reply(client, user, `Please provide a command trigger and response (!addcommand <trigger> <response>)`)
        let args = content.replace(cmd, '').trim();
        if(!args) return reply(client, user, `Please provide a command trigger and response (!addcommand <trigger> <response>)`)


        try {
            const alreadyExists = await customCommandModel.findOne({trigger: cmd})
            if(alreadyExists) return reply(client, user, `Command "${alreadyExists.trigger}" already exists`)
            const newCustomCommand = new customCommandModel({
                id: randomUUID(),
                content: args,
                trigger: cmd
            })

            const doc = await newCustomCommand.save();

            reply(client, user, `Successfully Added Command ${doc.trigger} -> ${doc.content}`)
            
        } catch(e) {
            reply(client, user, `Failed while trying to add command. Please try again.`)
        }

    },
}

export default AddCommandCommand;