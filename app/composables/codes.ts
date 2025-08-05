export enum RespCode {
    succeed = "succeed",
    invalidArgs = "invalidArgs",
    invalidPhone = "invalidPhone",
    invalidMsgCode = "invalidMsgCode",
    invalidSecureCode = "invalidSecureCode",
    fail = "fail",
}

export interface ResponseDto<T> {
    code: string;
    msg: string;
    data: T;
}
