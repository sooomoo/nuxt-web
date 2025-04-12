
export type WebSocketCmd = String

export interface IWebSocketCmd {
    cmd: WebSocketCmd
    data: any
}



export const WebSocketCmdConnect: WebSocketCmd = "connect"

