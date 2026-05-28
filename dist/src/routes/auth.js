"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoute = void 0;
const express_1 = require("express");
const __1 = require("..");
const axios_1 = require("axios");
const session_1 = require("../models/session");
exports.AuthRoute = (0, express_1.Router)();
exports.AuthRoute.get("/", async (req, res) => {
    if (req.query.code) {
        let params = new URLSearchParams();
        params.append("grant_type", "authorization_code");
        params.append("redirect_uri", `${process.env.APP_URL}/auth`);
        params.append("code", req.query.code);
        params.append("client_id", process.env.CLIENT_ID);
        params.append("client_secret", process.env.CLIENT_SECRET);
        try {
            let tokenRes = await (0, axios_1.post)(`https://id.twitch.tv/oauth2/token`, params);
            if (tokenRes.data) {
                let tokenData = tokenRes.data;
                try {
                    let currentUser = await (0, axios_1.get)(`https://api.twitch.tv/helix/users`, { headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Client-Id": process.env.CLIENT_ID } });
                    if (currentUser.data?.data?.[0]?.id) {
                        let sessionData = {
                            accessToken: tokenData.access_token,
                            refreshToken: tokenData.refresh_token,
                            expiresIn: tokenData.expires_in,
                            obtainmentTimestamp: Date.now(),
                            userId: currentUser.data.data[0].id
                        };
                        let session = await session_1.sessionModel.findOne({ userId: sessionData.userId });
                        if (!session) {
                            try {
                                (await session_1.sessionModel.create(sessionData)).save();
                            }
                            catch (e) {
                                res.send(e);
                            }
                        }
                        else {
                            await (await session_1.sessionModel.findOneAndUpdate({ userId: sessionData.userId }, sessionData)).save();
                        }
                        await __1.authProvider.refreshAccessTokenForUser(sessionData.userId);
                        res.send(sessionData || null);
                    }
                }
                catch (e) {
                    console.log(e);
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    else {
        let scopes = ["user:write:chat", "user:read:chat", "chat:read", "chat:edit", "user:bot", "channel:bot", "moderator:manage:announcements", "moderator:manage:shoutouts", "moderator:read:followers", "moderator:manage:banned_users", "moderator:manage:chat_messages"];
        res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.APP_URL}/auth&scope=${scopes.join(" ")}&response_type=code`);
    }
});
//# sourceMappingURL=auth.js.map