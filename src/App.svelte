<script>
    import { onMount } from 'svelte';
    import axios from "axios";
    import Login from "./components/Login.svelte";
    import Coins from "./components/Coins.svelte";
    import { auth, isLogged } from './stores';

    onMount(async () => {
        if (sessionStorage.getItem("auth")) {
            $auth = {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem("auth")}`,
                },
            };
            $isLogged = true;
        }
    });
</script>

<template>
    <div class="wrapper" id="listjs">
        {#if $isLogged}
            <Coins />
        {:else}
            <Login />
        {/if}
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
    }
</style>