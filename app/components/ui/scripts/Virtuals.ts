export interface VisibleRange {
    bufferStart: number;
    visibleStart: number;
    visibleStartRelativeOffset: number;
    visibleEnd: number;
    visibleEndRelativeOffset: number;
    bufferEnd: number;
}

export interface RenderVisibleRange extends VisibleRange {
    startOffset: number;
}

export const zeroRenderVisibleRange = () => ({
    bufferStart: 0,
    visibleStart: 0,
    visibleStartRelativeOffset: 0,
    visibleEndRelativeOffset: 0,
    visibleEnd: 0,
    bufferEnd: 0,
    startOffset: 0,
});

export const isRenderVisibleRangeSame = (a: RenderVisibleRange, b: RenderVisibleRange) => {
    const isStartOffsetSame = Math.abs(a.startOffset - b.startOffset) < 1;
    const isVisibleStartRelativeOffsetSame = Math.abs(a.visibleStartRelativeOffset - b.visibleStartRelativeOffset) < 1;
    const isVisibleEndRelativeOffsetSame = Math.abs(a.visibleEndRelativeOffset - b.visibleEndRelativeOffset) < 1;
    return (
        a.bufferStart === b.bufferStart &&
        a.visibleStart === b.visibleStart &&
        a.visibleEnd === b.visibleEnd &&
        a.bufferEnd === b.bufferEnd &&
        isStartOffsetSame &&
        isVisibleStartRelativeOffsetSame &&
        isVisibleEndRelativeOffsetSame
    );
};

export interface VirtualScrollerExpose {
    scrollToTop: (behavior?: ScrollBehavior) => void;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
    scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
}

export interface VirtualTreeScrollerExpose {
    scrollToTop: (behavior?: ScrollBehavior) => void;
    scrollToBottom: (behavior?: ScrollBehavior) => void;
    scrollToIndex: (index: number, behavior?: ScrollBehavior) => void;
    scrollToItem: (key: string, behavior?: ScrollBehavior) => void;
}

export interface TableSpan<T> {
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
    item: T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}
