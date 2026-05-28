"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const command_1 = require("../models/command");
const user_1 = require("../models/user");
const MoveCommandCommand = {
    enabled: true,
    name: "movecommand",
    aliases: ["movecmd", "mvcommand", "swapcmd", "swapcommand"],
    help: "Swap a previously created custom command's trigger",
    userLevel: user_1.UserRoles.MOD,
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
        if (!cmd)
            return (0, index_1.reply)(client, user, `Please provide a command trigger and response (!movecmd <trigger> <new_trigger>)`);
        let args = content.replace(cmd, '').trim();
        if (!args)
            return (0, index_1.reply)(client, user, `Please provide a command trigger and response (!movecmd <trigger> <new_trigger>)`);
        console.log(cmd);
        try {
            const customCommand = await command_1.customCommandModel.findOneAndUpdate({ trigger: cmd }, { trigger: args });
            if (!customCommand)
                return (0, index_1.reply)(client, user, `Command ${cmd} does not exist`);
            (0, index_1.reply)(client, user, `Successfully Updated Command ${customCommand.trigger} (new trigger: ${args})`);
        }
        catch (e) {
            (0, index_1.reply)(client, user, `Failed while trying to update command. Please try again.`);
        }
    },
};
exports.default = MoveCommandCommand;
//# sourceMappingURL=MoveCommand.js.map