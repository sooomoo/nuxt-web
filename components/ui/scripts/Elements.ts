/* eslint-disable indent */
import { logger } from "vuepkg";

export class FallbackResizeObserver implements ResizeObserver {
    disconnect(): void {
        logger.debug("disconnect");
    }
    observe(target: Element, options?: ResizeObserverOptions): void {
        logger.debug("observe", target, options);
    }
    unobserve(target: Element): void {
        logger.debug("unobserve", target);
    }
}

export const newResizeObserver = (callback: ResizeObserverCallback): ResizeObserver => {
    if (typeof ResizeObserver === "undefined") {
        return new FallbackResizeObserver();
    } else {
        return new ResizeObserver(callback);
    }
};

export class FallbackMutationObserver implements MutationObserver {
    disconnect(): void {
        logger.debug("disconnect");
    }
    observe(target: Element, options?: MutationObserverInit): void {
        logger.debug("observe", target, options);
    }
    takeRecords(): MutationRecord[] {
        return [];
    }
}

export const newMutationObserver = (callback: MutationCallback): MutationObserver => {
    if (typeof MutationObserver === "undefined") {
        return new FallbackMutationObserver();
    } else {
        return new MutationObserver(callback);
    }
};

export const useElementSizes = (...nodes: Ref<HTMLDivElement | null, HTMLDivElement | null>[]) => {
    const elemSizes = shallowRef<Map<HTMLDivElement, number>>(new Map());
    const elemSizeArray = shallowRef<number[]>(nodes.map(() => 0));

    const resizeObserver = newResizeObserver((entries) => {
        const sizeArr: number[] = [];
        const map = new Map<HTMLDivElement, number>();
        for (let index = 0; index < entries.length; index++) {
            const entry = entries[index];
            if (!(entry.target instanceof HTMLDivElement)) {
                sizeArr.push(0);
                continue;
            }

            const height = entry.contentRect.height;
            map.set(entry.target, height);
            sizeArr.push(height);
        }
        elemSizeArray.value = sizeArr;
        elemSizes.value = map;
    });

    const doInit = () => {
        for (const element of nodes) {
            if (!element.value) continue;
            resizeObserver.observe(element.value);
        }
    };

    const elemRelease = () => {
        for (const element of nodes) {
            if (!element.value) continue;
            resizeObserver.unobserve(element.value);
        }
        resizeObserver.disconnect();
    };

    watch(
        nodes,
        (n, old) => {
            for (const element of old) {
                if (!element) continue;
                resizeObserver.unobserve(element);
            }
            doInit();
        },
        { deep: true },
    );
    doInit();

    return {
        elemSizes,
        elemSizeArray,
        elemRelease,
    };
};

export interface Padding {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export const newPaddingFromString = (padding: string): Padding => {
    const segs = padding
        .trim()
        .split(" ")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    if (segs.length === 1) {
        const val = parseFloat(segs[0].replace("px", ""));
        return {
            top: val,
            right: val,
            bottom: val,
            left: val,
        };
    }
    if (segs.length === 2) {
        const ver = parseFloat(segs[0].replace("px", ""));
        const hor = parseFloat(segs[1].replace("px", ""));
        return {
            top: ver,
            right: hor,
            bottom: ver,
            left: hor,
        };
    }
    if (segs.length === 3) {
        const ver = parseFloat(segs[0].replace("px", ""));
        const hor = parseFloat(segs[1].replace("px", ""));
        return {
            top: ver,
            right: hor,
            bottom: parseFloat(segs[2].replace("px", "")),
            left: hor,
        };
    }
    if (segs.length === 4) {
        return {
            top: parseFloat(segs[0].replace("px", "")),
            right: parseFloat(segs[1].replace("px", "")),
            bottom: parseFloat(segs[2].replace("px", "")),
            left: parseFloat(segs[3].replace("px", "")),
        };
    }
    return zeroPadding();
};

export interface Gap {
    row: number;
    column: number;
}

export const newGapFromString = (gap: string): Gap => {
    const segs = gap
        .trim()
        .split(" ")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    if (segs.length === 1) {
        const val = parseFloat(segs[0].replace("px", ""));
        return { row: val, column: val };
    }
    if (segs.length === 2) {
        return {
            row: parseFloat(segs[0].replace("px", "")),
            column: parseFloat(segs[1].replace("px", "")),
        };
    }
    return { row: 0, column: 0 };
};

export const zeroPadding = (): Padding => ({ left: 0, top: 0, right: 0, bottom: 0 });

export const useElementStyle = (...elements: Ref<HTMLDivElement | null, HTMLDivElement | null>[]) => {
    const elemPaddingArray = ref<Padding[]>(elements.map(() => zeroPadding()));

    const getElementPadding = (element: Element): Padding => {
        if (!element) {
            return zeroPadding();
        }
        const parsePX = (px: string) => {
            const val = parseFloat(px.replace("px", ""));
            return isNaN(val) ? 0 : val;
        };
        const style = getComputedStyle(element);
        return {
            top: parsePX(style.paddingTop),
            bottom: parsePX(style.paddingBottom),
            right: parsePX(style.paddingRight),
            left: parsePX(style.paddingLeft),
        };
    };

    const obs = newMutationObserver((entries) => {
        for (let index = 0; index < entries.length; index++) {
            const element = entries[index];
            if (!element.target || !(element.target instanceof Element)) {
                elemPaddingArray.value[index] = zeroPadding();
                continue;
            }
            elemPaddingArray.value[index] = getElementPadding(element.target);
        }
    });

    const doInit = () => {
        for (let index = 0; index < elements.length; index++) {
            const element = elements[index];
            if (!element.value) {
                elemPaddingArray.value[index] = zeroPadding();
                continue;
            }
            elemPaddingArray.value[index] = getElementPadding(element.value);
            obs.observe(element.value, {
                // attributes: true,
                attributeFilter: ["padding", "padding-top", "padding-bottom", "padding-left", "padding-right"],
            });
        }
    };

    watch(elements, () => {
        doInit();
    });

    doInit();

    return {
        elemPaddingArray,
        elemRelease: () => {
            obs.disconnect();
        },
    };
};
