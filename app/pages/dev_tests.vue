<script setup lang="ts">
import { logger } from "vuepkg";
import type { ThreeState } from "~/components/ui/scripts/Types";

const activeTab = ref("0");
const tabList = [
    { title: "报告模", id: 0 },
    { title: "报告报告模", id: 1 },
    { title: "建模", id: 2 },
];
const vtabList = [
    { title: "报", id: 0 },
    { title: "模", id: 1 },
    { title: "建", id: 2 },
];

const collapseItems = [
    {
        id: "1",
        header: "This is panel header 1",
        content:
            "A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a welcome guest in many households across the world.",
    },
    {
        id: "2",
        header: "This is panel header 2",
        content:
            "A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a welcome guest in many households across the world.",
    },
    {
        id: "3",
        header: "This is panel header 3",
        content:
            "A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a welcome guest in many households across the world.",
    },
];
const defaultOpenedItems = ["2"];

const sseMsg = reactive<string[]>([]);
const onClickStartSSE = () => {
    const config = useRuntimeConfig();
    const url = config.public.apiBaseUrl + "/hub/ai";
    logger.debug("Start SSE", url);
    const source = new EventSource(url, {
        withCredentials: true,
    });
    source.onopen = (event) => {
        logger.info("sse open", event);
    };
    source.onmessage = (event) => {
        logger.info("sse message", event);
        sseMsg.push(`${event.lastEventId}: ${event.data}`);
    };
    source.onerror = (event) => {
        logger.error("sse error", event);
    };
};

const onClickStartWS = () => { 
    const config = useRuntimeConfig(); 
    const url = config.public.apiBaseUrl + "/hub/chat"; 
    logger.debug("Start WS", url); 
    const ws = new WebSocket(url); 
    ws.onopen = (event) => { 
        logger.info("ws open", event); 
    };

    ws.onmessage = (event) => { 
        logger.info("ws message", event);  

    }; 
    ws.onerror = (event) => { 
        logger.error("ws error", event); 
    };  
};

const checked = ref(false);

const threeStateChecked = ref<ThreeState>("indeterminate");
const checkboxGroupItems = ref<{ id: string; title: string }[]>(
    Array.from({ length: 10 }, (_, i) => ({ id: i + "", title: `checkbox ${i}` })),
);
const checkboxGroupItemsLong = ref<{ id: string; title: string }[]>(
    Array.from({ length: 1000 }, (_, i) => ({ id: i + "", title: `checkbox ${i}` })),
);
const checkedIds = ref<string[]>(["1", "3"]);
watch(checkedIds, (val) => {
    logger.debug("checkedIds", val);
});

const checkedIdsLong = ref<string[]>(["1", "3"]);
watch(checkedIdsLong, (val) => {
    logger.debug("checkedIdsLong", val);
});
</script>

<template>
    <h1>Dev Tests</h1>
    <button @click="onClickStartWS">Start WS</button>
    <button @click="onClickStartSSE">Start SSE</button>
    <ol>
        <li v-for="msg in sseMsg">{{ msg }}</li>
    </ol>
    <div>
        <span>Checked: {{ checked }}</span> <UICheckBox v-model="checked" label="Checkbox"> This is Checkbox </UICheckBox>
    </div>
    <div>
        <UICheckBoxThreeState v-model="threeStateChecked" :label="'CheckBoxThreeState'"></UICheckBoxThreeState>
    </div>
    <div style="width: 200px">
        <UICheckBoxGroup v-model:model-value="checkedIds" :items="checkboxGroupItems">
            <template #item="{ item }">
                {{ item.title }}
            </template>
        </UICheckBoxGroup>
    </div>
    <div style="width: 200px; margin-top: 20px">
        <UICheckBoxGroup
            v-model:model-value="checkedIdsLong"
            :virtualize="true"
            items-container-class="checkbox-list-long-container"
            :item-height="20"
            :items="checkboxGroupItemsLong"
            :buffer="15"
            item-class="checkbox-listitem"
        >
            <template #item="{ item }">
                {{ item.title }}
            </template>
        </UICheckBoxGroup>
    </div>

    <UITab v-model:active-id="activeTab" :item-key="(item) => item.id + ''" class="tab-test" :items="tabList" title-key="title"></UITab>
    <UITab
        v-model:active-id="activeTab"
        :item-key="(item) => item.id + ''"
        class="vtab-test"
        :items="vtabList"
        orientation="vertical"
        title-key="title"
    >
        <template #default="{ item }">
            {{ item.title }}
        </template>
    </UITab>

    <UISorter class="margin"></UISorter>
    <UITooltiop tooltip="This is a tooltip" class="tooltip-test">
        <button>Hover me</button>
    </UITooltiop>
    <UITooltiop tooltip="This is a tooltip" class="tooltip-test" anchor="bottomLeft">
        <button>Hover me</button>
        <template #content>
            <div>
                <p>This is a tooltip</p>
                <p>This is a tooltiptooltip</p>
                <p>This is a tooltip</p>
            </div>
        </template>
    </UITooltiop>
    <UIPopover class="tooltip-test" trigger="hover" anchor="rightCenter">
        <button>Hover me</button>
        <template #content>
            <div class="popover-content">
                <p>This is a tooltip</p>
                <UITooltiop tooltip="Clikc ME">
                    <button>click</button>
                </UITooltiop>
            </div>
        </template>
    </UIPopover>
    <UIPopover class="tooltip-test" trigger="click" anchor="rightCenter">
        <button>Click me</button>
        <template #content>
            <div class="popover-content">
                <p>This is a tooltip</p>
                <UITooltiop tooltip="Clikc ME">
                    <button>click</button>
                </UITooltiop>
            </div>
        </template>
    </UIPopover>
    <UIScrollable direction="vertical" class="scroll-test">
        <div>
            <UIPopover class="tooltip-test">
                <button>Hover me</button>
                <template #content>
                    <div class="popover-content">
                        <p>This is a tooltip</p>
                    </div>
                </template>
            </UIPopover>
        </div>
    </UIScrollable>
    <div class="ui-flex">
        <UICenter class="align-test">center</UICenter>
        <UIAlign vertical="top" horizontal="center" class="align-test">Align</UIAlign>
    </div>
    <UIFlex direction="column" class="flex-test">
        <UIAlign vertical="center" horizontal="center" class="size">124</UIAlign>
        <UIFlexFillRemain direction="vertical" scroll-if-need>
            <div class="sub">234</div>
        </UIFlexFillRemain>
    </UIFlex>
    <UICollapse
        class="collapse-test"
        header-class="ui-flex ui-flex-align-center collapse-test-header"
        content-class="collapse-test-content"
    >
        <template #header>
            <UIIconArrowFill></UIIconArrowFill>
            a type of domesticated
        </template>
        <template #content>
            A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a welcome guest in many
            households across the world.
        </template>
    </UICollapse>
    <UICollapseGroup
        :items="collapseItems"
        mutex
        :default-opened-items="defaultOpenedItems"
        class="ui-flex ui-flex-column ui-flex-align-stretch collapse-group-test"
        item-class="collapse-item"
        item-header-class="ui-flex ui-flex-align-center item-header"
        item-content-class="item-content"
    >
        <template #itemHeader="{ item }">
            <UIIconArrowFill></UIIconArrowFill>
            {{ item.header }}
        </template>
        <template #itemContent="{ item }">
            {{ item.content }}
        </template>
    </UICollapseGroup>
