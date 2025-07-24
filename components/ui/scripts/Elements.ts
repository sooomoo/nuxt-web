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
                    continue;
                }

                const height = entry.contentRect.height;
                if (height !== elemSizes.value.get(entry.target)) {
                    map.set(entry.target, height);
                }
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
