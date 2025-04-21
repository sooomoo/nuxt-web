
export type WebSocketCmd = string

export interface IWebSocketCmd<T> {
    cmd: WebSocketCmd
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: T
}

export const WebSocketCmdConnect: WebSocketCmd = "connect"

