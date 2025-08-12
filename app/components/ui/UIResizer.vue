<script setup lang="ts">
const props = defineProps<{
    direction: "hor" | "vert" | "all";
    class?: string;
    activeClass?: string;
}>();

const className = computed(() => {
    const className = ["ui-resizer"];
    if (props.direction === "hor") {
        className.push("ui-resizer-hor");
    } else if (props.direction === "vert") {
        className.push("ui-resizer-vert");
    } else {
        className.push("ui-resizer-all");
    }
    if (props.class) {
        className.push(props.class);
    }
    if (isResizing.value && props.activeClass) {
        className.push(props.activeClass);
    }
    return className.join(" ");
});

const emit = defineEmits<{
    (e: "resize", deltaX: number, deltaY: number): void;
}>();

const elemRef = ref<HTMLDivElement | null>(null);
const isResizing = ref(false);
let isUpdating = false;

const handleResize = async (e: MouseEvent) => {
    if (!isResizing.value) return;
    e.stopPropagation();
    e.preventDefault();

    if (props.direction === "hor") {
        document.documentElement.style.cursor = "col-resize";
    } else if (props.direction === "vert") {
        document.documentElement.style.cursor = "row-resize";
    } else {
        document.documentElement.style.cursor = "move";
    }

    if (isUpdating) return;
    isUpdating = true;
    requestAnimationFrame(() => {
        isUpdating = false;
        if (props.direction === "hor") {
            emit("resize", e.movementX, 0);
        } else if (props.direction === "vert") {
            emit("resize", 0, e.movementY);
        } else {
            emit("resize", e.movementX, e.movementY);
        }
    });
};

const stopResize = () => {
    isResizing.value = false;
    document.body.style.userSelect = "";
    document.body.style.pointerEvents = "";
    document.documentElement.style.cursor = "";
    document.removeEventListener("mousemove", handleResize);
    document.removeEventListener("mouseup", stopResize);
};

const startResize = async (e: MouseEvent) => {
    console.log("start resize", e);
    isResizing.value = true;

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", stopResize);
    document.body.style.pointerEvents = "none";
    document.body.style.userSelect = "none";
    // document.documentElement.style.cursor = "move";
};
</script>
<template>
    <div ref="elemRef" :class="className" @mousedown="startResize">
        <slot></slot>
    </div>
</template>
