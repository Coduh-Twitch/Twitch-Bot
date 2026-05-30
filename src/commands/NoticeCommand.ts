import moment from "moment";
import { reply, sendAndPin, unpinMessage, userHasAuthority } from "..";
import { ChatCommand } from "../classes/Types";
import { getTimer, setTimerLabel, setTimerPaused, setTimerSeconds, setTimerVisibility } from "../db/timer";
import { UserRoles } from "../models/user";
import durationFormat from "moment-duration-format"
import { getNotice, setNoticeLabel, setNoticeVisibility } from "../db/notice";

durationFormat(moment);

const NoticeCommand: ChatCommand = {
    enabled: false,
    name: "notice",
    help: "Set the mod notice on screen",

    args: [
        {
            name: "notice | \"clear\"",
            description: "The mod notice content, \"clear\" to remove and hide the notice",
            required: true
        },
        {
            name: "-pin",
            description: "End your notice with -pin to automatically pin your notice to the chat",
            required: false
        }
    ],
    subCommands: [
        {
            name: "show",
            help: "Show the mod notice on screen",
            userLevel: UserRoles.MOD,
            args: []
        },
        {
            name: "hide",
            help: "Hide the mod notice from the screen",
            userLevel: UserRoles.MOD,
            args: []
        }
    ],
    userLevel: UserRoles.MOD,
    run: async (client, user, content, message) => {
        if(!NoticeCommand.enabled) return reply(client, user, `This command is currently disabled`, message)
        content = content.trim();
        let args = content.split(/ +/);

        console.log("args", args)

        let subcommand = args[0].toLowerCase();
        let subcommandData = NoticeCommand.subCommands.find(sc => sc.name.toLowerCase() === subcommand);
        let authority = userHasAuthority(message.userInfo);
        if (!authority || !subcommand || !subcommandData) {
            if(!authority) return reply(client, user, `You must be a Moderator do to that`, message)
            
            let query = args.join(" ").trim();
            if(!query || query === "") return reply(client, user, `Correct Usage: !${NoticeCommand.name} {notice_content}`, message);
            try {
                let pin = query.toLowerCase().endsWith("-pin");
                if(pin) query = query.substring(0, query.length - "-pin".length);

                setNoticeLabel(query);
                setNoticeVisibility(true);

                reply(client, user, `Showing notice "${query}" for 30 seconds${pin ? "! Pinning the notice..." : "!"}`);
                if(pin) {
                    setTimeout(async () => {
                        await sendAndPin(client, user, `${query}`)
                    },750)
                }

                setTimeout(() => {
                    setNoticeVisibility(false);
                    unpinMessage();
                },30e3);
            }catch(e) {
                reply(client, user, `Failed to set Mod notice`);
            }
        } else if (subcommand && subcommandData) {

            if (subcommand === "show") {
                let notice = getNotice();
                if (notice.visible) return reply(client, user, `The mod notice is already visible!`, message);
                try {
                    setNoticeVisibility(true);
                    reply(client, user, `Showing the mod notice for 30 seconds!`, message)
                    setTimeout(() => {
                        setNoticeVisibility(false);
                        unpinMessage();
                    },30e3);
                } catch (e) {
                    return reply(client, user, `Failed to change mod notice visibility`, message)
                }
            }

            if (subcommand === "hide") {
                let notice = getNotice();
                if (!notice.visible) return reply(client, user, `The mod notice is already hidden!`, message);
                try {
                    setNoticeVisibility(false);
                    reply(client, user, `Hiding the mod notice!`, message)
                } catch (e) {
                    return reply(client, user, `Failed to change mod notice visibility`, message)
                }
            }
        }

    },
}

export default NoticeCommand;