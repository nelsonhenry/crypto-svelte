<script>
    import {stops1, stops2} from '../stores'
</script>
<template>
    <div class="sorts">
        {#if !$stops1 && !$stops2}
            <div
                class="sort__col sort__rank sort"
                data-sort="coin__rank"
            >
                <span>#</span>
            </div>
        {/if}
        <div
            class="sort__col sort__symbol sort"
            data-sort="coin__symbol"
        >
            <span>ID</span>
        </div>
        <div
            class="sort__col sort__percent sort"
            data-sort="coin__percent"
        >
            <span>%</span>
        </div>
        <div
            class="sort__col sort__percent24h sort"
            data-sort="coin__percent24h"
        >
            <span>%D</span>
        </div>
        <div
            class="sort__col sort__gain sort"
            data-sort="coin__gain"
        >
            <span>PRF</span>
        </div>
        {#if !$stops1 && !$stops2}
        <div
            class="sort__col sort__bet sort"
            data-sort="coin__bet"
        >
            <span>Bet</span>
        </div>
        {/if}
        <div class="sort__col sort__now">
            <span>Now</span>
        </div>
        <div class="sort__col sort__stop" class:collapsed={!$stops1}>
            <span>L1</span>
        </div>
        <div class="sort__col sort__old sort__stop" class:collapsed={!$stops1}>
            <span>T0</span>
        </div>
        <div class="sort__col sort__stop" class:collapsed={!$stops1}>
            <span>T1</span>
        </div>
        <div class="sort__col sort__stop" class:collapsed={!$stops2}>
            <span>T2</span>
        </div>
        <div class="sort__col sort__stop" class:collapsed={!$stops2}>
            <span>T3</span>
        </div>
    </div>
</template>
<style lang='scss'>
</style>