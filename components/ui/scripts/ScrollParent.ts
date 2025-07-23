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
