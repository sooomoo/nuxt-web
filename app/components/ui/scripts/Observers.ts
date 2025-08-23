import { logger, Rect } from "vuepkg";

export class BoundingClientRectObserver {
    prevValue: Rect | null = null;
    callback: (rect: DOMRect) => void;
    prevId?: number;
    cancelled: boolean = false;
    tag?: string;

    constructor(callback: (rect: DOMRect) => void, tag?: string) {
        this.callback = callback;
        this.tag = tag;
    }

    observe(elem: Element) {
        this.unobserveInternal(false);
        this.cancelled = false;
        logger.debug(`${this.tag} observing.....`);

        const iter = (elem: Element) => {
            if (this.cancelled) return;
            const domRect = elem.getBoundingClientRect();
            const curRect = Rect.fromDOMRect(domRect);
            if (!this.prevValue || !this.prevValue.isSameWith(curRect, 0.5)) {
                this.prevValue = curRect;
                // trigger changes
                this.callback(domRect);
            }
            this.prevId = requestAnimationFrame(() => {
                if (this.cancelled) return;
                iter(elem);
            });
        };
        iter(elem);
    }

    unobserve() {
        this.unobserveInternal(true);
    }

    unobserveInternal(log: boolean) {
        this.prevValue = null;
        this.cancelled = true;
        if (this.prevId) {
            cancelAnimationFrame(this.prevId);
        }
        if (log) {
            logger.debug(`${this.tag} unobserved.....`);
        }
    }
}
