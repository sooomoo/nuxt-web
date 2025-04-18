
export type WebSocketCmd = string

export interface IWebSocketCmd {
    cmd: WebSocketCmd
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
}



export const WebSocketCmdConnect: WebSocketCmd = "connect"

