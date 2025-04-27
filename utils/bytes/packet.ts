import type { Signer, Crypter } from "@/utils/security"
import type { Marshaler } from "./marshaler"

export interface PacketMetaData {
    msgType: number     // 1字节
    requestId: number   // 4字节
    timestamp: number   // 4字节，从2025-01-01 00:00:00开始的秒数 
}

export interface ResponsePacketMetaData extends PacketMetaData {
    code: number        // 1字节
}

export interface ResponsePacket<T> extends ResponsePacketMetaData {
    payload: T
}

export class PacketProtocol {
    readonly protocolStartTime = 1735660800  // 2025-01-01 00:00:00 的unix时间戳：单位为秒
    readonly metaLength = 9
    readonly responseMetaLength = 10
    private _marshaler: Marshaler
    private _signer?: Signer
    private _crypter?: Crypter

    constructor(marsher: Marshaler, signer?: Signer, crypter?: Crypter) {
        this._marshaler = marsher
        this._signer = signer
        this._crypter = crypter
    }

    /**
     * 获取消息的元数据
     * @param data 消息内容
     * @returns [消息类型, 时间戳, 序号]
     * @throws Error: data length is too short
     */
    getMeta(data: Uint8Array): PacketMetaData {
        if (data.length < this.metaLength) {
            throw new Error("data length is too short")
        }
        const requestId = data[1] << 24 | data[2] << 16 | data[3] << 8 | data[4]
        const ts = data[5] << 24 | data[6] << 16 | data[7] << 8 | data[8]
        return {
            msgType: data[0],
            requestId: requestId,
            timestamp: ts,
        }
    }

    /**
     * 获取响应消息的元数据
     * @param data 消息内容
     * @returns [消息类型, 时间戳, 序号]
     * @throws Error: data length is too short
     */
    getResponseMeta(data: Uint8Array): ResponsePacketMetaData {
        if (data.length < this.responseMetaLength) {
            throw new Error(`response data length is too short: ${data.length}/${this.responseMetaLength}`)
        }
        const requestId = data[1] << 24 | data[2] << 16 | data[3] << 8 | data[4]
        const ts = data[5] << 24 | data[6] << 16 | data[7] << 8 | data[8]
        return {
            msgType: data[0],
            requestId: requestId,
            timestamp: ts,
            code: data[this.responseMetaLength - 1],
        }
    }

    /**
     * 打包请求，便于通过WebSocket发送
     * @param msgType 消息类型 1字节
     * @param requestId 消息序号 4字节
     * @param payload 业务内容
     * @returns 返回打包后的消息
     */
    encodeReq<T = unknown>(msgType: number, requestId: number, payload?: T): Uint8Array {
        const reqIdBuf = [requestId >> 24 & 0x00FF, requestId >> 16 & 0x00FF, requestId >> 8 & 0x00FF, requestId & 0x00FF]
        const ts = unixNow() - this.protocolStartTime
        const tsBuf = [ts >> 24 & 0x00FF, ts >> 16 & 0x00FF, ts >> 8 & 0x00FF, ts & 0x00FF]
        const outArr = [msgType, ...reqIdBuf, ...tsBuf]
        let body = payload ? this._marshaler.marshal<T>(payload) : undefined
        if (body) {
            if (this._crypter) {
                body = this._crypter.encrypt(body)
            }
            outArr.push(...body)
        }
        if (this._signer) {
            const dataToSign = new Uint8Array(outArr)
            const sign = this._signer.sign(dataToSign)
            // 签名放最后面
            outArr.push(...sign)
        }

        return new Uint8Array(outArr)
    }

    /**
     * 解码收到的消息
     * @param data 收到的消息内容
     * @returns 返回消息类型，序列号，业务内容
     */
    decodeResp<T = unknown>(data: Uint8Array): ResponsePacket<T> {
        const meta = this.getResponseMeta(data)
        let body = data.slice(this.responseMetaLength)
        if (this._signer) {
            // 签名在最后面
            const signStart = data.length - this._signer.signatureLen()
            const dataToSign = data.slice(0, signStart)
            const sign = data.slice(signStart)
            body = data.slice(this.responseMetaLength, signStart)
            if (!this._signer.verify(dataToSign, sign)) {
                throw new Error("sign verify failed")
            }
        }
        if (this._crypter) {
            body = this._crypter.decrypt(body)
        }
        const payload = this._marshaler.unmarshal<T>(body)
        return {
            ...meta,
            payload: payload
        }
    }
}


