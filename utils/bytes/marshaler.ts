
import * as msgpack from "@msgpack/msgpack";

export interface Marshaler {
    marshal<T = unknown>(obj: T): Uint8Array;
    unmarshal<T = unknown>(data: Uint8Array): T;
}

class JsonMarshaler implements Marshaler {
    marshal<T = unknown>(obj: T): Uint8Array {
        const json = JSON.stringify(obj);
        return new TextEncoder().encode(json);
    }
    unmarshal<T = unknown>(data: Uint8Array): T {
        const json = new TextDecoder().decode(data);
        return JSON.parse(json) as T;
    }
}

class MsgPackMarshaler implements Marshaler {
    marshal<T = unknown>(obj: T): Uint8Array {
        return msgpack.encode(obj);
    }
    unmarshal<T = unknown>(data: Uint8Array): T {
        return msgpack.decode(data) as T;
    }
}

export const jsonMarshaler = new JsonMarshaler();
export const msgPackMarshaler = new MsgPackMarshaler();