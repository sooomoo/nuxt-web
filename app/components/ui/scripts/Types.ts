import type { Anchor } from "./Enums";

export class Rect {
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;

    static empty(): Rect {
        return new Rect(0, 0, 0, 0);
    }

    static fromDOMRect = (rect: DOMRect): Rect => {
        return new Rect(rect.x, rect.y, rect.width, rect.height);
    };

    constructor(x: number, y: number, width: number, height: number) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.width = Math.floor(width);
        this.height = Math.floor(height);
    }

    public get isEmpty(): boolean {
        return this.width === 0 && this.height === 0;
    }
    public get right(): number {
        return this.x + this.width;
    }
    public get bottom(): number {
        return this.y + this.height;
    }

    public isSameWith(rect: Rect, threshold: number = 1): boolean {
        const deltaX = Math.abs(this.x - rect.x);
        const deltaY = Math.abs(this.y - rect.y);
        const deltaWidth = Math.abs(this.width - rect.width);
        const deltaHeight = Math.abs(this.height - rect.height);
        return deltaX <= threshold && deltaY <= threshold && deltaWidth <= threshold && deltaHeight <= threshold;
    }

    /**
     * 从四周缩小指定值
     */
    public shrink(delta: number) {
        return new Rect(this.x + delta, this.y + delta, this.width - delta * 2, this.height - delta * 2);
    }
    public expand(delta: number) {
        return new Rect(this.x - delta, this.y - delta, this.width + delta * 2, this.height + delta * 2);
    }

    /**
     * 当目标矩形以当前矩形为锚定时，计算目标矩形锚定后的位置
     * @param anchor 锚点
     * @param targetRect 目标矩形
     * @returns 目标矩形锚定后的位置
     */
    public anchorOutside(anchor: Anchor, targetRect: Rect): Rect {
        switch (anchor) {
            case "topLeft":
                return new Rect(this.x, this.y - targetRect.height, targetRect.width, targetRect.height);
            case "topCenter":
                return new Rect(this.x + (this.width - targetRect.width) / 2, this.y - targetRect.height, this.width, this.height);
            case "topRight":
                return new Rect(this.right - targetRect.width, this.y - targetRect.height, this.width, this.height);
            case "rightTop":
                return new Rect(this.right, this.y, targetRect.width, this.height);
            case "rightCenter":
                return new Rect(this.right, this.y + (this.height - targetRect.height) / 2, this.width, this.height);
            case "rightBottom":
                return new Rect(this.right, this.bottom - targetRect.height, this.width, targetRect.height);
            case "bottomLeft":
                return new Rect(this.x, this.bottom, targetRect.width, this.height);
            case "bottomCenter":
                return new Rect(this.x + (this.width - targetRect.width) / 2, this.bottom, this.width, this.height);
            case "bottomRight":
                return new Rect(this.right - targetRect.width, this.bottom, this.width, this.height);
            case "leftTop":
                return new Rect(this.x - targetRect.width, this.y, targetRect.width, this.height);
            case "leftCenter":
                return new Rect(this.x - targetRect.width, this.y + (this.height - targetRect.height) / 2, targetRect.width, this.height);
            case "leftBottom":
                return new Rect(this.x - targetRect.width, this.bottom - targetRect.height, targetRect.width, this.height);
        }
    }
}
