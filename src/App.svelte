<script>
    import Coins from "./components/Coins.svelte";
    // import Login from "./components/Login.svelte";
</script>

<template>
    <div class="wrapper" id="listjs">
        <Coins />
    </div>
</template>

<style lang="scss" global>
    :global {
        @import "./css/_reset";
        @import "./css/_variables";
        @import "./css/_include-media";
        @import "./css/_global";
        @import "./css/_header";
        @import "./css/_form";
        @import "./css/_stats";
        @import "./css/_coins";
        @import "./css/_detail";
    }
</style>