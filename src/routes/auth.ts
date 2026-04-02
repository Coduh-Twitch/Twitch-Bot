import { Router } from "express";
import { authProvider, SessionData, TokenResponse } from "..";
import { get, post } from "axios";
import { sessionModel } from "../models/session";

export const AuthRoute = Router();

AuthRoute.get("/", async (req, res) => {
    if (req.query.code) {
        let params = new URLSearchParams();
        params.append("grant_type", "authorization_code")
        params.append("redirect_uri", `${process.env.APP_URL}/auth`)
        params.append("code", req.query.code as string);
        params.append("client_id", process.env.CLIENT_ID)
        params.append("client_secret", process.env.CLIENT_SECRET)

        try {
            let tokenRes = await post(`https://id.twitch.tv/oauth2/token`, params);


            if (tokenRes.data) {
                let tokenData: TokenResponse = tokenRes.data as TokenResponse;
                try {

                    let currentUser: { data: any } = await get(`https://api.twitch.tv/helix/users`, { headers: { "Authorization": `Bearer ${tokenData.access_token}`, "Client-Id": process.env.CLIENT_ID } })


                    if (currentUser.data?.data?.[0]?.id) {
                        let sessionData: SessionData = {
                            accessToken: tokenData.access_token,
                            refreshToken: tokenData.refresh_token,
                            expiresIn: tokenData.expires_in,
                            obtainmentTimestamp: Date.now(),
                            userId: currentUser.data.data[0].id
                        }
                        let session = await sessionModel.findOne({userId: sessionData.userId})
                        if (!session) {
                            try {
                                (await sessionModel.create(sessionData)).save();
                            } catch(e) {
                                res.send(e);
                            }
                        } else {
                            await (await sessionModel.findOneAndUpdate({userId: sessionData.userId}, sessionData)).save()
                        }
                        await authProvider.refreshAccessTokenForUser(sessionData.userId)




                        res.send(sessionData || null)
                    }
                } catch (e) {
                    console.log(e)
                }
            }
        } catch (e) {

            console.log(e)
        }
    } else {
        let scopes = ["user:write:chat", "user:read:chat", "chat:read", "chat:edit", "user:bot", "channel:bot"];

        res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.APP_URL}/auth&scope=${scopes.join(" ")}&response_type=code`)
    }
})