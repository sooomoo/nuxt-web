import { logger } from "vuepkg";

const regex = /auto|scroll/;

function style(node: Element, prop: string) {
    return getComputedStyle(node, null).getPropertyValue(prop);
}

function overflow(node: Element) {
    return style(node, "overflow") + style(node, "overflow-y") + style(node, "overflow-x");
}

function scroll(node: Element) {
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
        if (scroll(elem)) {
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
            if (scrollParent.value instanceof Window) {
                scrollTop.value = scrollParent.value.scrollY;
            } else {
                scrollTop.value = scrollParent.value.scrollTop;
            }
        });
    };

    const handleScrollParentResize = (_: Event) => {
        updateScrollParentSize();
    };

    const updateScrollParentSize = () => {
        if (!scrollParent.value) {
            return;
        }
        if (scrollParent.value instanceof Window) {
            scrollParentSize.value = {
                width: scrollParent.value.innerWidth,
                height: scrollParent.value.innerHeight,
            };
        } else {
            scrollParentSize.value = {
                width: scrollParent.value.clientWidth,
                height: scrollParent.value.clientHeight,
            };
        }
    };

    const releaseScrollParent = () => {
        if (scrollParent.value) {
            scrollParent.value.removeEventListener("scroll", handleScrollParentScroll);
            scrollParent.value.removeEventListener("resize", handleScrollParentResize);
        }
    };

    const doInit = () => {
        logger.debug("useScrollParent", scrollParent.value);
        releaseScrollParent();
        if (scrollParent.value) {
            scrollParent.value.addEventListener("scroll", handleScrollParentScroll, { passive: true });
            scrollParent.value.addEventListener("resize", handleScrollParentResize, { passive: true });
            updateScrollParentSize();
            handleScrollParentScroll();
        }
    };

    watch(node, (newVal) => {
        logger.debug("scrollParent.value", scrollParent.value);
        scrollParent.value = getScrollParent(newVal);
        doInit();
    });

    doInit();

    return {
        scrollParent,
        scrollTop,
        scrollParentSize,
        releaseScrollParent,
    };
};
