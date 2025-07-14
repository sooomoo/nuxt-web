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

</script>

<template>
    <div>
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
        <div class="collapse-test">
            <UICollapse>
                <template #header>
                    Header
                </template>
                <template #content>
                    <div class="flex-test"></div>
                </template>
            </UICollapse>
        </div>
        <div style="height: 1000px;"></div>

    </div>
</template>

<style lang="scss" scoped>
.tab {
    margin-left: 20px;
}

.tooltip-test {
    margin: 10px 40px;
    background-color: #f0f0f0;
}

.flex-test {
    width: 200px;
    height: 300px;
    margin: 10px 40px;
    background-color: #f0f0f0;

    .size {
        width: 100%;
        height: 40px;
    }

    .sub {
        background-color: #efd6d6;
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
    background-color: #f0f0f0;
}

.popover-content {
    width: 100px;
    height: 70px;
}

.tab-test {
    margin: 0 20px;
    background-color: #f0f0f0;
}

.vtab-test {
    margin: 10px 20px;
    background-color: #f0f0f0;
    width: 48px;
}

.collapse-test {
    width: 100px;
    background: skyblue;
    overflow: hidden;
}
</style>
