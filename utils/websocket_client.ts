import type { RetryStrategy } from "./retry_strategy"

export abstract class WebSocketClientBase {
    readonly url: string
    readonly protocols?: string[]
    readonly binaryType: BinaryType
    readonly reconnectStrategy?: RetryStrategy
    readonly heartbeatIntervalMs: number
    private readonly log = logger.tag('WebSocketClientBase')

    constructor(url: string, protocols?: string[], binaryType: BinaryType = 'arraybuffer', reconnectStrategy?: RetryStrategy, heartbeatMs: number = 5000) {
        this.url = url
        this.protocols = protocols
        this.binaryType = binaryType
        this.reconnectStrategy = reconnectStrategy
        this.heartbeatIntervalMs = heartbeatMs
    }

    private socket?: WebSocket
    private connected: boolean = false

    connect() {
        this.connected = false
        this.socket = new WebSocket("ws://localhost:8080/stats?id=20001", ["proto-v2"])
        this.socket.binaryType = this.binaryType
        this.socket.onopen = () => {
            this.connected = true
            this.onConnectedInternal()
        }
        this.socket.onerror = (error) => this.onError(error)
        this.socket.onclose = (ev) => {
            if (ev.code === 1000) {
                this.closeNormally = true;
                this.onClosed();
            } else {
                this.reconnect()
            }
        };

        this.socket.onmessage = (evt: MessageEvent) => this.onData(evt.data);
    }

    private closeNormally?: boolean
    private reconnectTimer?: NodeJS.Timeout
    private reconnect() {
        if (this.closeNormally === true || this.reconnectStrategy === undefined) return;
        this.connected = false;
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = undefined

        const dur = this.reconnectStrategy.next()
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = setTimeout(() => this.connect(), dur);
        this.onWillReconnect(dur)
    }

    private heartbeatTimer?: NodeJS.Timeout
    private onConnectedInternal() {
        this.reconnectStrategy?.reset()
        // start heartbeat
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = setInterval(() => this.onHeartbeatTick(), this.heartbeatIntervalMs);

        const tmp = [...this.bufferData]
        tmp.forEach(val => this.socket?.send(val))
        this.onConnected()
    }
    onConnected() { }
    onHeartbeatTick() { }
    onError(error: Event) {
        console.error('WebSocket 错误:', error);
    }
    abstract onData(data: string | ArrayBuffer): void;
    private onClosed() {
        this.connected = false
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = undefined
        clearInterval(this.heartbeatTimer)
        this.heartbeatTimer = undefined
        this.reconnectStrategy?.reset()
        this.log.debug('close normally')
        this.onDispose()
    }
    onDispose() { }
    onWillReconnect(durationMs: number) {
        this.log.debug(`reconnect after ${durationMs}ms`)
    }

    close() {
        this.closeNormally = true;
        this.socket?.close(1000, "closeByClient")
    }

    private readonly bufferData: Array<string | ArrayBufferLike> = []
    send(data: string | ArrayBufferLike) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket?.send(data)
        } else {
            this.bufferData.push(data)
        }
    }
}