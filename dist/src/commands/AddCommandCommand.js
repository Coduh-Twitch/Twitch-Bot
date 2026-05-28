"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const command_1 = require("../models/command");
const node_crypto_1 = require("node:crypto");
const user_1 = require("../models/user");
const AddCommandCommand = {
    enabled: true,
    name: "addcommand",
    aliases: ["addcmd", "ac", "addcommand"],
    help: "Add a custom command trigger and response",
    userLevel: user_1.UserRoles.MOD,
    args: [
        {
            name: "trigger",
            description: "What to type in chat to trigger this command",
            required: true
        },
        {
            name: "response",
            description: "What the bot should respond with when this command is triggered",
            required: true
        }
    ],
    run: async (client, user, content, message) => {
        console.log(content);
        content = content.trim();
        let cmd = content.split(' ')[0];
        if (!cmd)
            return (0, index_1.reply)(client, user, `Please provide a command trigger and response (!addcommand <trigger> <response>)`);
        let args = content.replace(cmd, '').trim();
        if (!args)
            return (0, index_1.reply)(client, user, `Please provide a command trigger and response (!addcommand <trigger> <response>)`);
        try {
            const alreadyExists = await command_1.customCommandModel.findOne({ trigger: cmd });
            if (alreadyExists)
                return (0, index_1.reply)(client, user, `Command "${alreadyExists.trigger}" already exists`);
            const newCustomCommand = new command_1.customCommandModel({
                id: (0, node_crypto_1.randomUUID)(),
                content: args,
                trigger: cmd
            });
            const doc = await newCustomCommand.save();
            (0, index_1.reply)(client, user, `Successfully Added Command ${doc.trigger} -> ${doc.content}`);
        }
        catch (e) {
            (0, index_1.reply)(client, user, `Failed while trying to add command. Please try again.`);
        }
    },
};
exports.default = AddCommandCommand;
//# sourceMappingURL=AddCommandCommand.js.map