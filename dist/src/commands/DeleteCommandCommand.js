"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const command_1 = require("../models/command");
const user_1 = require("../models/user");
const DeleteCommandCommand = {
    enabled: true,
    name: "deletecommand",
    aliases: ["delcmd", "removecommand", "delcommand", "removecommand"],
    help: "Delete a previously created custom command",
    userLevel: user_1.UserRoles.MOD,
    args: [
        {
            name: "trigger",
            description: "The trigger of the custom command you'd like to delete",
            required: true
        }
    ],
    run: async (client, user, content, message) => {
        content = content.trim();
        let cmd = content.split(' ')[0];
        console.log(cmd);
        try {
            const customCommand = await command_1.customCommandModel.findOneAndDelete({ trigger: cmd });
            if (!customCommand)
                return (0, index_1.reply)(client, user, `Command ${cmd} does not exist`);
            (0, index_1.reply)(client, user, `Successfully Deleted Command ${customCommand.trigger}`);
        }
        catch (e) {
            (0, index_1.reply)(client, user, `Failed while trying to delete command. Please try again.`);
        }
    },
};
exports.default = DeleteCommandCommand;
//# sourceMappingURL=DeleteCommandCommand.js.map