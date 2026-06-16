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

const VenueCommand: ChatCommand = {
  enabled: true,
  name: "venue",
  help: "Get information about the venue of the current sports event being tracked",
  aliases: ["stadium", "field"],
  userLevel: UserRoles.DEFAULT,
  run: async (client, user, content, message) => {
    if (ESPN.venue) {
      await reply(
        client,
        user,
        `${ESPN.homeTeam} v ${ESPN.awayTeam} @ ${ESPN.venue.fullName} (${ESPN.venue.address.city}${ESPN.venue.address.state && !ESPN.venue.address.city.includes(ESPN.venue.address.state) ? `, ${ESPN.venue.address.state}` : ""}${ESPN.venue.address.country ? `, ${ESPN.venue.address.country}` : ""})`,
        message,
      );
    } else {
      await reply(client, user, `No competitions are being tracked`);
    }
  },
};

export default VenueCommand;
