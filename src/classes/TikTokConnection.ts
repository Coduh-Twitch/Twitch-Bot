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
  reconnectInterval: NodeJS.Timeout | null;

  constructor(channel: string, apiKey: string | null = null) {
    this.channel = channel;
    this.apiKey = apiKey;
    this.connected = false;
    this.reconnectInterval = null;
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

  async tryConnect() {
    this.live.connect().catch((e) => {
      console.log(`[@${this.channel}] TikTok connection failed. Retrying in 60s`, e);
      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => {
          this.tryConnect();
        }, 60e3);
      }
    });
  }

  connect(): TikTokLiveConnection {

      this.tryConnect().then(() => {
        console.log(`[@${this.channel}] TikTok connection initialized`);
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval)
          this.reconnectInterval = null;
        }
      })

    return this.live;
  }
}
