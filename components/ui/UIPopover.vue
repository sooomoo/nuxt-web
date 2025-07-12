<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { logger } from 'vuepkg';
import type { Anchor } from './scripts/Enums';
import { BoundingClientRectObserver } from './scripts/Observers';
import { Rect } from './scripts/Types';

const props = defineProps<{
    trigger?: 'hover' | 'click'
    disabled?: boolean
    anchor?: Anchor
}>();

const popoverVisible = defineModel('popoverVisible', {
    type: Boolean,
    default: false
});
const popoverRef = ref<HTMLElement | null>(null);
const popoverContentRef = ref<HTMLElement | null>(null);
const rootRect = ref<Rect | null>(null);

const boundingRectObserver = new BoundingClientRectObserver((rect) => {
    rootRect.value = Rect.fromDOMRect(rect);
}, 'UIPopover');

watch(popoverVisible, (val) => {
    if (val) {
        if (popoverRef.value) boundingRectObserver.observe(popoverRef.value);
        document.addEventListener('click', onClickDocument);
        if (props.trigger === 'hover' && popoverRef.value) {
            popoverRef.value.removeEventListener('mouseenter', onMouseLeave);
            popoverRef.value.addEventListener('mouseleave', onMouseLeave);
            nextTick(() => {
                if (popoverContentRef.value) {
                    popoverContentRef.value.addEventListener('mouseleave', onContentMouseLeave);
                }
            });
        }
    } else {
        boundingRectObserver.unobserve();

        document.removeEventListener('click', onClickDocument);
        if (props.trigger === 'hover' && popoverRef.value) {
            popoverRef.value.addEventListener('mouseenter', onMouseEnter);
            popoverRef.value.removeEventListener('mouseleave', onMouseLeave);
            if (popoverContentRef.value) {
                popoverContentRef.value.removeEventListener('mouseleave', onContentMouseLeave);
            }
        }
    }
});
watch(() => props.disabled, (val) => {
    if (val) {
        popoverVisible.value = false;
        unhookEvent();
    } else {
        hookEvent();
    }
});

const finalAnchor = computed(() => {
    return props.anchor || 'bottomCenter';
});
const popoverContentStyle = computed(() => {
    if (!rootRect.value || !popoverContentRef.value) return {};
    const rect = rootRect.value.shrink(1);
    const tooltipRect = rect.anchorOutside(finalAnchor.value, Rect.fromDOMRect(popoverContentRef.value.getBoundingClientRect()));
    return {
        transform: `translate(${tooltipRect.x}px, ${tooltipRect.y}px)`,
    };
});

const hookEvent = () => {
    unhookEvent();

    if (props.trigger === 'hover') {
        if (!popoverRef.value) return;
        popoverRef.value.addEventListener('mouseenter', onMouseEnter);
    } else {
        document.addEventListener('click', onClickDocument);
    }
};
const unhookEvent = () => {
    document.removeEventListener('click', onClickDocument);
    if (popoverRef.value) {
        popoverRef.value.removeEventListener('mouseenter', onMouseEnter);
        popoverRef.value.removeEventListener('mouseleave', onMouseLeave);
    }
    if (popoverContentRef.value) {
        popoverContentRef.value.removeEventListener('mouseleave', onContentMouseLeave);
    }
};


const onClickDocument = (evt: Event) => {
    logger.debug('onClickDocument', evt);
    if (popoverRef.value) {
        const isClickInside = popoverRef.value === evt.target || popoverRef.value.contains(evt.target as HTMLElement);
        const isClickInContent = popoverContentRef.value && (popoverContentRef.value === evt.target || popoverContentRef.value.contains(evt.target as HTMLElement));
        if (!isClickInside && !isClickInContent) {
            popoverVisible.value = false; // 点击在popover和 content 的外部
        }
    }
};

const onMouseEnter = (_: Event) => {
    // logger.debug('onMouseEnter', evt); 
    popoverVisible.value = true;
};
const onMouseLeave = (evt: MouseEvent) => {
    // logger.debug('onMouseLeave', evt);
    if (popoverContentRef.value) {
        const isToContent = popoverContentRef.value === evt.relatedTarget || popoverContentRef.value.contains(evt.relatedTarget as HTMLElement);
        if (isToContent) {
            // 鼠标移动到了 content 上
            return;
        }
    }
    popoverVisible.value = false;
};
const onContentMouseLeave = (evt: MouseEvent) => {
    if (props.trigger !== 'hover') return;
    logger.debug('onContentMouseLeave', evt);
    popoverVisible.value = false;
};

const onClickRoot = (_: Event) => {
    // logger.debug('onClickRoot', evt);
    if (props.disabled) return;

    popoverVisible.value = !popoverVisible.value;
};

onMounted(() => hookEvent());
onUnmounted(() => unhookEvent());

</script>

<template>
    <!-- 此处不能使用 @click.stop，否则当页面有多个 popover 时，会造成点击一个 popover 无法关闭另外一个已经打开的 popover-->
    <div ref="popoverRef" class="ui-popover" :style="{ cursor: disabled ? 'auto' : 'pointer' }" @click="onClickRoot">
        <slot></slot>
        <Teleport to="#teleports">
            <Transition name="ui-slidefade">
                <div v-if="popoverVisible" ref="popoverContentRef" :style="popoverContentStyle"
                    class="ui-popover-content">
                    <slot name="content"></slot>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>
