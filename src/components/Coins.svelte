<script>
    import { onMount } from 'svelte';
    import axios from "axios";
    import List from "list.js";
    import Header from './Header.svelte';
    import Stats from './Stats.svelte';
    import Sorts from './Sorts.svelte';
    import CoinDetail from './CoinDetail.svelte';
    import CoinAdd from './CoinAdd.svelte';
    import Coin from './Coin.svelte'

    import { 
        coins,
        adminUrl, 
        apiUrl, 
        auth, 
        isLoading, 
        isAddingCoin, 
        isDetailCoin,
        listObj, 
        stats,
        error
    } from '../stores';
    
    import {
        percentChange,
        sumArray,
        sumProps,
        createGroups
    } from "../helpers";

    let datasLoaded = false;

    const getAdminDatas = async () => {
        const res = await axios.get($adminUrl + '/coins', $auth)
        const coins = [];
        for (const coin of await res.data) {
            setCoinProps(coin)
            coins.push(coin)
        }
        return coins
    };

    const getApiDatas = async (coins) => {
        
        for (const coinsList of createGroups($stats.list, 100)) {
            const res = await axios.get($apiUrl + '/markets?vs_currency=usd&ids=' + coinsList.join(','))
            Object.entries(res.data).forEach((el) => {
                let data = el[1]
                let coin = coins.find((coin) => coin.name === data.id)
                setCoinApiProps(coin, data)
            })
        }
        
        $stats.funds.off = 18670 - 5399
        $stats.funds.on = sumArray($stats.funds.onList)
        $stats.gains.on = sumArray($stats.gains.onList)
        $stats.gains.off.q2 = sumArray($stats.gains.offList)
        return datasLoaded = true;
    }

    const setCoinProps = (coin) => {
        $stats.list.push(coin.name);
        coin.isEdited = false;
        coin.isAddingBuy = false;
        if (!coin.sold) {
            coin.buysValueList = []
            coin.buysAmountList = []

            for (let buy of coin.buys) {
                coin.buysValueList.push(buy.amount * buy.price) //250
                coin.buysAmountList.push(buy.amount) //1.25
            }

            coin.buysValue = sumArray(coin.buysValueList);
            coin.buysAmount = sumArray(coin.buysAmountList);
            coin.buysPrice = sumArray(coin.buysValueList) / sumArray(coin.buysAmountList);

            $stats.funds.onList.push(coin.buysValue);

            if (coin.stops.min10) $stats.maxLooseList.push(coin.buysValue * -0.1);
            if (coin.stops.max10) $stats.maxLooseList.push(coin.buysValue * 0.1);
            if (coin.stops.max20) $stats.maxLooseList.push(coin.buysValue * 0.2);
            if (coin.stops.max30) $stats.maxLooseList.push(coin.buysValue * 0.3);
            $stats.maxLoose = sumArray($stats.maxLooseList);
        }

        for (let gain of coin.gains) {
            $stats.gains.offList.push(gain.amount);
        }

        coin.gains.off = sumProps(coin.gains, 'amount')
    }

    const setCoinApiProps = (coin, data) => {
        coin.image = data.image
        if (!coin.sold) {
            coin.currentPrice = data.current_price
            coin.percentChange24h = data.price_change_percentage_24h
            coin.percentChange = percentChange(
                coin.buysPrice,
                coin.currentPrice
            );
            coin.gains.on = (coin.buysValue / 100) * coin.percentChange;
            $stats.gains.onList.push(coin.gains.on);
        }
        coin.marketCapRank = data.market_cap_rank
    }

    onMount(async () => {
        $isLoading = true;
        $coins = await getAdminDatas();
        datasLoaded = await getApiDatas($coins);

        $listObj = new List("listjs", {
            valueNames: [
                "coin__rank",
                "coin__symbol",
                "coin__percent",
                "coin__percent24h",
                "coin__gain",
                "coin__bet",
            ],
            searchClass: 'listjs__search',
            listClass: 'coins',
        });

        $listObj.sort("coin__percent", {
            order: "desc",
        });

        $isLoading = false;
    });
</script>

<template>
    {#if datasLoaded}
        <main class="main" id="listjs">
            <Header />
            <Stats />
            <Sorts />
            <ul class="coins list">
                {#each $coins as coin}
                    <Coin coin={coin} />
                {/each}
            </ul>
            {#if $isDetailCoin}
                <CoinDetail />
            {/if}
            {#if $isAddingCoin}
                <CoinAdd />
            {/if}
        </main>
    {/if}
</template>
