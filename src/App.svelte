<script>
    import Coins from "./components/Coins.svelte";
</script>

<template>
    <div class="wrapper">
        <Coins />
    </div>
</template>

<style lang="scss" global>
    :global {
        @import "./styles/_reset";
        @import "./styles/_variables";
        @import "./styles/_include-media";
        @import "./styles/_global";
        @import "./styles/_form";
    }
</style>
