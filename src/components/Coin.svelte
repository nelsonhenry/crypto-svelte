<script>
    import axios from 'axios'
    import CoinEdit from './CoinEdit.svelte'
    import CoinAddBuy from './CoinAddBuy.svelte'

    import {
        stops1, 
        stops2,
        adminUrl,
        auth,
        coins,
        error,
        isShowingSoldCoins,
        listjsSearchValue
    } from '../stores'

    import { fixed } from '../helpers'

    export let coin

    const editStops = async (coin, stopValue) => {
        // https://stackoverflow.com/questions/68799891/set-nested-property-of-json-object-using-brackets-notation-in-put-request-svelt
        datasSending = true;
        let index = coins.indexOf(coin);
        await axios
            .put($adminUrl + '/coins/' + coin.id,
                {
                    stops: {
                        ...coin.stops,
                        [stopValue]: coin.stops[stopValue] ? false : true,
                    },
                },
                $auth
            )
            .then((res) => {
                datasSending = false;
                $coins[index].stops[stopValue] = res.data.stops[stopValue];
            })
            .catch((err) => {
                $error.hasError = true;
                $error.update = "Put: " + err;
            });
    };
</script>
<template>
    {#if !coin.sold}
    <li class="coin coin--{coin.symbol.toLowerCase()}">
        {#if !$stops1 && !$stops2}
        <div class="coin__col coin__rank">
            <span>
                {coin.marketCapRank !== null ? coin.marketCapRank : "/"}
            </span>
        </div>
        {/if}
        <div class="coin__col coin__symbol" on:click={() => {
            coin.isEdited = true
        }}>
            <span>
                {coin.symbol.toUpperCase()}
            </span>
        </div>
        <div class="coin__col coin__percent">
            <!-- on:click={getCoinDetails(coin)} -->
            <span style="display: none">
                {coin.percentChange + 100}
            </span>
            <span
                class="
            {coin.percentChange >= 0 ? 'pos' : 'neg'} 
            {coin.percentChange >= 10 ? 'tp' : ''} 
            {coin.percentChange >= 20 ? 'tp20' : ''}
            {coin.percentChange >= 30 ? 'tp30' : ''}
                {coin.percentChange <= -10
                    ? 'stop'
                    : ''}"
            >
                {coin.percentChange.toFixed(1).replace('-', '')}
            </span>
        </div>
        <div class="coin__col coin__percent24h">
            <span style="display: none">
                {coin.percentChange24h + 100}
            </span>
            <span
                class={coin.percentChange24h >= 0
                    ? "pos"
                    : "neg"}
            >
                {coin.percentChange24h.toFixed(1).replace('-', '')}
            </span>
        </div>
        <div class="coin__col coin__gain">
            <span style="display: none"
                >{coin.gains.on + 100}</span
            >
            <span>
                {coin.gains.on.toFixed(0)}
            </span>
        </div>
        {#if !$stops1 && !$stops2}
        <div class="coin__col coin__bet">
            <span>
                {(coin.buysValue / 100).toFixed(0)}
            </span>
        </div>
        {/if}
        <div class="coin__col coin__now">
            <span>
                {fixed(coin.currentPrice)}
            </span>
        </div>
        <div class="coin__col coin__stop" class:collapsed={!$stops1}>
            <span
            on:click={editStops(coin, "min10")}
            class:selected={coin.stops &&
                        coin.stops.min10}
                    class:higher={coin.percentChange <
                        -10}
                    class:advised={coin.percentChange >
                        -10 && coin.percentChange < 10}
                >
                {#if $stops1}
                {fixed(coin.buysPrice * 0.9)}
                {:else}
                &nbsp;
                {/if}
            </span>
        </div>
        <div class="coin__col coin__old coin__stop" class:collapsed={!$stops1}>
            <span
                on:click={editStops(coin, "max0")}
                class:selected={coin.stops &&
                    coin.stops.max0}
                class:higher={coin.percentChange < 0}
                class:advised={coin.percentChange >=
                    10 && coin.percentChange < 20}
            >
                {#if $stops1}
                {fixed(coin.buysPrice)}
                {:else}
                &nbsp;
                {/if}
            </span>
        </div>
        <div class="coin__col coin__stop" class:collapsed={!$stops1}>
            <span
                on:click={editStops(coin, "max10")}
                class:selected={coin.stops &&
                    coin.stops.max10}
                class:higher={coin.percentChange <
                    10}
                class:advised={coin.percentChange >=
                    20 && coin.percentChange < 30}
            >
            {#if $stops1}
            {fixed(coin.buysPrice * 1.1)}
            {:else}
            &nbsp;
            {/if}
            </span>
        </div>
        <div class="coin__col coin__stop" class:collapsed={!$stops2}>
            <span
            on:click={editStops(coin, "max20")}
            class:selected={coin.stops &&
                coin.stops.max20}
                class:higher={coin.percentChange <
                    20}
                class:advised={coin.percentChange >=
                    30 && coin.percentChange     < 40}
            >
            {#if $stops2}
            {fixed(coin.buysPrice * 1.2)}
            {:else}
            &nbsp;
            {/if}
            </span>
        </div>
        <div class="coin__col coin__stop" class:collapsed={!$stops2}>
            <span
                on:click={editStops(coin, "max30")}
                class:selected={coin.stops &&
                    coin.stops.max30}
                class:higher={coin.percentChange <
                    30}
                class:advised={coin.percentChange >=
                    40 && coin.percentChange < 50}
            >
            {#if $stops2}
            {fixed(coin.buysPrice * 1.3)}
            {:else}
            &nbsp;
            {/if}
            </span>
        </div>
        {#if coin.isEdited}
            <CoinEdit coin={coin} />
        {/if}
    </li>
{:else if coin.sold}
    <li class="coin coin--{coin.symbol.toLowerCase()} coin--sold" class:hidden={!$isShowingSoldCoins && !$listjsSearchValue}>
        {#if !$stops1 && !$stops2}
        <div class="coin__col coin__rank">
            <span>
                {coin.marketCapRank !== null ? coin.marketCapRank : "/"}
            </span>
        </div>
        {/if}
        <div class="coin__col coin__symbol" on:click={() => coin.isAddingBuy = true}>
            <span>
                {coin.symbol.toUpperCase()}
            </span>
        </div>
        <div class="coin__col coin__percent">
        </div>
        <div class="coin__col coin__percent24h">
        </div>
        <div class="coin__col coin__gain">
            <span hidden>{coin.gains.off + 100}</span>
            <span>
                {coin.gains.off.toFixed(0)}
            </span>
        </div>
    </li>
    {#if coin.isAddingBuy}
        <CoinAddBuy coin={coin} />
    {/if}
{/if}

</template>
<style lang='scss'>
</style>