<script setup lang="ts">

</script>

<template>
    <div>
        <h1>Dev Tests</h1>
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
        <div style="height: 1000px;"></div>

    </div>
</template>

<style lang="scss" scoped>
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
</style>
