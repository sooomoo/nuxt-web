/* eslint-disable @typescript-eslint/no-explicit-any */
export enum LogLevel {
    /**
     * 未制定日志级别 
     */
    UNSPECIFY = 0,
    /**
     * 打印调试日志及以上
     */
    DEBUG = 1,
    /**
     * 仅信息日志及以上
     */
    INFO = 2,
    /**
     * 仅警告日志及以上
     */
    WARN = 3,
    /**
     * 仅错误日志
     */
    ERROR = 4,
    /**
     * 不打印任何日志
     */
    NONE = 999,
}

const commonStyle = `
    color: white; 
    font-weight:bold;
    font-size:11px;
    line-height: 1;
    padding:4px;  
    border-radius: 2px;
`;

const tagStyle = `color: green;font-weight:bold;font-size:12px;`
const debugStyle = `background-color: gray;${commonStyle}`
const infoStyle = `background-color: #2f75f6;${commonStyle}`
const warnStyle = `background-color: #ff9900;${commonStyle}`
const errorStyle = `background-color: #fc4545;${commonStyle}`

class Logger {
    private _minLevel: LogLevel;
    private _tag?: string;

    constructor(tag?: string, level?: LogLevel) {
        if (level !== undefined && level !== LogLevel.UNSPECIFY) {
            this._minLevel = level;
        } else {
            const env = process.env.NODE_ENV;
            if (env === 'development') {
                this._minLevel = LogLevel.DEBUG;
            } else {
                this._minLevel = LogLevel.WARN;
            }
        }

        this._tag = tag ?? this._tag;
    }

    public level(level: LogLevel): Logger {
        return new Logger(this._tag, level)
    }

    public tag(tag: string): Logger {
        return new Logger(tag, this._minLevel);
    }

    public debug(...args: any[]) {
        if (LogLevel.DEBUG < this._minLevel) {
            return;
        }

        if (this._tag) {
            args.unshift(`%cDEBUG%c %c[${this._tag}]`, debugStyle, "", tagStyle);
        } else {
            args.unshift(`%cDEBUG`, debugStyle);
        }

        const lines = new Error().stack?.split('\n') ?? []
        if (lines.length >= 3) {
            args.push(`\n${lines[2]}`);
        }
        console.log(...args);
    }

    public info(...args: any[]) {
        if (LogLevel.INFO < this._minLevel) {
            return;
        }

        if (this._tag) {
            args.unshift(`%cINFO%c %c[${this._tag}]`, infoStyle, "", tagStyle);
        } else {
            args.unshift(`%cINFO`, infoStyle);
        }

        const lines = new Error().stack?.split('\n') ?? []
        if (lines.length >= 3) {
            args.push(`\n${lines[2]}`);
        }
        console.info(...args);
    }

    public warn(...args: any[]) {
        if (LogLevel.WARN < this._minLevel) {
            return;
        }
        if (this._tag) {
            args.unshift(`%cWARN%c %c[${this._tag}]`, warnStyle, "", tagStyle);
        } else {
            args.unshift(`%cWARN`, warnStyle);
        }

        const lines = new Error().stack?.split('\n') ?? []
        if (lines.length >= 3) {
            args.push(`\n${lines[2]}`);
        }
        console.warn(...args);
    }

    public error(...args: any[]) {
        if (LogLevel.ERROR < this._minLevel) {
            return;
        }

        if (this._tag) {
            args.unshift(`%cERROR%c %c[${this._tag}]`, errorStyle, "", tagStyle);
        } else {
            args.unshift(`%cERROR`, errorStyle);
        }

        const lines = new Error().stack?.split('\n') ?? []
        if (lines.length >= 3) {
            args.push(`\n${lines[2]}`);
        }
        console.error(...args);
    }
}

export const logger = new Logger();