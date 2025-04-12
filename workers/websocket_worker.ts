/// <reference lib="webworker" />

import { WebSocketClientBase } from "@/utils/websocket_client";
import { type IWebSocketCmd, WebSocketCmdConnect } from "./websocket_cmd";
import { ExponentialRetryStrategy } from "@/utils/retry_strategy";
// import log from "loglevel";

const ports: MessagePort[] = [];
let websocket: WebSocketClient | undefined

const scope = self as unknown as SharedWorkerGlobalScope
if (!scope) {
    throw new Error('scope is not SharedWorkerGlobalScope')
}

scope.onconnect = (e: MessageEvent) => {
    const port = e.ports[0]
    ports.push(port)

    port.onmessage = (e: MessageEvent<IWebSocketCmd>) => {
        console.log(' 收到消息 ', e.data)
        if (e.data.cmd === WebSocketCmdConnect) {
            if (websocket) {
                console.log('websocket 已连接')
                return
            }

            websocket = new WebSocketClient(e.data.data)
        }
        ports.forEach(p => p.postMessage("i've received your message"))
    }
} 

 class WebSocketClient extends WebSocketClientBase {
    // readonly msgProtocol: MessageProtocol
 
    constructor(url: string) {
        super(url, ['niu-v1'], 'arraybuffer', new ExponentialRetryStrategy(1000, 5))
        // this.msgProtocol = msgProtocol
    }

    onData(data: string | ArrayBuffer): void {
        if (typeof data == 'string') {
            console.log('text message: ', data)
        } else if (data instanceof ArrayBuffer) {
            // const [msgType, reqId, payload] = this.msgProtocol.decode(new Uint8Array(data))
            // console.log('binary message: ', msgType, reqId, payload)
        }
    }

    override onHeartbeatTick(): void {
        //this.sendMsg(MsgType.ping, new Uint8Array(0));
    }

    override onConnected(): void {
        console.log('connected')
    }
    override onWillReconnect(durationMs: number): void {
        console.log(`reconnect after ${durationMs}ms`)
    }

    // sendMsg(msgType: MsgType, payload: Uint8Array): RequestId {
    //     // const id = RequestId.next();
    //     // const data = this.msgProtocol.encode(msgType, id, payload);
    //     // this.send(data);
    //     // return id;
    // }
}

 