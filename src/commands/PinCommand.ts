import { ChatCommand } from "../classes/Types";
import { UserRoles } from "../models/user";

const PinCommand: ChatCommand = {
    enabled: true,
    name: "pin",
    help: "Pin a message",
    userLevel: UserRoles.MOD,
    run: async (client, user, content, message) => {
        
    },
}

export default PinCommand;