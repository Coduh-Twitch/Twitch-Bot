import { randomUUID, UUID } from "crypto";
import { WebSocket, WebSocketServer, MessageEvent } from "ws";
import { ChatPacket, ChatPacketSource } from "./Types";
import { ChatMessage } from "@twurple/chat";
import { WebcastChatMessage } from "tiktok-live-connector";
import { word_game } from "../db/schema";
import { endWordGame, getWordGame } from "../db/wordgame";
import { get } from "axios";
import { WordGame } from "./WordGame";

export interface Packets {
  heartbeat: {};
  ok: {};
  nope: {};
  check: { id?: string; agent?: string };
  isActive: { active: boolean };
  chat: ChatPacket;
  chatclear: {};
  deleteMessage: { id: string };
  wordGameHint: { game: typeof word_game.$inferInsert };
  wordGameState: { game: typeof word_game.$inferInsert };
  wordGameEnded: {
    game: typeof word_game.$inferInsert;
    winner_total_guesses: number;
  };
  wordGameConnection: { binId: string };
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
  gameSockets: Map<string, WebSocket>;
  initialized: boolean;
  wordgame: WordGame | null;

  constructor(port: number) {
    this.heartbeat = null;
    this.port = port;
    this.sockets = new Map<string, WebSocket>();
    this.gameSockets = new Map<string, WebSocket>();
    this.initialized = false;
    this.wordgame = null;
  }

  getSockets(): Map<string, WebSocket> {
    return this.sockets;
  }

  getWordGame(): WordGame | null {
    return this.wordgame;
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

  async initSocket(server: WebSocketServer): Promise<void> {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => {
      this.broadcastMessage("heartbeat", {} as any);
    }, 8000);

    server.on("connection", (socket: WebSocket) => {
      let localSocketId: string | null = null;

      socket.send(this.createPacket("check", {}));

      socket.on("message", async (data) => {
        const packet: Packet = JSON.parse(data.toString()) as Packet;

        switch (packet.command) {
          case "check": {
            localSocketId = packet.data?.id || crypto.randomUUID();
            if (packet.data.agent)
              console.log(
                `SOCKET ID ${localSocketId} AGENT "${packet.data.agent}"`,
              );
            this.sockets.set(localSocketId, socket);
            socket.send(this.createPacket("check", {}));
            break;
          }
          case "wordGameConnection": {
            let game = getWordGame();
            if (game && !this.wordgame) {
              this.wordgame = new WordGame(null, () => {}, game);
            }
            if (!game) {
              const text =
                (await get(`https://pastebin.com/raw/${packet.data.binId}`))
                  ?.data || "fucked";
              const words = text
                .trim()
                .split(",")
                .map((s: string) => s.trim());
              const random = Math.floor(Math.random() * words.length);
              const word = words[random] || words[random + 1] || words[0];

              const wordgame = new WordGame(
                word,
                this.broadcastMessage.bind(this),
                null,
              );
              await wordgame.startGame();
              this.wordgame = wordgame;
              this.broadcastMessage("wordGameState", {
                game: wordgame.getGame(),
              });
            } else {
              this.broadcastMessage("wordGameState", { game: game });
            }
            break;
          }
          case "isActive": {
            break;
          }
        }
      });

      socket.on("close", () => {
        if (localSocketId) {
          this.sockets.delete(localSocketId);
        }
      });
    });
  }

  sendMessage<T extends keyof Packets>(command: T, data: Packets[T]) {
    for (const [id, socket] of this.sockets.entries()) {
      if (socket && socket.readyState === 1) {
        try {
          socket.send(this.createPacket(command, data));
        } catch (e) {
          console.error(`Failed to send packet to socket ${id}`);
        }
      } else if (
        socket &&
        (socket.readyState === 2 || socket.readyState === 3)
      ) {
        this.sockets.delete(id);
      }
    }
  }

  broadcastMessage<T extends keyof Packets>(command: T, data: Packets[T]) {
    for (const [id, socket] of this.sockets.entries()) {
      if (socket && socket.readyState === 1) {
        try {
          socket.send(this.createPacket(command, data));
        } catch (e) {
          console.error(`Failed to send packet to socket ${id}`);
        }
      } else if (
        socket &&
        (socket.readyState === 2 || socket.readyState === 3)
      ) {
        this.sockets.delete(id);
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
