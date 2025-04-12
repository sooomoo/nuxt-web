<script setup lang="ts"> 
</script>
<template>
    <header>
        <slot name="header">
            <h1>Nuxt 3 Layouts</h1>
        </slot>
    </header>
    <main>
        <slot />
    </main>
    <footer>
        <slot name="footer">
            <p>Copyright &copy; 2023</p>
        </slot>
    </footer>
</template>