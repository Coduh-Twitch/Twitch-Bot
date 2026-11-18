import { apiClient, lastMessageIds, reply } from "..";
import { ChatCommand } from "../classes/Types";
import { clearAmazonQueue, getAmazonQueue } from "../db/amazon";
import { getBotConfig, updateBotConfig } from "../db/botconfig";
import { UserRoles } from "../models/user";
import translate from "translate";
import LanguageDetector from "languagedetect";

const TranslateCommand: ChatCommand = {
  enabled: true,
  userLevel: UserRoles.VIP,
  name: "translate",
  help: "Translate a message to the specified language",
  aliases: [],
  args: [
    {
      name: "to_language",
      description: "The language to translate to",
      required: false
    }
  ],
  run: async (client, user, content, message) => {
    const detector = new LanguageDetector();
    detector.setLanguageType("iso2");
    let args = content.split(" ").map(x => x.trim()).filter(x => x.length > 0);
    let target: string | null = null;
    let language: string | null = args?.[1] || args[0];

    if (message.isReply) {
      target = message.parentMessageText;
    } else if (args.length > 0 && args[0]) {

      const username = args[0].toLowerCase().replaceAll("@", "").trim();
      const apiUser = await apiClient.users.getUserByName(username);
      if (apiUser && lastMessageIds.has(apiUser.id)) {
        let [msgId, msgContent] = lastMessageIds.get(apiUser.id);
        target = msgContent;

      }
      language = args?.[1] || null;
    }

    if (!target) return reply(client, user, `Invalid usage.`);
    if (!language) return reply(client, user, `Invalid usage.`);


    try {
      const detection = detector.detect(target).sort((a, b) => b[1] - a[1]);
      console.log(detection);
      const detectedCode = detection?.[0]?.[0] || "en";
      detector.setLanguageType("full");
      const fullDetection = detector.detect(target).sort((a, b) => b[1] - a[1]);
      const fullDetectionName = fullDetection?.[0]?.[0] || "English";
      const translation = await translate(target, { from: detectedCode, to: language });
      await reply(client, user, `Translated from ${fullDetectionName.replace(fullDetectionName.charAt(0), fullDetectionName.charAt(0).toUpperCase())}: -> "${translation}" [Machine translations may be inaccurate]`, message);
    } catch (e) {
      await reply(client, user, `Translation failed: ${e}`)
    }
  },
};

export default TranslateCommand;
