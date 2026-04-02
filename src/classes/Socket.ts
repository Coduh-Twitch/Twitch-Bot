import { randomUUID, UUID } from "crypto";
import { WebSocket, WebSocketServer, MessageEvent } from "ws";

export interface Packets {
    heartbeat: {},
    ok: {},
    nope: {},
    check: {}
    isActive: {active: boolean}
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

    async initSocket(server: WebSocketServer): Promise<WebSocket> {
        server.on("connection", (socket: WebSocket) => {
            this.socket = socket;

            socket.send(this.createPacket("check", {}))

            socket.onmessage = async (m) => {
                await this.onMessage(m);
            }

            socket.on("close", (code, reason) => {
                this.sockets.delete(this.socketId);
                this.socketId = null;
                clearInterval(this.heartbeat);
            })
        })



        return this.socket;
    }

    async onMessage(m: MessageEvent) {
        console.log("Message received", m.data)

        
        const packet: Packet = JSON.parse(m.data.toString()) as Packet;
        console.log(packet)

        switch(packet.command) {
            case "check": {
                if(!this.socket) throw new Error("Socket was not initialized.");
                this.socketId = randomUUID();
                this.sockets.set(this.socketId, this.socket)
                this.heartbeat = setInterval(() => {
                    this.socket.send(this.createPacket("heartbeat", {}));
                }, 8000)
                this.socket.send(this.createPacket("check", {}));

                break;
            }
            case "isActive": {
                if(!this.socket) throw new Error("Socket was not initialized");
                console.log(packet)
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

        console.log("Initialized Socket Server")
        this.initialized = true;

        return this;
    }
}