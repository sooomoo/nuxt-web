<script setup lang="ts">
const activeTab = ref(0);
const tabList = [
    { title: '报告模', id: 0 },
    { title: '报告报告模', id: 1 },
    { title: '建模', id: 2 },
];
const vtabList = [
    { title: '报', id: 0 },
    { title: '模', id: 1 },
    { title: '建', id: 2 },
];

const collapseItems = [{
    id: '1',
    header: 'This is panel header 1',
    content: 'A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a welcome guest in many households across the world.',
}, {
    id: '2',
    header: 'This is panel header 2',
    content: 'A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a welcome guest in many households across the world.',
}, {
    id: '3',
    header: 'This is panel header 3',
    content: 'A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a welcome guest in many households across the world.',
}];

</script>

<template>
    <h1>Dev Tests</h1>
    <UITab v-model:active-index="activeTab" class="tab-test" :items="tabList"></UITab>
    <UITab v-model:active-index="activeTab" class="vtab-test" :items="vtabList" orientation="vertical"></UITab>
    <UITooltiop tooltip="This is a tooltip" class="tooltip-test" anchor="rightCenter">
        <button>Hover me</button>
        <template #content>
            <div>
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
    <UICenter class="align-test">align</UICenter>
    <UIFlex direction="column" class="flex-test">
        <UIAlign vertical='center' horizontal='center' class="size">124</UIAlign>
        <UIFlexFillRemain direction="vertical" scroll-if-need>
            <div class="sub">234</div>
        </UIFlexFillRemain>
    </UIFlex>
    <UICollapse class="collapse-test" header-class="collapse-test-header"
        content-open-class="collapse-test-content-open" content-class="collapse-test-content">
        <template #header="{ contentOpen }">
            Header, open {{ contentOpen }}
        </template>
        <template #content>
            A dog is a type of domesticated animal.Known for its loyalty and faithfulness,it can be found as a
            welcome guest in many households across the world.
        </template>
    </UICollapse>
    <UICollapseGroup :items="collapseItems" class="ui-flex ui-flex-column ui-flex-align-stretch collapse-group-test">
        <template #itemHeader="{ item }">
            {{ item.header }}
        </template>
        <template #itemContent="{ item }">
            {{ item.content }}
        </template>
    </UICollapseGroup>
    <div style="height: 1000px;"></div>
</template>

<style lang="scss" scoped>
$backcolor: #444444;

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
        background-color: #363333;
        width: 100%;
        height: 500px;
    }
}

.scroll-test {
    width: min-content;
    height: 200px;

    &>div {
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
    background: skyblue;
    overflow: hidden;
    margin: 10px 20px;
    line-height: 1.25;
    border-radius: 4px;
}

:deep(.collapse-test-header) {
    padding: 8px 12px;
}

:deep(.collapse-test-content) {
    padding: 0 12px;
}

:deep(.collapse-test-content-open) {
    padding: 0 12px 8px 12px;
}

.collapse-group-test {
    width: 200px;
    gap: 8px;
    margin: 10px 20px;
}
</style>
