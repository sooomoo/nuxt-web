import { newResizeObserver } from "vuepkg";

const regex = /auto|scroll/;

function style(node: Element, prop: string) {
    return getComputedStyle(node, null).getPropertyValue(prop);
}

function overflow(node: Element) {
    return style(node, "overflow") + style(node, "overflow-y") + style(node, "overflow-x");
}

export function isElementScrollable(node: Element) {
    return regex.test(overflow(node));
}

/**
 * 获取滚动父元素，如果自身可以滚动，则返回自己
 * @param node 目标元素
 * @returns 滚动父元素
 */
export function getScrollParent(node: HTMLElement | null) {
    if (!node) {
        return null;
    }
    let elem: Element | null = node;
    while (elem) {
        if (isElementScrollable(elem)) {
            return elem;
        }
        elem = elem.parentElement;
    }

    elem = elem || document.scrollingElement || document.documentElement;
    // Fix global scroll target for Chrome and Safari
    if (window.document && (elem === window.document.documentElement || elem === window.document.body)) {
        return window;
    }
    return elem;
}

/**
 * 获取滚动父元素信息
 * @param node 目标元素
 * @returns 滚动父元素信息
 */
export const useScrollParent = (node: Ref<HTMLDivElement | null, HTMLDivElement | null>) => {
    const scrollParent = ref<Window | Element | null>(getScrollParent(node.value));

    const scrollTop = ref<number>(0);
    const scrollParentSize = shallowRef<{ width: number; height: number }>({ width: 0, height: 0 });

    // 滚动事件处理（防抖优化）
    let scrollHandling = false;
    const handleScrollParentScroll = () => {
        if (scrollHandling) return;
        scrollHandling = true;
        requestAnimationFrame(() => {
            scrollHandling = false;
            if (!scrollParent.value) {
                return;
            }

            let newVal = 0;
            if (scrollParent.value instanceof Window) {
                newVal = scrollParent.value.scrollY;
            } else {
                newVal = scrollParent.value.scrollTop;
            }
            scrollTop.value = Math.ceil(newVal);
        });
    };

    const handleScrollParentResize = (_: Event) => {
        // logger.debug('handleScrollParentResize', e);
        updateScrollParentSize();
    };

    const isOverflowX = ref(false);

    let schdueling = false;
    const updateScrollParentSize = () => {
        if (schdueling) return;
        schdueling = true;
        requestAnimationFrame(() => {
            schdueling = false;
            if (!scrollParent.value) {
                return;
            }
            if (scrollParent.value instanceof Window) {
                scrollParentSize.value = {
                    width: scrollParent.value.innerWidth,
                    height: scrollParent.value.innerHeight,
                };
                const scrollbarWidth = getScrollBarWidth();
                // logger.debug("scrollbarWidth", scrollbarWidth, scrollParent.value);
                isOverflowX.value = scrollParent.value.document.body.scrollWidth + scrollbarWidth > scrollParent.value.innerWidth;
            } else {
                scrollParentSize.value = {
                    width: scrollParent.value.clientWidth,
                    height: scrollParent.value.clientHeight,
                };
                isOverflowX.value = scrollParent.value.scrollWidth > scrollParent.value.clientWidth;
            }
        });
    };

    const getScrollBarWidth = () => {
        if (!scrollParent.value) {
            return 0;
        }
        // logger.debug('scrollParent.value', toRaw(scrollParent.value));
        if (scrollParent.value instanceof Window) {
            if (!scrollParent.value.visualViewport) {
                return 8;
            }
            return scrollParent.value.innerWidth - scrollParent.value.visualViewport?.width;
        } else if (scrollParent.value instanceof HTMLElement) {
            return scrollParent.value.offsetWidth - scrollParent.value.clientWidth;
        }
        return 0;
    };

    const resizeObs = newResizeObserver((entries) => {
        if (entries.length === 0) return;
        updateScrollParentSize();
    });

    const unobserve = () => {
        if (scrollParent.value) {
            scrollParent.value.removeEventListener("scroll", handleScrollParentScroll);
            scrollParent.value.removeEventListener("resize", handleScrollParentResize);
            if (!(scrollParent.value instanceof Window)) resizeObs.unobserve(scrollParent.value);
        }
        // resizeObs.disconnect();
    };

    const doInit = () => {
        // logger.debug("useScrollParent", scrollParent.value);
        unobserve();
        if (scrollParent.value) {
            if (scrollParent.value instanceof Window) {
                scrollParent.value.addEventListener("scroll", handleScrollParentScroll, { passive: true });
                scrollParent.value.addEventListener("resize", handleScrollParentResize, { passive: true });
            } else {
                scrollParent.value.addEventListener("scroll", handleScrollParentScroll, { passive: true });
                resizeObs.observe(scrollParent.value);
            }
            updateScrollParentSize();
            handleScrollParentScroll();
        }
    };

    watch(node, (newVal) => {
        unobserve();
        // logger.debug("scrollParent.value", scrollParent.value);
        scrollParent.value = getScrollParent(newVal);
        doInit();
    });

    doInit();

    return {
        scrollParent,
        initScrollParent: doInit,
        scrollTop,
        scrollParentSize,
        isOverflowX,
        getScrollBarWidth,
        releaseScrollParent: () => {
            unobserve();
            resizeObs.disconnect();
        },
    };
};
