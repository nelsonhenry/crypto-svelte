<script>
    import { onMount } from 'svelte';
    import Login from "./components/Login.svelte";
    import Coins from "./components/Coins.svelte";
    import Loading from "./components/Loading.svelte";
    import { auth, isLogged, isLoading } from './stores';

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
    <div class="wrapper">
        {#if $isLogged}
            <Coins />
        {:else}
            <Login />
        {/if}
        {#if $isLoading}
            <Loading />
        {/if}
template    </div>
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