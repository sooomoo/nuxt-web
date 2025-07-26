import { logger } from "vuepkg";

export interface VisibleRange {
    bufferStart: number;
    visibleStart: number;
    visibleEnd: number;
    bufferEnd: number;
}

export interface RenderVisibleRange extends VisibleRange {
    startOffset: number;
}

export const zeroRenderVisibleRange = () => ({
    bufferStart: 0,
    visibleStart: 0,
    visibleEnd: 0,
    bufferEnd: 0,
    startOffset: 0,
});

export const isRenderVisibleRangeSame = (a: RenderVisibleRange, b: RenderVisibleRange) => {
    const isStartOffsetSame = Math.abs(a.startOffset - b.startOffset) < 1;
    return (
        a.bufferStart === b.bufferStart &&
        a.visibleStart === b.visibleStart &&
        a.visibleEnd === b.visibleEnd &&
        a.bufferEnd === b.bufferEnd &&
        isStartOffsetSame
    );
};

export class VirtualScrollController {
    scrollToIndex(index: number, behavior?: ScrollBehavior) {
        logger.debug("scrollToIndex", index, behavior);
    }

    scrollToBottom(behavior?: ScrollBehavior) {
        logger.debug("scrollToBottom", behavior);
    }

    scrollToTop(behavior?: ScrollBehavior) {
        logger.debug("scrollToBottom", behavior);
    }
}
