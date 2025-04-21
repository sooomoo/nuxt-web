/// <reference lib="webworker" />

import { WebSocketClientBase } from "@/utils/websocket_client";
import { type IWebSocketCmd, WebSocketCmdConnect } from "./websocket_cmd";
import { ExponentialRetryStrategy } from "@/utils/retry_strategy";

if (import.meta.client) { 
    const ports: MessagePort[] = [];
    let websocket: WebSocketClient | undefined

    const scope = self as unknown as SharedWorkerGlobalScope
    if (!scope) {
        throw new Error('scope is not SharedWorkerGlobalScope')
    }

    scope.onconnect = (e: MessageEvent) => {
        const port = e.ports[0]
        ports.push(port)

        port.onmessage = (e: MessageEvent<IWebSocketCmd<any>>) => {
            logger.tag('WebSocketWorker').debug(' 收到消息 ', e.data)
            if (e.data.cmd === WebSocketCmdConnect) {
                if (websocket) {
                    logger.tag('WebSocketWorker').debug('websocket 已连接')
                    return
                }
                const url = e.data.data as string
                websocket = new WebSocketClient(url)
                websocket.connect()
            }
            ports.forEach(p => p.postMessage("i've received your message"))
        }
    }
}

export class WebSocketClient extends WebSocketClientBase {
    constructor(url: string) {
        super(url, ['niu-v1'], 'arraybuffer', new ExponentialRetryStrategy(1000, 5))
    }

    onData(data: string | ArrayBuffer): void {
        if (typeof data == 'string') {
            logger.tag('WebSocketClient').debug('text message: ', data)
        } else if (data instanceof ArrayBuffer) {
            // const [msgType, reqId, payload] = this.msgProtocol.decode(new Uint8Array(data))
            // logger.tag('WebSocketClient').debug('binary message: ', msgType, reqId, payload)
        }
    }

    override onHeartbeatTick(): void {
        //this.sendMsg(MsgType.ping, new Uint8Array(0));
    }

    override onConnected(): void {
        logger.tag('WebSocketClient').debug('connected')
    }
    override onWillReconnect(durationMs: number): void {
        logger.tag('WebSocketClient').debug(`reconnect after ${durationMs}ms`)
    }
    override onError(error: Event): void {
        logger.tag('WebSocketClient').debug('error', error)
    }

    // sendMsg(msgType: MsgType, payload: Uint8Array): RequestId {
    //     // const id = RequestId.next();
    //     // const data = this.msgProtocol.encode(msgType, id, payload);
    //     // this.send(data);
    //     // return id;
    // }
}

