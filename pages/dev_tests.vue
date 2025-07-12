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
        <UIPopover class="tooltip-test" trigger="hover" anchor="leftCenter">
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
        <div class="scroll-test">
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
        </div>
        <div style="height: 1000px;"></div>

    </div>
</template>

<style lang="scss" scoped>
.tooltip-test {
    margin: 40px 100px;
    background-color: #f0f0f0;
}

.scroll-test {
    width: min-content;
    overflow: auto;
    height: 300px;

    &>div {
        height: 600px;
    }
}

.popover-content {
    width: 100px;
    height: 70px;
}
</style>