</template>

<style lang="scss" scoped>
$backcolor: #f0f0f0;

:deep(.checkbox-list-long-container) {
    height: 300px;
    overflow-y: auto;
}
:deep(.checkbox-listitem) {
    width: 192px; // width - scrollbarwidth
    // height: 24px;
}

.margin {
    margin: 10px 20px;
}

.tab {
    margin-left: 20px;
}

.tooltip-test {
    margin: 10px 40px;
    background-color: $backcolor;
}

.flex-test {
    width: 200px;
    height: 300px;
    margin: 10px 40px;
    background-color: $backcolor;

    .size {
        width: 100%;
        height: 40px;
    }

    .sub {
        background-color: $backcolor;
        width: 100%;
        height: 500px;
    }
}

.scroll-test {
    width: min-content;
    height: 200px;

    & > div {
        height: 600px;
    }
}

.align-test {
    margin: 10px 40px;
    width: 100px;
    height: 100px;
    background-color: $backcolor;
}

.popover-content {
    width: 100px;
    height: 70px;
}

.tab-test {
    margin: 0 20px;
    background-color: $backcolor;
}

.vtab-test {
    margin: 10px 20px;
    background-color: $backcolor;
    width: 48px;
}

.collapse-test {
    width: 200px;
    background: rgb(199, 221, 255);
    overflow: hidden;
    margin: 10px 20px;
    line-height: 1.25;
    border-radius: 4px;

    :deep(.collapse-test-header) {
        padding: 8px 12px;
        gap: 8px;

        & svg {
            width: 8px;
            height: 8px;
            transform: rotate(0);
            transition: transform 0.3s;
            fill: #666;
        }
    }

    :deep(.collapse-test-content) {
        padding: 0 12px;
    }
}

.collapse-test[data-open="true"] {
    :deep(.collapse-test-header) {
        & svg {
            transform: rotate(90deg);
        }
    }

    :deep(.collapse-test-content) {
        padding: 0 12px 8px 12px;
    }
}

.collapse-group-test {
    width: 200px;
    gap: 8px;
    margin: 10px 20px;
    line-height: 1.25;
}

// deep 里面不能再次使用 deep
// 里面的类不使用 deep 也能达到效果，因为外部 deep已经起作用了
:deep(.collapse-item) {
    background: $backcolor;
    border-radius: 4px;

    .item-header {
        padding: 8px 12px;
        gap: 8px;

        & svg {
            width: 8px;
            height: 8px;
            transform: rotate(0);
            transition: transform 0.3s;
            fill: #666;
        }
    }

    .item-content {
        padding: 0 12px;
    }
}

:deep(.collapse-item[data-open="true"]) {
    .item-header {
        & svg {
            transform: rotate(90deg);
        }
    }

    .item-content {
        padding: 0 12px 8px 12px;
    }
}
</style>
