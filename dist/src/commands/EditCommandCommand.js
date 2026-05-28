"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const Types_1 = require("../classes/Types");
const command_1 = require("../models/command");
const user_1 = require("../models/user");
const EditCommandCommand = {
    enabled: true,
    name: "editcommand",
    aliases: ["editcmd", "changecommand", "ec"],
    help: "Edit a previously created custom command's response",
    userLevel: user_1.UserRoles.MOD,
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
        if (!cmd)
            return (0, index_1.reply)(client, user, `Please provide a command trigger and response (!editcommand <trigger> <new_response>)`);
        let args = content.replace(cmd, '').trim();
        if (!args)
            return (0, index_1.reply)(client, user, `Please provide a command trigger and response (!editcommand <trigger> <new_response>)`);
        console.log(cmd);
        try {
            if (args.startsWith("-level")) {
                args = args.split(" ")[0];
                let userLevel = Number(args.split("=")[1]);
                if (userLevel > user_1.UserRoles.DEFAULT)
                    return (0, index_1.reply)(client, user, `Invalid Permission Level`);
                const customCommand = await command_1.customCommandModel.findOneAndUpdate({ trigger: cmd }, { userLevel: Types_1.UserRolesStringMap[`${userLevel}`] });
                if (!customCommand)
                    return (0, index_1.reply)(client, user, `Command ${cmd} does not exist`);
                (0, index_1.reply)(client, user, `Successfully Updated Command ${customCommand.trigger} (level: ${Types_1.UserRolesStringMap[`${userLevel}`]})`);
            }
            else {
                const customCommand = await command_1.customCommandModel.findOneAndUpdate({ trigger: cmd }, { content: args });
                if (!customCommand)
                    return (0, index_1.reply)(client, user, `Command ${cmd} does not exist`);
                (0, index_1.reply)(client, user, `Successfully Updated Command ${customCommand.trigger}`);
            }
        }
        catch (e) {
            (0, index_1.reply)(client, user, `Failed while trying to update command. Please try again.`);
        }
    },
};
exports.default = EditCommandCommand;
//# sourceMappingURL=EditCommandCommand.js.map