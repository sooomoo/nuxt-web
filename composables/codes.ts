

export enum RespCode {
    succeed = "succeed",
    invalidArgs = "invalid_args",
    invalidPhone = "invalid_phone",
    invalidMsgCode = "invalid_msg_code",
    invalidSecureCode = "invalid_secure_code",
    fail = "fail",
}


export interface ResponseDto<T> {
    code: string
    msg: string
    data: T
}
