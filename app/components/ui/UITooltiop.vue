<script setup lang="ts">
import { computed, type CSSProperties, ref, watch } from 'vue';
import { type Anchor, Rect } from 'vuepkg';
import { BoundingClientRectObserver } from './scripts/Observers';

const props = defineProps<{
    tooltip?: string;
    anchor?: Anchor;
    contentStyle?: CSSProperties;
    contentClass?: string;
}>();

const showTooltip = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const rootRect = ref<Rect | null>(null);

const finalAnchor = computed(() => {
    return props.anchor || "bottomCenter";
});

const convertPx = (val: string) => {
    if (!val || val.trim().length === 0) return undefined
    val = val.trim()
    const res = parseInt(val.replaceAll('px', '')) || Number.NaN;
    return isNaN(res) ? undefined : res;
};

const tooltipStyle = computed(() => {
    if (!rootRect.value || !tooltipRef.value) return {};
    const width = convertPx(props.contentStyle?.width?.toString() ?? '');
    const tooltipClientBounds = Rect.fromDOMRect(tooltipRef.value.getBoundingClientRect())
    if (width && width > 0) {
        tooltipClientBounds.x = tooltipClientBounds.x + (tooltipClientBounds.width - width) / 2;
        tooltipClientBounds.width = width;
    }
    const tooltipRect = rootRect.value.anchorOutside(finalAnchor.value, tooltipClientBounds);
    return {
        ...props.contentStyle,
        left: tooltipRect.x + "px",
        top: tooltipRect.y + "px",
    } as CSSProperties;
});

watch(showTooltip, (val) => {
    if (val) {
        if (rootRef.value) boundingRectObserver.observe(rootRef.value);
    } else {
        boundingRectObserver.unobserve();
    }
});

const boundingRectObserver = new BoundingClientRectObserver((rect) => {
    rootRect.value = Rect.fromDOMRect(rect);
}, "UITooltiop");

let timer: number
const onMouseEnter = (_: MouseEvent) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
        showTooltip.value = true; 
    }, 500);
};

const onMouseLeave = (_: MouseEvent) => {
    showTooltip.value = false;
    if (timer) clearTimeout(timer)
};
</script>

<template>
    <div ref="rootRef" class="ui-tooltip" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
        <slot></slot>
        <Teleport to="#teleports">
            <Transition name="ui-slidefade">
                <div v-if="showTooltip" ref="tooltipRef" :style="tooltipStyle"
                    :class="['ui-tooltip-content', contentClass]">
                    <slot name="content">
                        <span>{{ tooltip }}</span>
                    </slot>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>