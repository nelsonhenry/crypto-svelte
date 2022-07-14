<script>
    import Loading from './Loading.svelte';
    import axios from 'axios';
    
    import { 
        adminUrl,
        apiUrl,
        auth,
        stats,
        isAddingCoin,
    } from '../stores';

    import { smallImg } from '../helpers';

    let post = {}, 
        datasSending = false,
        isSearchDatasLoaded, 
        searchCoins, 
        existingCoin, 
        error = {
            hasError: false,
        };

    const searchCoin = async () => {
        if (!post.symbol) return;
        searchCoins = [];
        existingCoin = false;
        isSearchDatasLoaded = false;
        
        await axios
        .get($apiUrl + '/list')
        .then((res) => {
            let datas = res.data;
            for (var i = 0; i < datas.length; i++) {
                if (datas[i].symbol == post.symbol.toLowerCase()) {
                    searchCoins.push(datas[i]);
                }
            }

            for (let coin of searchCoins) {
                if ($stats.list.includes(coin.id)) {
                    existingCoin = true;
                    axios.get($adminUrl + '/coins?name_eq=' + coin.id, $auth)
                    .then(res => {
                        if (res !== []) {
                                coin.existing = '☑️';
                                post.id = res.data[0].id;

                                axios.get($apiUrl + '/markets?vs_currency=usd&ids=' + coin.id)
                                    .then((res) => {
                                        coin.image = smallImg(res.data[0].image);
                                        coin.marketCapRank = res.data[0].market_cap_rank;
                                        isSearchDatasLoaded = true;
                                    })
                                    .catch((err) => {
                                        error.hasError = true;
                                        error.datas = "datas: " + err.message;
                                    });
                                
                            } else {
                                error.hasError = true;
                                error.datas = "datas: " + 'Coin not found';
                            }
                        })
                }
            }

            if (!existingCoin) {
                for (let coin of searchCoins) {
                axios
                    .get($apiUrl + '/markets?vs_currency=usd&ids=' + coin.id)
                    .then((res) => {
                        coin.image = smallImg(res.data[0].image);
                        coin.marketCapRank = res.data[0].market_cap_rank;
                        // last coin reached
                        if (coin === searchCoins[searchCoins.length - 1]) isSearchDatasLoaded = true;
                    })
                    .catch((err) => {
                        error.hasError = true;
                        error.datas = "datas: " + err.message;
                    });
                }
            }
        });
    };
    
    const addCoin = async () => {
        datasSending = true;
        if (existingCoin) {
            await axios
                .get($adminUrl + '/coins/' + post.id, $auth)
                .then((res) => {
                    let coin = res.data;
                    axios.put(
                        $adminUrl + '/coins/' + coin.id,
                        {
                            sold: false,
                            buys: [
                                ...coin.buys,
                                {
                                    amount: post.buyAmount,
                                    price: post.buyPrice,
                                },
                            ],
                            stops: {
                                min10: true,
                                max0: false,
                                max10: false,
                                max20: false,
                                max30: false,
                            },
                        },
                        $auth
                    )
                    .then((res) => {
                        coin.isAddingBuy = false;
                        datasSending = false;
                        location.reload();
                        // getAdminDatas();
                    })
                    .catch((err) => {
                        error.hasError = true;
                        error.update = "Put: " + err;
                    });
                })
        } else {
            await axios
                .post(
                    $adminUrl + '/coins',
                    {
                        name: post.name,
                        symbol: post.symbol,
                        sold: false,
                        buys: [
                            {
                                amount: post.buyAmount,
                                price: post.buyPrice,
                            },
                        ],
                        stops: {
                            min10: true,
                            max0: false,
                            max10: false,
                            max20: false,
                            max30: false,
                        },
                    },
                    $auth
                )
                .then((res) => {
                    $isAddingCoin = false;
                    datasSending = false;
                    location.reload();
                    // getAdminDatas();
                })
                .catch((err) => {
                    error.hasError = true;
                    error.post = "Post: " + err;
                });
        }
    };    
</script>

<template>
    <div class="form form--add-coin">
        <div class="form__section">
            <div class="form__row">
                <div class="form__col col-5" style="position:relative;">
                    <label for="add-coin-symbol" class="form__label">
                        Symbol
                    </label>
                    <input
                        bind:value={post.symbol}
                        id="add-coin-symbol"
                        class="form__input"
                        type="text"
                    />
                    <button
                        class="form__btn form__btn--inline"
                        on:click={searchCoin(post.symbol)}>Search</button
                    >
                </div>
                <div class="form__col col-7">
                    <label for="add-coin-name" class="form__label">Name</label>
                    <input
                        bind:value={post.name}
                        id="add-coin-name"
                        class="form__input"
                        type="text"
                    />
                </div>
            </div>
            {#if isSearchDatasLoaded}
                <div class="form__row">
                    <div class="form__col col-12">
                        <div class="search-coins">
                            {#each searchCoins as coin}
                                <div
                                    class="search-coin"
                                    on:click={() => (post.name = coin.id)}
                                >
                                    <div
                                        class="search-coin__col search-coin__existing"
                                    >
                                        {coin.existing ? coin.existing : ''}
                                    </div>
                                    <div
                                        class="search-coin__col search-coin__image"
                                    >
                                        {#if coin.image}
                                            <img
                                                src={coin.image}
                                                alt="coin logo"
                                            />
                                        {/if}
                                    </div>
                                    <div
                                        class="search-coin__col search-coin__rank"
                                    >
                                        {coin.marketCapRank
                                            ? coin.marketCapRank
                                            : '/'}
                                    </div>
                                    <div
                                        class="search-coin__col search-coin__symbol"
                                    >
                                        {coin.symbol.toUpperCase()}
                                    </div>
                                    <div
                                        class="search-coin__col search-coin__name"
                                    >
                                        {coin.id}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {:else if isSearchDatasLoaded === false}
                <Loading />
            {/if}
            <div class="form__row">
                <div class="form__col col-5">
                    <label for="add-coin-amount" class="form__label"
                        >Buy amount</label
                    >
                    <input
                        bind:value={post.buyAmount}
                        id="add-coin-amount"
                        class="form__input"
                        type="number"
                    />
                </div>
                <div class="form__col col-4">
                    <label for="add-coin-price" class="form__label"
                        >Buy price</label
                    >
                    <input
                        bind:value={post.buyPrice}
                        id="add-coin-price"
                        class="form__input"
                        type="number"
                    />
                </div>
                <div class="form__col col-3">
                    <label for="" class="form__label">Buy value</label>
                    <input
                        value={post.buyAmount && post.buyPrice
                            ? post.buyAmount * post.buyPrice
                            : 0}
                        id="add-coin-price"
                        class="form__input"
                        type="number"
                    />
                </div>
            </div>
            <div class="form__row form__row--no-border">
                <div class="form__col col-6 col-md-8">
                    <input
                        class="form__btn form__submit"
                        type="submit"
                        value="Submit"
                        on:click={addCoin(post)}
                    />
                </div>
                <div class="form__col col-6 col-md-4">
                    <button
                        class="form__btn form__cancel"
                        on:click={() => ($isAddingCoin = false)}>Cancel</button
                    >
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
</style>
