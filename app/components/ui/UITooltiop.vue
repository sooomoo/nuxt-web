<script setup lang="ts">
import { Rect } from "vuepkg";
import type { Anchor } from "./scripts/Enums";
import { BoundingClientRectObserver } from "./scripts/Observers";

const props = defineProps<{
    tooltip?: string;
    anchor?: Anchor;
}>();

const showTooltip = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const rootRect = ref<Rect | null>(null);

const finalAnchor = computed(() => {
    return props.anchor || "bottomCenter";
});

const tooltipStyle = computed(() => {
    if (!rootRect.value || !tooltipRef.value) return {};
    const tooltipRect = rootRect.value.anchorOutside(finalAnchor.value, Rect.fromDOMRect(tooltipRef.value.getBoundingClientRect()));
    return {
        // transform: `translate(${tooltipRect.x}px, ${tooltipRect.y}px)`,
        left: tooltipRect.x + "px",
        top: tooltipRect.y + "px",
    };
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

const onMouseEnter = (_: MouseEvent) => {
    showTooltip.value = true;
};

const onMouseLeave = (_: MouseEvent) => {
    showTooltip.value = false;
};
</script>

<template>
    <div ref="rootRef" class="ui-tooltip" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
        <slot />
        <Teleport to="#teleports">
            <Transition name="ui-slidefade">
                <div v-if="showTooltip" ref="tooltipRef" :style="tooltipStyle" class="ui-tooltip-content">
                    <slot name="content">
                        <span>{{ tooltip }}</span>
                    </slot>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>
