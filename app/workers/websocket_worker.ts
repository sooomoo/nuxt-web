/// <reference lib="webworker" />

import { type DeadReason, ExponentialRetryStrategy, logger, msgPackMarshaler, PacketProtocol, WebSocketClientBase } from "vuepkg";
import { isConnectCmd, type IWebSocketCmd, WebSocketCmdClose, type WebSocketConnectCmdData, WebSocketMsgType } from "./websocket_cmd";

const ports: MessagePort[] = [];
let websocket: WebSocketClient | undefined;

const wlogger = logger.tag("WebSocketWorker");
if (import.meta.client) {
    const scope = self as unknown as SharedWorkerGlobalScope;
    if (!scope) {
        throw new Error("scope is not SharedWorkerGlobalScope");
    }

    scope.onconnect = (e: MessageEvent) => {
        const port = e.ports[0];
        if (!port) return;

        ports.push(port);

        port.onmessage = (e: MessageEvent<IWebSocketCmd<unknown>>) => {
            wlogger.debug(" 收到消息 ", e.data);
            if (isConnectCmd(e.data)) {
                if (websocket) {
                    wlogger.debug("websocket 已连接");
                    return;
                }
                websocket = new WebSocketClient(e.data.data);
                websocket.onDead = (reason) => {
                    websocket = undefined;
                    wlogger.debug("websocket 连接彻底关闭，原因:", reason);
                };
                websocket.connect();
            } else if (e.data.cmd === WebSocketCmdClose) {
                const ws = websocket;
                websocket = undefined;
                ws?.close();
            }
        };
    };
}

const notifyPorts = (data: unknown) => {
    wlogger.debug("通知所有端口: ", data);
    for (const port of ports) {
        try {
            port.postMessage(data);
        } catch (error) {
            wlogger.error("通知端口失败: ", error);
            // 如果端口发送失败，可能是因为端口已经关闭，可以从 ports 中移除该端口
            const index = ports.indexOf(port);
            if (index !== -1) {
                ports.splice(index, 1);
            }
        }
    }
};
export class WebSocketClient extends WebSocketClientBase {
    private readonly protocal: PacketProtocol;
    private requestId = 0;
    private readonly clog = logger.tag("WebSocketClient");

    onDeadCallback?: (reason: DeadReason) => void;

    constructor(data: WebSocketConnectCmdData) {
        super(data.url, data.subprotocol, "arraybuffer", new ExponentialRetryStrategy(1000, data.maxRetryAttempts), data.heartbeatInterval);
        this.protocal = new PacketProtocol(msgPackMarshaler);
    }

    onData(data: string | ArrayBuffer): void {
        if (typeof data == "string") {
            this.clog.debug("text message: ", data);
        } else if (data instanceof ArrayBuffer) {
            const dataArr = new Uint8Array(data);
            // const { msgType, requestId, timestamp, code } = this.protocal.getResponseMeta(dataArr);
            // this.clog.debug("[META] recv message: ", msgType, requestId, timestamp, code);
            // if (msgType == WebSocketMsgType.pong) {
            //     this.clog.debug("pong message");
            // }
            notifyPorts({
                type: "websocket_message",
                data: dataArr,
            });
        }
    }

    override onHeartbeatTick(): void {
        this.sendMsg(WebSocketMsgType.ping);
    }

    override onConnected(): void {
        this.clog.debug("connected");
    }

    override onWillReconnect(durationMs: number): void {
        this.clog.debug(`reconnect after ${durationMs}ms`);
    }

    override onError(error: Event): void {
        this.clog.debug("error", error);
    }

    override onDead(reason: DeadReason): void {
        this.clog.debug("onDead, reason: ", reason);
        this.onDeadCallback?.(reason);
    }

    sendMsg<T>(msgType: WebSocketMsgType, payload?: T): number {
        this.requestId = (this.requestId + 1) % 0xffffffff;
        // const packet = this.protocal.encodeReq<T>(msgType, this.requestId, payload);
        // this.clog.debug("send message: ", msgType, this.requestId, payload, packet, this.readyState);
        // this.send(packet.buffer);
        const te = new TextEncoder().encode(`{"type": "message", "data": "hello world", "id": "${Date.now()}"`)
        this.send(te.buffer)
        return this.requestId;
    }
}
