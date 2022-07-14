<script>
    import { 
        apiUrl,
        isDetailCoin
    } from '../stores'

    let detailCoin;

    const getCoinDetails = async (coin) => {
        datasSending = true;
        await axios
        .get($apiUrl + '/markets?vs_currency=usd&ids=' + coin.name)
        .then(res => {
            let data = res.data[0];
            detailCoin.name = coin.name;
            detailCoin.symbol = coin.symbol;
            detailCoin.image = data.image;
            detailCoin.ath = data.ath;
            detailCoin.currentPrice = data.current_price;
            detailCoin.marketCapRank = data.market_cap_rank;
            detailCoin.athPercent = percentChange(detailCoin.ath, detailCoin.currentPrice)
            datasSending = false;
            $isDetailCoin = true;
        })
        .catch(err => {
            error.hasError = true;
            error.datas = 'datas:' + err.message
        })
    };

    onMount(async () => await getCoinDetails())
</script>
<template>
    <div class="detail">
        <div class="detail__section">
            <button class="button" on:click={() => $isDetailCoin = false}>Close</button>
            <div class="detail__row">
                <div class="detail__image">
                    <img src="{detailCoin.image}" alt="{detailCoin.symbol} logo">
                </div>
                <span class="detail__rank">{detailCoin.marketCapRank}</span>&nbsp;<span class="detail__symbol">{detailCoin.symbol}</span>&nbsp;(<span class="detail__name">{detailCoin.name}</span>)
            </div>
            <div class="detail__prices">
                <div class="detail__ath">{detailCoin.ath}</div>
                <div class="detail__current">{detailCoin.currentPrice} ({detailCoin.athPercent.toFixed(1)}%)</div>
            </div>
        </div>
    </div>
</template>
<style lang='scss'>
</style>