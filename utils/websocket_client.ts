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
    private openTimes: number = 0

    connect() {
        this.openTimes = 0
        try {
            this.socket = new WebSocket(this.url, this.protocols)
            this.socket.binaryType = this.binaryType
            this.socket.onopen = () => {
                this.openTimes += 1
                this.onConnectedInternal()
            }
            this.socket.onerror = (error) => this.onError(error)
            this.socket.onclose = (ev) => {
                this.log.debug('onclose', ev)
                if (this.openTimes === 0){
                    this.log.debug('onclose, 连接从未打开过，不触发重连' )
                    return
                }
                if ([1000,1001,1002,1003].includes(ev.code)) {
                    this.closeNormally = true;
                    this.onClosed();
                } else {
                    this.reconnect()
                }
            };

            this.socket.onmessage = (evt: MessageEvent) => this.onData(evt.data);
        } catch (error) {
            this.log.error('connect error: ', error) 
        }
    }

    private closeNormally?: boolean
    private reconnectTimer?: NodeJS.Timeout
    private reconnect() {
        if (this.closeNormally === true || this.reconnectStrategy === undefined) return; 
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
        this.openTimes = 0
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
        this.log.debug(`closeByClient`)
    }


    public get readyState(): number | undefined {
        return this.socket?.readyState;
    }


    private readonly bufferData: Array<string | ArrayBufferLike> = []
    send(data: string | ArrayBufferLike) {
        if (this.readyState === WebSocket.OPEN) {
            this.socket?.send(data)
        } else {
            this.bufferData.push(data)
        }
    }
}