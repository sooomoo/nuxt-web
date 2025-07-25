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

export const useElementSizes = (...nodes: Ref<HTMLDivElement | null, HTMLDivElement | null>[]) => {
    const elemSizes = shallowRef<Map<HTMLDivElement, number>>(new Map());
    const elemSizeArray = shallowRef<number[]>(nodes.map(() => 0));

    let resizeObserver: ResizeObserver;
    if (typeof ResizeObserver === "undefined") {
        resizeObserver = new FallbackResizeObserver();
    } else {
        resizeObserver = new ResizeObserver((entries) => {
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
    }

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

    let obs: MutationObserver;
    if (typeof MutationObserver === "undefined") {
        obs = new FallbackMutationObserver();
    } else {
        obs = new MutationObserver((entries) => {
            for (let index = 0; index < entries.length; index++) {
                const element = entries[index];
                if (!element.target || !(element.target instanceof Element)) {
                    elemPaddingArray.value[index] = zeroPadding();
                    continue;
                }
                elemPaddingArray.value[index] = getElementPadding(element.target);
            }
        });
    }

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
