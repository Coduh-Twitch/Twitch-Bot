"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const ws_1 = require("ws");
class Socket {
    constructor(port) {
        this.port = port;
        this.sockets = new Map();
        this.initialized = false;
    }
    createPacket(command, data) {
        return JSON.stringify({ command, data, id: 0 });
    }
    async initSocket(server) {
        server.on("connection", (socket) => {
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
    async onMessage(m) {
        console.log("Message received", m.data);
        const packet = JSON.parse(m.data.toString());
        console.log(packet);
        switch (packet.command) {
            case "check": {
                if (!this.socket)
                    throw new Error("Socket was not initialized.");
                this.socketId = (0, crypto_1.randomUUID)();
                this.sockets.set(this.socketId, this.socket);
                this.heartbeat = setInterval(() => {
                    this.socket.send(this.createPacket("heartbeat", {}));
                }, 8000);
                this.socket.send(this.createPacket("check", {}));
                break;
            }
            case "isActive": {
                if (!this.socket)
                    throw new Error("Socket was not initialized");
                console.log(packet);
            }
        }
    }
    async initServer() {
        const server = new ws_1.WebSocket.Server({ port: this.port });
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
exports.default = Socket;
//# sourceMappingURL=Socket.js.map