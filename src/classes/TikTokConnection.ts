import {
  SignConfig,
  TikTokLiveConnection,
  WebcastChatMessage,
  WebcastEvent,
  WebcastImDeleteMessage,
} from "tiktok-live-connector";

export default class TikTokConnection {
  channel: string;
  connected: boolean;
  apiKey: string | null;
  live: TikTokLiveConnection;

  constructor(channel: string, apiKey: string | null = null) {
    this.channel = channel;
    this.apiKey = apiKey;
    this.connected = false;
    if (this.apiKey !== null) SignConfig.apiKey = this.apiKey;
    this.live = new TikTokLiveConnection(this.channel);
  }

  getLive(): TikTokLiveConnection {
    return this.live;
  }

  async onMessage(
    callback: (message: WebcastChatMessage) => Promise<void> | void,
  ): Promise<void> {
    this.live.on(WebcastEvent.CHAT, async (message) => await callback(message));
  }

  async onMessageDelete(
    callback: (message: WebcastImDeleteMessage) => Promise<void> | void,
  ): Promise<void> {
    this.live.on(
      WebcastEvent.IM_DELETE,
      async (message) => await callback(message),
    );
  }

  connect(): TikTokLiveConnection {
    this.live
      .connect()
      .then(() => {
        console.log(`[@${this.channel}] TikTok connection initialized`);
      })
      .catch((e) => {
        console.log(`TikTok connection failed.`, e);
      });
    return this.live;
  }
}
