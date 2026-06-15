import { get, post } from "axios";
import {
  apiClient,
  broadcasterApiClient,
  ESPN,
  reply,
  SOCIAL_LINKS,
} from "../index";
import { ChatCommand } from "../classes/Types";
import { UserRoles } from "../models/user";
import { sessionModel } from "../models/session";
import { DBSession } from "../db/schema";

const ScoreCommand: ChatCommand = {
  enabled: true,
  name: "score",
  help: "Get the score of the current sports event being tracked",
  aliases: ["scores"],
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    if (ESPN.competition) {
      await reply(client, user, `${ESPN.getScoreString()}`, message);
    } else {
      await reply(client, user, `No competitions are being tracked`);
    }
  },
};

export default ScoreCommand;
