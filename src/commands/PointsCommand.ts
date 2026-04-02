import { apiClient, prefix, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { customCommandModel } from "../models/command";
import {randomUUID} from "node:crypto"
import { userModel, UserRoles } from "../models/user";

let cooldownMap: Map<string, boolean> = new Map<string, boolean>();

const PointsCommand: ChatCommand = {
    enabled: true,
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

                reply(client, user, `${targetName} has ${points.toLocaleString()} point${points === 1 ? "" : "s"}`, message)
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