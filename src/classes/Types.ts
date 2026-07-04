import { ChatClient, ChatMessage } from "@twurple/chat";
import { UserRoles } from "../models/user";

export enum TTSVoices {
  CHRISTOPHER = "en-US-ChristopherNeural",
  ARIA = "en-US-AriaNeural",
  GUY = "en-US-GuyNeural",
  BRIAN = "en-US-BrianNeural",
  ERIC = "en-US-EricNeural",
  ROGER = "en-US-RogerNeural",
  CHRISTOPHER_MULTILINGUAL = "en-US-ChristopherMultilingualNeural",
}

export interface TTSQueueItem {
  content: string;
  voice: TTSVoices;
  sentById: string;
  sentByUsername: string;
  sentAt: number;
  bits: number;
  isTos: boolean;
}

export interface SearchedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  href: string;
  uri: string;
  imageUrl: string;
}

export interface ChatCommandHelpArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface ChatSubCommand {
  name: string;
  args: ChatCommandHelpArgument[];
  help: string;
  userLevel: UserRoles;
}

export interface ChatCommand {
  enabled: boolean;
  name: string;
  help: string;
  userLevel: UserRoles;
  aliases?: string[];
  subCommands?: ChatSubCommand[];
  args?: ChatCommandHelpArgument[];
  run: (
    client: ChatClient,
    user: string,
    content: string,
    message: ChatMessage,
  ) => void;
}

export const UserRolesStringMap: Record<string, string> = {
  [`${UserRoles.DEFAULT}`]: "Viewer",
  [`${UserRoles.VIP}`]: "VIP",
  [`${UserRoles.MOD}`]: "Moderator",
  [`${UserRoles.LEAD_MOD}`]: "Lead Moderator",
  [`${UserRoles.BROADCASTER}`]: "Broadcaster",
};

export enum TwitchBroadcasterTypes {
  AFFILIATE = "affiliate",
  PARTNER = "partner",
  DEFAULT = "",
}
export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: TwitchBroadcasterTypes;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  created_at: string;
  view_count?: number;
}

// Packets

export enum ChatPacketSource {
  TIKTOK,
  TWITCH,
  DISCORD,
}

export interface ChatPacket {
  source: ChatPacketSource;
  content: string;
  date: Date;
  messageId: string;
  channelId: string;
  emoteOffsets: Record<string, string>;

  twitchData?: {
    isHighlighted: boolean;
    isFirst: boolean;
    isCheer: boolean;
    isRedemption: boolean;
    isHypeChat: boolean;
    isReply: boolean;
    isReturningChatter: boolean;

    bits: number;

    hypeChatAmount?: number | null;
    hypeChatCurrency?: string | null;
    hypeChatIsSystemMessage?: boolean | null;
    hypeChatLevel?: number | null;
    hypeChatLocalizedAmount?: number | null;

    parentMessageId?: string | null;
    parentMessageText?: string | null;
    parentMessageUserDisplayName?: string | null;
    parentMessageUserId?: string | null;
    parentMessageUserName?: string | null;

    rewardId?: string | null;
    threadMessageId?: string | null;
    threadMessageUserId: string | null;
  };

  userInfo: {
    display_name: string;
    login: string;
    isMod: boolean;
    userId: string;
    color: string | null;

    twitchData?: {
      type: "mod" | "global_mod" | "admin" | "staff" | "default";
      badgeInfo: Record<string, string>;
      badges: Record<string, string>;

      isArtist: boolean;
      isLeadMod: boolean;
      isBroadcaster: boolean;
      isFounder: boolean;
      isSubscriber: boolean;
      isVip: boolean;
    };
  };
}
