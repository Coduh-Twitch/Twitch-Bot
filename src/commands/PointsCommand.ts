import { apiClient, prefix, reply } from "../index";
import { ChatCommand } from "../classes/Types";
import { customCommandModel } from "../models/command";
import {randomUUID} from "node:crypto"
import { userModel, UserRoles } from "../models/user";

let cooldownMap: Map<string, boolean> = new Map<string, boolean>();

const PointsCommand: ChatCommand = {
    enabled: true,
    name: "points",
    aliases: ["pts"],
    help: "Manage or view points",
    subCommands: [
        {
            name: "add",
            help: "Add points to a user",
            userLevel: UserRoles.MOD,
            args: [
                {
                    name: "username",
                    description: "The username of the user who you'd like to add points to",
                    required: true
                },
                {
                    name: "amount",
                    description: "The amount of points to add to the user's balance",
                    required: true
                }
            ]
        },
        {
            name: "remove",
            help: "Remove points from a user",
            userLevel: UserRoles.MOD,
            args: [
                {
                    name: "username",
                    description: "The username of the user who you'd like to remove points from",
                    required: true
                },
                {
                    name: "amount",
                    description: "The amount of points to remove from the user's balance",
                    required: true
                }
            ]
        },
        {
            name: "set",
            help: "Set a user's point balance",
            userLevel: UserRoles.MOD,
            args: [
                {
                    name: "username",
                    description: "The username of the user who's points you'd like to set",
                    required: true
                },
                {
                    name: "amount",
                    description: "The amount of points to set the user's balance to",
                    required: true
                }
            ]
        }
    ],
    args: [
        {
            name: "username",
            description: "The username of the user who's points you'd like to view. Exclude this to view your own points.",
            required: false
        }
    ],
    userLevel: UserRoles.DEFAULT,
    run: async (client, user, content, message) => {
        if(cooldownMap.has(message.userInfo.userId)) {
            if(cooldownMap.get(message.userInfo.userId)) {
                cooldownMap.set(message.userInfo.userId, false);
                // return reply(client, user, `Woah there! You need to wait a moment before rolling again. Don't want you getting a gamblin' addiction!`, message);
                return;
            }
            return;
        } else {
            cooldownMap.set(message.userInfo.userId, true);
        }

        let addActions = ["add", "give"]
        let removeActions = ["remove", "take"]
        let setActions = ["set"]

        let actions = [...addActions, ...removeActions, ...setActions];

        content = content.trim();
        let args = content.split(' ');
        let action = args[0];

        if(!action) action = message.userInfo.userName.toLowerCase();
        

        let dbUser = await userModel.findOne({twitchId: message.userInfo.userId});
        let points = dbUser ? dbUser.points : 0;
        let targetName = message.userInfo.userName;

        console.log(action)

        try {
            if(action && actions.includes(action)) {

                if(!message.userInfo.isMod && !message.userInfo.isBroadcaster) return reply(client, user, `You must be Moderator or higher to do that.`, message)

                // action
                if(addActions.includes(action)) {
                    let target = args[1];
                    if(!target) return reply(client, user, `Please provide a target and amount of points (!pts ${action} <username> <points>)`);
                    let points = parseInt(args[2]);
                    if(!points || Number.isNaN(points) || points <= 0) return reply(client, user, `Please provide a target and amount of points (!pts ${action} ${target} <points>)`);

                    let apiUser = await apiClient.users.getUserByName(target.toLowerCase().replace("@", "").trim());
                    if(!apiUser) return reply(client, user, `Couldn't find user "${target}"`, message);

                    let dbTarget = await userModel.findOne({twitchId: apiUser.id});
                    let oldPoints = dbTarget ? dbTarget.points || 0 : 0
                    if(!dbTarget) {
                        dbTarget = await userModel.create({twitchId: apiUser.id, discordId: null, points: points, role: UserRoles.DEFAULT})
                    } else {
                        dbTarget = await userModel.findOneAndUpdate({twitchId: apiUser.id}, {points: dbTarget.points + points});
                    }

                    reply(client, user, `Added ${points.toLocaleString()} point${points === 1 ? "" : "s"} to @${apiUser.name}! Their new balance is ${(oldPoints + points).toLocaleString()}`, message)
                }

                if(removeActions.includes(action)) {
                    let target = args[1];
                    if(!target) return reply(client, user, `Please provide a target and amount of points (!pts ${action} <username> <points>)`);
                    let points = parseInt(args[2]);
                    if(!points || Number.isNaN(points) || points <= 0) return reply(client, user, `Please provide a target and amount of points (!pts ${action} ${target} <points>)`);

                    let apiUser = await apiClient.users.getUserByName(target.toLowerCase().replace("@", "").trim());
                    if(!apiUser) return reply(client, user, `Couldn't find user "${target}"`, message);

                    let dbTarget = await userModel.findOne({twitchId: apiUser.id});
                    let oldPoints = dbTarget ? dbTarget.points || 0 : 0

                    if((oldPoints - points) < 0) return reply(client, user, `User's balance may not go below 0`);

                    if(!dbTarget) {
                        // dbTarget = await userModel.create({twitchId: apiUser.id, discordId: null, points: points, role: UserRoles.DEFAULT})
                        return reply(client, user, `User's balance may not go below 0`);
                    } else {
                        dbTarget = await userModel.findOneAndUpdate({twitchId: apiUser.id}, {points: dbTarget.points - points});
                    }

                    reply(client, user, `Removed ${points.toLocaleString()} point${points === 1 ? "" : "s"} from @${apiUser.name}. Their new balance is ${(oldPoints - points).toLocaleString()}`, message)
                }

                if(setActions.includes(action)) {
                    let target = args[1];
                    if(!target) return reply(client, user, `Please provide a target and amount of points (!pts ${action} <username> <points>)`);
                    let points = parseInt(args[2]);
                    if(!points || Number.isNaN(points) || points <= 0) return reply(client, user, `Please provide a target and amount of points (!pts ${action} ${target} <points>)`);

                    let apiUser = await apiClient.users.getUserByName(target.toLowerCase().replace("@", "").trim());
                    if(!apiUser) return reply(client, user, `Couldn't find user "${target}"`, message);

                    let dbTarget = await userModel.findOne({twitchId: apiUser.id});
                    let oldPoints = dbTarget ? dbTarget.points || 0 : 0

                    // if((oldPoints - points) < 0) return reply(client, user, `User's balance may not go below 0`);

                    if(!dbTarget) {
                        dbTarget = await userModel.create({twitchId: apiUser.id, discordId: null, points: points, role: UserRoles.DEFAULT})
                        // return reply(client, user, `User's balance may not go below 0`);
                    } else {
                        dbTarget = await userModel.findOneAndUpdate({twitchId: apiUser.id}, {points: points});
                    }

                    reply(client, user, `Set @${apiUser.name}'s point balance to ${points.toLocaleString()} point${points === 1 ? "" : "s"}.`, message)
                }
            } else {
                // user?
                let apiUser = await apiClient.users.getUserByName(action.toLowerCase().replace("@", "").trim());
                if(!apiUser) return reply(client, user, `Couldn't find user "${action}"`, message);

                let dbTarget = await userModel.findOne({twitchId: apiUser.id});
                points = dbTarget ? dbTarget.points : 0;
                targetName = apiUser.name;

                let allUsers = (await userModel.find({points: {$gt: 0}})).sort((a,b) => b.points - a.points);
                let theUser = allUsers.find(u => u.twitchId === dbTarget.twitchId);
                let position = allUsers.indexOf(theUser) + 1;

                reply(client, user, `${targetName} has ${points.toLocaleString()} point${points === 1 ? "" : "s"} and is rank ${position}/${allUsers.length} on the leaderboard!`, message)
            }



            setTimeout(() => {
                if(cooldownMap.has(message.userInfo.userId)) cooldownMap.delete(message.userInfo.userId)
            },3e3)


            
        } catch(e) {
            reply(client, user, `Failed to complete action. Please try again`)
            if(cooldownMap.has(message.userInfo.userId)) cooldownMap.delete(message.userInfo.userId)
        }

    },
}

export default PointsCommand;