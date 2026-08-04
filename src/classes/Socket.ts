import { randomUUID, UUID } from "crypto";
import { WebSocket, WebSocketServer, MessageEvent } from "ws";
import { ChatPacket, ChatPacketSource } from "./Types";
import { ChatMessage } from "@twurple/chat";
import { WebcastChatMessage } from "tiktok-live-connector";

export interface Packets {
  heartbeat: {};
  ok: {};
  nope: {};
  check: {};
  isActive: { active: boolean };
  chat: ChatPacket;
  chatclear: {};
  deleteMessage: { id: string };
}

export type Packet = {
  command: keyof Packets;
  data: any;
  id: number;
};

export default class Socket {
  port: number;
  socket: WebSocket;
  server: WebSocketServer;
  heartbeat: NodeJS.Timeout;
  socketId: UUID;
  sockets: Map<string, WebSocket>;
  initialized: boolean;

  constructor(port: number) {
    this.port = port;
    this.sockets = new Map<string, WebSocket>();
    this.initialized = false;
  }

  createPacket<T extends keyof Packets>(command: T, data: Packets[T]) {
    return JSON.stringify({ command, data, id: 0 });
  }

  transformTwitchChatPacket(message: ChatMessage): ChatPacket {
    let user = message.userInfo;

    console.log(user.badges);

    let badges: Record<string, string> = {};

    for (const badge of user.badges.entries()) {
      badges[badge[0]] = badge[1];
    }

    let emojis: Record<string, string> = {};
    if (message.emoteOffsets.size > 0) {
      message.emoteOffsets.forEach((v, k) => {
        const emoji_url = `https://static-cdn.jtvnw.net/emoticons/v2/${k}/default/dark/1.0`;
        // emojis[v.join("")] = emoji_url;
        v.forEach((range) => {
          emojis[range] = emoji_url;
        });
      });
    }

    let chatPacket: ChatPacket = {
      source: ChatPacketSource.TWITCH,
      content: message.text,
      channelId: message.channelId,
      date: message.date,
      emoteOffsets: emojis,
      messageId: message.id,

      twitchData: {
        bits: message.bits,
        isCheer: message.isCheer,
        isFirst: message.isFirst,
        isHighlighted: message.isHighlight,
        isHypeChat: message.isHypeChat,
        isRedemption: message.isRedemption,
        isReply: message.isReply,
        isReturningChatter: message.isReturningChatter,
        threadMessageUserId: message.threadMessageUserId,
        hypeChatAmount: message.hypeChatAmount || null,
        hypeChatCurrency: message.hypeChatCurrency || null,
        hypeChatIsSystemMessage: message.hypeChatIsSystemMessage || null,
        hypeChatLevel: message.hypeChatLevel || null,
        hypeChatLocalizedAmount: message.hypeChatLocalizedAmount || null,

        parentMessageId: message.parentMessageId || null,
        parentMessageText: message.parentMessageText || null,
        parentMessageUserDisplayName:
          message.parentMessageUserDisplayName || null,
        parentMessageUserId: message.parentMessageUserId || null,
        parentMessageUserName: message.parentMessageUserName || null,

        rewardId: message.rewardId || null,
        threadMessageId: message.threadMessageId || null,
      },

      userInfo: {
        display_name: user.displayName,
        isMod: user.isMod,
        userId: user.userId,
        login: user.userName,
        color: user.color,
        twitchData: {
          type: (user.userType as any) || "default",
          badgeInfo: badges,
          badges: badges,
          isArtist: user.isArtist,
          isBroadcaster: user.isBroadcaster,
          isFounder: user.isFounder,
          isLeadMod: user.isLeadMod,
          isSubscriber: user.isSubscriber,
          isVip: user.isVip,
        },
      },
    };

    return chatPacket;
  }

  transformTikTokChatPacket(message: WebcastChatMessage): ChatPacket {
    let user = message.user;

    let emojis: Record<string, string> = {};
    if (message.emotes.length > 0) {
      message.emotes.forEach((emote) => {
        const emoji_url = `${emote.emote.image.imageUrl}`;
        // emojis[v.join("")] = emoji_url;
        for (var i = 0; i <= emote.placeInComment; i++) {
          emojis[i] = emoji_url;
        }
      });
    }

    let chatPacket: ChatPacket = {
      source: ChatPacketSource.TIKTOK,
      content: message.comment,
      channelId: message.common.roomId,
      date: new Date(),
      emoteOffsets: emojis,
      messageId: randomUUID(),

      userInfo: {
        display_name: user.nickname,
        isMod: message.userIdentity.isModeratorOfAnchor,
        userId: user.userId,
        login: user.uniqueId,
        color: "#F7004D",
      },
    };

    return chatPacket;
  }

  async initSocket(server: WebSocketServer): Promise<WebSocket> {
    server.on("connection", (socket: WebSocket) => {
      this.socket = socket;

      socket.send(this.createPacket("check", {}));

      socket.onmessage = async (m) => {
        await this.onMessage(m);
      };

      socket.on("close", (code, reason) => {
        this.sockets.delete(this.socketId);
        this.socketId = null;
        clearInterval(this.heartbeat);
      });
    });

    return this.socket;
  }

  sendMessage<T extends keyof Packets>(command: T, data: Packets[T]) {
    if (this.socket) this.socket.send(this.createPacket(command, data));
    console.log(`Sent packet ${command}`, data);
  }

  async onMessage(m: MessageEvent) {
    console.log("Message received", m.data);

    const packet: Packet = JSON.parse(m.data.toString()) as Packet;
    console.log(packet);

    switch (packet.command) {
      case "check": {
        if (!this.socket) throw new Error("Socket was not initialized.");
        this.socketId = randomUUID();
        this.sockets.set(this.socketId, this.socket);
        this.heartbeat = setInterval(() => {
          this.socket.send(this.createPacket("heartbeat", {}));
        }, 8000);
        this.socket.send(this.createPacket("check", {}));

        break;
      }
      case "isActive": {
        if (!this.socket) throw new Error("Socket was not initialized");
        console.log(packet);
      }
    }
  }

  async initServer(): Promise<WebSocketServer> {
    const server = new WebSocket.Server({ port: this.port });

    this.server = server;
    return this.server;
  }

  async initServerAndSocket() {
    const server = await this.initServer();
    await this.initSocket(server);

    console.log("Initialized Socket Server");
    this.initialized = true;

    return this;
  }
}
