<script>
    import { onMount } from 'svelte';
    import axios from "axios";
    import List from "list.js";
    import Loading from "./Loading.svelte";
    import { adminUrl, apiUrl, auth } from '../stores';
    
    import {
        percentChange,
        fixed,
        sumArray,
        sumProps,
        computeGains,
        computeAmount,
        computeSold,
        smallImg,
    } from "../helpers";

    let 
        // adminUrl = "https://crypto-svelte.herokuapp.com",
        // apiUrl = "https://api.coingecko.com/api/v3/coins",
        // isLogged = false,
        loginEmail,
        loginPw,
        coins = [],
        detailCoin = {},
        post = {},
        stats = {
            list: [],
            funds: {
                onList: [],
                offList: [],
                on: 0,
                off: 0,
            },
            buys: {
                amountList: [],
                amount: 0,
            },
            gains: {
                onList: [],
                offList: [],
                on: 0,
                off: {
                    q1: 1606.786106,
                    q2: 0,
                },
            },
            maxLooseList: [],
            maxLoose: 0,
        },
        datas = [],
        listObj,
        listjsSearchValue = '',
        existingCoin = false,
        datasLoaded = false,
        datasSending = false,
        isSearchDatasLoaded = undefined,
        stops1 = false,
        stops2 = false,
        isDetailCoin = false,
        isAddingCoin = false,
        isShowingSoldCoins = false,
        searchCoins = [],
        error = {
            hasError: false,
        };

    const getAdminDatas = async () => {
        await axios
            .get($adminUrl + '/coins', $auth)
            .then((res) => {
                coins = res.data;
                for (let coin of coins) {
                    setCoinProps(coin);
                }

                // get coingecko datas
                axios
                    .get($apiUrl + '/markets?vs_currency=usd&ids=' + stats.list.join(","))
                    .then((res) => {
                        datas = res.data;
                        Object.entries(datas).forEach((el) => {
                            let data = el[1];
                            let coin = coins.find(
                                (coin) => coin.name === data.id
                            );
                            setCoinApiProps(coin, data);
                        });

                        stats.funds.off = 18670 - 5419.75 - 2600 - 1083,95 - 1000;
                        stats.funds.on = sumArray(stats.funds.onList);
                        stats.gains.on = sumArray(stats.gains.onList);
                        stats.gains.off.q2 = sumArray(stats.gains.offList);

                        datasLoaded = true;
                    })
                    .then(() => {
                        listObj = new List("listjs", {
                            valueNames: [
                                "coin__rank",
                                "coin__symbol",
                                "coin__percent",
                                "coin__percent24h",
                                "coin__gain",
                                "coin__bet",
                            ],
                            searchClass: 'listjs__search',
                        });

                        listObj.sort("coin__percent", {
                            order: "desc",
                        });
                    })
                    .catch((err) => {
                        error.hasError = true;
                        error.datas = "datas: " + err.message;
                    });
            })
            .catch((err) => {
                error.hasError = true;
                error.admin = "admin: " + err.message;
            });
    };

    // const checkIfLogged = async () => {
    //     if (sessionStorage.getItem("auth")) {
    //         isLogged = true;
    //         $auth = {
    //             headers: {
    //                 Authorization: `Bearer ${sessionStorage.getItem("auth")}`,
    //             },
    //         };
    //         await getAdminDatas();
    //     }
    // };

    // const login = async () => {
    //     await axios
    //         .post(`${adminUrl}/auth/local`, {
    //             identifier: loginEmail,
    //             password: loginPw,
    //         })
    //         .then((res) => {
    //             loginEmail = "";
    //             loginPw = "";
    //             sessionStorage.setItem("auth", res.data.jwt);
    //             auth = {
    //                 headers: {
    //                     Authorization: `Bearer ${res.data.jwt}`,
    //                 },
    //             };
    //             isLogged = true;
    //             getAdminDatas();
    //         })
    //         .catch((error) => {
    //             console.log("An error occurred:", error.response);
    //         });
    // };

    const setCoinProps = (coin) => {
        stats.list.push(coin.name);
        coin.isEdited = false;
        coin.isAddingBuy = false;

        if (!coin.sold) {
            coin.buysValueList = [];
            coin.buysAmountList = [];

            for (let buy of coin.buys) {
                coin.buysValueList.push(buy.amount * buy.price); //250
                coin.buysAmountList.push(buy.amount); //1.25
            }

            coin.buysValue = sumArray(coin.buysValueList);
            coin.buysAmount = sumArray(coin.buysAmountList);
            coin.buysPrice =
                sumArray(coin.buysValueList) / sumArray(coin.buysAmountList);

            coin.edit = {
                buysAmount: coin.buysAmount.toFixed(4),
                buysPrice: coin.buysPrice,
                buysValue: coin.buysValue,
                sellAmount: coin.buysAmount.toFixed(4),
                sellPrice: coin.buysPrice,
                sellValue: coin.buysValue,
            };

            stats.funds.onList.push(coin.buysValue);

            if (coin.stops.min10) stats.maxLooseList.push(coin.buysValue * -0.1);
            if (coin.stops.max10) stats.maxLooseList.push(coin.buysValue * 0.1);
            if (coin.stops.max20) stats.maxLooseList.push(coin.buysValue * 0.2);
            if (coin.stops.max30) stats.maxLooseList.push(coin.buysValue * 0.3);
            stats.maxLoose = sumArray(stats.maxLooseList);
        }

        for (let gain of coin.gains) {
            stats.gains.offList.push(gain.amount);
        }
        
        coin.gains.off = sumProps(coin.gains, "amount");
    };

    const setCoinApiProps = (coin, data) => {
        if (!coin.sold) {
            coin.currentPrice = data.current_price;
            coin.percentChange24h = data.price_change_percentage_24h;
            coin.percentChange = percentChange(
                coin.buysPrice,
                coin.currentPrice
            );
            coin.gains.on = (coin.buysValue / 100) * coin.percentChange;
            // gains on
            stats.gains.onList.push(coin.gains.on);
        }
        coin.marketCapRank = data.market_cap_rank;
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
                    if (stats.list.includes(coin.id)) {
                        existingCoin = true;
                        axios
                            .get($adminUrl + '/coins?name_eq=' + coin.id, $auth)
                            .then(res => {
                                if (res !== []) {
                                    coin.existing = '☑️';
                                    post.id = res.data[0].id;

                                    axios
                                        .get($apiUrl + '/markets?vs_currency=usd&ids=' + coin.id)
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
                coins[index].stops[stopValue] = res.data.stops[stopValue];
            })
            .catch((err) => {
                error.hasError = true;
                error.update = "Put: " + err;
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
                    isAddingCoin = false;
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

    const editCoin = async (coin) => {
        datasSending = true;
        
        let index = coins.indexOf(coin),
            buysBody = [],
            sellsBody = [...coin.sells,
                {
                    amount: coin.edit.sellAmount,
                    price: coin.edit.sellPrice
                }
            ];

        // IF is not sold
        if (!computeSold(coin.edit.buysAmount, coin.edit.sellAmount)) {
            buysBody = [
                {
                    amount: coin.edit.buysAmount - coin.edit.sellAmount,
                    price: coin.edit.buysPrice,
                }
            ];
        }

        await axios
            .put(
                $adminUrl + '/coins/' + coin.id,
                {
                    sold: computeSold(
                        coin.edit.buysAmount,
                        coin.edit.sellAmount
                    ),
                    buys: buysBody,
                    sells: sellsBody,
                    gains: [
                        ...coin.gains,
                        {
                            amount: computeGains(
                                coin.edit.buysPrice,
                                coin.edit.sellPrice,
                                coin.edit.sellAmount
                            ),
                        },
                    ],
                },
                $auth
            )
            .then((res) => {
                // coins = [...coins, res.]
                coin.isEdited = false;
                datasSending = false;
                location.reload();
                // getAdminDatas();
            })
            .catch((err) => {
                error.hasError = true;
                error.update = "Put: " + err;
            });
    };

    const addBuy = async (coin) => {
        datasSending = true;
        await axios
            .put(adminUrl + '/coins/' + coin.id,
                {
                    sold: false,
                    buys: [
                        {
                            amount: coin.addBuyAmount,
                            price: coin.addBuyPrice,
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
            })
            .catch((err) => {
                error.hasError = true;
                error.update = "Put: " + err;
            });
    };

    const getCoinDetails = async (coin) => {
        datasSending = true;
        await axios
        .get($apiUrl + '/markets?vs_currency=usd&ids=' + coin.name)
        .then(res => {
            let data = res.data[0];
            console.log(data)
            detailCoin.name = coin.name;
            detailCoin.symbol = coin.symbol;
            detailCoin.image = data.image;
            detailCoin.ath = data.ath;
            detailCoin.currentPrice = data.current_price;
            detailCoin.marketCapRank = data.market_cap_rank;
            detailCoin.athPercent = percentChange(detailCoin.ath, detailCoin.currentPrice)
            datasSending = false;
            isDetailCoin = true;
        })
        .catch(err => {
            error.hasError = true;
            error.datas = 'datas:' + err.message
        })
    };

    onMount(async () => getAdminDatas());

</script>

<template>
    <!-- IS LOGGED -->
    <!-- {#if isLogged} -->
        <!-- LOADER -->
        {#if !datasLoaded || datasSending}
            <Loading />
        {/if}
        {#if datasLoaded}
            <!-- HEADER -->
            <header class="header">
                <div class="header__inner">
                    <button
                        class="button"
                        class:active={stops1}
                        on:click={() => (stops1 = !stops1)}
                    >
                        T1
                    </button>
                    <button
                        class="button"
                        class:active={stops2}
                        on:click={() => (stops2 = !stops2)}
                    >
                        T2
                    </button>
                    <button
                        class="button"
                        class:active={isShowingSoldCoins || listjsSearchValue}
                        on:click={() => {
                            // isShowingSoldCoins = !isShowingSoldCoins;
                            if (isShowingSoldCoins) {
                                listObj.search();
                                listjsSearchValue = '';
                                isShowingSoldCoins = false
                            } else {
                                isShowingSoldCoins = true;
                            }
                        }}
                    >
                        Sold
                    </button>
                    <button class="button" on:click={() => (isAddingCoin = true)}>
                        Add
                    </button>
                    <input 
                        type="search" 
                        class="form__input listjs__search" 
                        placeholder="Search"
                        bind:value={listjsSearchValue} > 
                </div>
            </header>
            <!-- MAIN -->
            <main class="main">
                <!-- STATS -->
                <div class="stats">
                    <div class="stats__col">
                        <span class={stats.gains.on >= 0 ? "pos" : "neg"}>
                            {stats.gains.on >= 0
                                ? "+"
                                : ""}{stats.gains.on.toFixed(0)}&nbsp;({stats
                                .gains.on >= 0
                                ? "+"
                                : ""}{percentChange(
                                stats.funds.on,
                                stats.funds.on + stats.gains.on
                            ).toFixed(1)}%)
                        </span>
                    </div>
                    <div class="stats__col">
                        {stats.funds.on.toFixed(0)}/{stats.funds.off.toFixed(
                            0
                        )}&nbsp;({(
                            (stats.funds.on / stats.funds.off) *
                            100
                        ).toFixed(1)}%)
                    </div>
                    <div class="stats__col">
                        <span
                            class={stats.gains.off.q1 + stats.gains.off.q2 >= 0
                                ? "pos"
                                : "neg"}
                        >
                            {stats.gains.off.q1 + stats.gains.off.q2 >= 0
                                ? "+"
                                : ""}{(stats.gains.off.q1 + stats.gains.off.q2).toFixed(
                                0
                            )}
                        </span>
                    </div>
                </div>
                <div class="stats">
                    <div class="stats__col">
                        {stats.maxLoose.toFixed(0)}&nbsp;({stats.maxLoose >= 0
                            ? "+"
                            : ""}{percentChange(
                            stats.funds.on,
                            stats.funds.on + stats.maxLoose
                        ).toFixed(1)}%)
                    </div>
                    <div class="stats__col">
                        ({stats.gains.off.q1 >= 0
                            ? "+"
                            : ""}{stats.gains.off.q1.toFixed(0)},&nbsp;{stats
                            .gains.off.q2 >= 0
                            ? "+"
                            : ""}{stats.gains.off.q2.toFixed(0)})
                    </div>
                </div>
                <!-- SORTS -->
                <div class="sorts">
                    {#if !stops1 && !stops2}
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
                    {#if !stops1 && !stops2}
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
                    <div class="sort__col sort__stop" class:collapsed={!stops1}>
                        <span>L1</span>
                    </div>
                    <div class="sort__col sort__old sort__stop" class:collapsed={!stops1}>
                        <span>T0</span>
                    </div>
                    <div class="sort__col sort__stop" class:collapsed={!stops1}>
                        <span>T1</span>
                    </div>
                    <div class="sort__col sort__stop" class:collapsed={!stops2}>
                        <span>T2</span>
                    </div>
                    <div class="sort__col sort__stop" class:collapsed={!stops2}>
                        <span>T3</span>
                    </div>
                </div>
                <!-- COINS -->
                <div class="coins list">
                    {#each coins as coin}
                        <!-- COINS NOT SOLD -->
                        {#if !coin.sold}
                            <div class="coin coin--{coin.symbol.toLowerCase()}">
                                {#if !stops1 && !stops2}
                                    <div class="coin__col coin__rank">
                                        <span>
                                            {coin.marketCapRank !== null
                                                ? coin.marketCapRank
                                                : "/"}
                                        </span>
                                    </div>
                                {/if}
                                <div
                                    class="coin__col coin__symbol"
                                    on:click={() => (coin.isEdited = true)}
                                >
                                    <span>
                                        {coin.symbol.toUpperCase()}
                                    </span>
                                </div>
                                <div 
                                    class="coin__col coin__percent"
                                    on:click={getCoinDetails(coin)}
                                >
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
                                {#if !stops1 && !stops2}
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
                                <div class="coin__col coin__stop" class:collapsed={!stops1}>
                                    <span
                                    on:click={editStops(coin, "min10")}
                                    class:selected={coin.stops &&
                                                coin.stops.min10}
                                            class:higher={coin.percentChange <
                                                -10}
                                            class:advised={coin.percentChange >
                                                -10 && coin.percentChange < 10}
                                        >
                                            {#if stops1}
                                            {fixed(coin.buysPrice * 0.9)}
                                            {:else}
                                            &nbsp;
                                            {/if}
                                        </span>
                                    </div>
                                <div class="coin__col coin__old coin__stop" class:collapsed={!stops1}>
                                    <span
                                        on:click={editStops(coin, "max0")}
                                        class:selected={coin.stops &&
                                            coin.stops.max0}
                                        class:higher={coin.percentChange < 0}
                                        class:advised={coin.percentChange >=
                                            10 && coin.percentChange < 20}
                                    >
                                        {#if stops1}
                                        {fixed(coin.buysPrice)}
                                        {:else}
                                        &nbsp;
                                        {/if}
                                    </span>
                                </div>
                                    <div class="coin__col coin__stop" class:collapsed={!stops1}>
                                        <span
                                            on:click={editStops(coin, "max10")}
                                            class:selected={coin.stops &&
                                                coin.stops.max10}
                                            class:higher={coin.percentChange <
                                                10}
                                            class:advised={coin.percentChange >=
                                                20 && coin.percentChange < 30}
                                        >
                                        {#if stops1}
                                        {fixed(coin.buysPrice * 1.1)}
                                        {:else}
                                        &nbsp;
                                        {/if}
                                        </span>
                                    </div>
                                    <div class="coin__col coin__stop" class:collapsed={!stops2}>
                                        <span
                                        on:click={editStops(coin, "max20")}
                                        class:selected={coin.stops &&
                                            coin.stops.max20}
                                            class:higher={coin.percentChange <
                                                20}
                                            class:advised={coin.percentChange >=
                                                30 && coin.percentChange     < 40}
                                        >
                                        {#if stops2}
                                        {fixed(coin.buysPrice * 1.2)}
                                        {:else}
                                        &nbsp;
                                        {/if}
                                        </span>
                                    </div>
                                    <div class="coin__col coin__stop" class:collapsed={!stops2}>
                                        <span
                                            on:click={editStops(coin, "max30")}
                                            class:selected={coin.stops &&
                                                coin.stops.max30}
                                            class:higher={coin.percentChange <
                                                30}
                                            class:advised={coin.percentChange >=
                                                40 && coin.percentChange < 50}
                                        >
                                        {#if stops2}
                                        {fixed(coin.buysPrice * 1.3)}
                                        {:else}
                                        &nbsp;
                                        {/if}
                                        </span>
                                    </div>

                                <!-- COIN EDIT -->
                                {#if coin.isEdited}
                                    <div class="form form--edit-coin">
                                        <div class="form__section">
                                            <!-- General -->
                                            <div class="form__row">
                                                <div class="form__col col-4">
                                                    <label
                                                        for="coin-symbol"
                                                        class="form__label"
                                                    >
                                                        Symbol
                                                    </label>
                                                    <input
                                                        id="coin-symbol"
                                                        class="form__input"
                                                        value={coin.symbol.toUpperCase()}
                                                        type="text"
                                                    />
                                                </div>
                                                <div class="form__col col-8">
                                                    <label
                                                        for="coin-name"
                                                        class="form__label"
                                                        >Name</label
                                                    >
                                                    <input
                                                        id="coin-name"
                                                        class="form__input"
                                                        value={coin.name}
                                                        type="text"
                                                    />
                                                </div>
                                            </div>
                                            <!-- Buy -->
                                            <div class="form__row">
                                                <div class="form__col col-4">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Buys amount
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        bind:value={coin.edit
                                                            .buysAmount}
                                                    />
                                                </div>
                                                <div class="form__col col-5">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Buys price
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        bind:value={coin.edit
                                                            .buysPrice}
                                                    />
                                                </div>
                                                <div class="form__col col-3">
                                                    <label
                                                        class="form__label"
                                                        for=""
                                                    >
                                                        Buys value
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        readonly
                                                        value={coin.edit
                                                            .buysAmount &&
                                                        coin.buysPrice
                                                            ? (coin.edit
                                                                  .buysAmount *
                                                              coin.edit
                                                                  .buysPrice).toFixed(2)
                                                            : 0}
                                                    />
                                                </div>
                                            </div>
                                            <!-- Sell -->
                                            <div class="form__row">
                                                <div class="form__col col-4" style="position:relative;">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Sell amount
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        bind:value={coin.edit
                                                            .sellAmount}
                                                    />
                                                    <button
                                                        class="form__btn form__btn--inline"
                                                        on:click={() => coin.edit.sellAmount = coin.edit.sellAmount / 2}
                                                        >1/2</button>
                                                </div>
                                                <div class="form__col col-5">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Sell price
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        bind:value={coin.edit
                                                            .sellPrice}
                                                    />
                                                </div>
                                                <div class="form__col col-3">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                        >Sell value</label
                                                    >
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        readonly
                                                        value={coin.edit
                                                            .sellAmount &&
                                                        coin.edit.sellPrice
                                                            ? (coin.edit
                                                                  .sellAmount *
                                                              coin.edit
                                                                  .sellPrice).toFixed(2)
                                                            : 0}
                                                    />
                                                </div>
                                            </div>
                                            <!-- Remaining + gains-->
                                            <div class="form__row">
                                                <div class="form__col col-4">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Remaining
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        readonly
                                                        value={computeAmount(
                                                            coin.edit
                                                                .buysAmount,
                                                            coin.edit.sellAmount
                                                        )}
                                                    />
                                                </div>
                                                <div class="form__col col-5">
                                                    <label
                                                        for="coin-gain"
                                                        class="form__label"
                                                    >
                                                        Gain
                                                    </label>
                                                    <input
                                                        id="coin-gain"
                                                        class="form__input"
                                                        type="number"
                                                        readonly
                                                        value={computeGains(
                                                            coin.edit.buysPrice,
                                                            coin.edit.sellPrice,
                                                            coin.edit.sellAmount
                                                        )}
                                                    />
                                                </div>
                                                <div class="form__col col-3">
                                                    <label
                                                        class="checkbox"
                                                        for="coin-sold"
                                                    >
                                                        <div
                                                            class="checkbox__label form__label"
                                                        >
                                                            Sold
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            id="coin-sold"
                                                            class="checkbox__input"
                                                            readonly
                                                            checked={computeSold(
                                                                coin.edit
                                                                    .buysAmount,
                                                                coin.edit
                                                                    .sellAmount
                                                            )}
                                                        />
                                                        <div
                                                            class="checkbox__mark"
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <!-- Submit or cancel -->
                                            <div
                                                class="form__row form__row--no-border"
                                            >
                                                <div
                                                    class="form__col col-6 col-md-8"
                                                >
                                                    <input
                                                        class="form__btn form__submit"
                                                        type="submit"
                                                        value="Submit"
                                                        on:click={editCoin(
                                                            coin
                                                        )}
                                                    />
                                                </div>
                                                <div
                                                    class="form__col col-6 col-md-4"
                                                >
                                                    <button
                                                        class="form__btn form__cancel"
                                                        on:click={() =>
                                                            (coin.isEdited = false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                        <!-- COINS SOLD -->
                        {#if coin.sold}
                            <div
                                class="coin coin--{coin.symbol.toLowerCase()} coin--sold"
                                class:hidden={!isShowingSoldCoins && !listjsSearchValue}
                            >
                                {#if !stops1}
                                    <div class="coin__col coin__rank">
                                        {coin.marketCapRank !== null
                                            ? coin.marketCapRank
                                            : "/"}
                                    </div>
                                {/if}
                                <div
                                    class="coin__col coin__symbol"
                                    on:click={() => (coin.isAddingBuy = true)}
                                >
                                    {coin.symbol.toUpperCase()}
                                </div>
                                <div class="coin__col coin__percent" />
                                <div class="coin__col coin__percent24h" />
                                <div class="coin__col coin__gain">
                                    <span style="display: none"
                                        >{coin.gains.off + 100}</span
                                    >
                                    {coin.gains.off.toFixed(0)}
                                </div>
                                {#if coin.isAddingBuy}
                                    <div class="form form--add-buy">
                                        <div class="form__section">
                                            <!-- Buy -->
                                            <div class="form__row">
                                                <div class="form__col col-4">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Buy amount
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        bind:value={coin.addBuyAmount}
                                                    />
                                                </div>
                                                <div class="form__col col-4">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Buy price
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        bind:value={coin.addBuyPrice}
                                                    />
                                                </div>
                                                <div class="form__col col-4">
                                                    <label
                                                        class="form__label"
                                                        for="">Buys value</label
                                                    >
                                                    <input
                                                        class="form__input"
                                                        type="number"
                                                        readonly
                                                        value={coin.addBuyAmount &&
                                                        coin.addBuyPrice
                                                            ? coin.addBuyAmount *
                                                                coin.addBuyPrice
                                                            : 0}
                                                    />
                                                </div>
                                            </div>
                                            <!-- Submit -->
                                            <div
                                                class="form__row form__row--no-border"
                                            >
                                                <div
                                                    class="form__col col-6 col-md-8"
                                                >
                                                    <input
                                                        class="form__btn form__submit"
                                                        type="submit"
                                                        value="Submit"
                                                        on:click={addBuy(coin)}
                                                    />
                                                </div>
                                                <div
                                                    class="form__col col-6 col-md-4"
                                                >
                                                    <button
                                                        class="form__btn form__cancel"
                                                        on:click={() =>
                                                            (coin.isAddingBuy = false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    {/each}
                </div>
                <!-- COIN DETAILS -->
                {#if isDetailCoin}
                <div class="detail">
                    <div class="detail__section">
                        <button class="button" on:click={() => isDetailCoin = false}>Close</button>
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
                {/if}
            </main>
            <!-- ADD COIN -->
            {#if isAddingCoin}
                <div class="form form--add-coin">
                    <div class="form__section">
                        <div class="form__row">
                            <div
                                class="form__col col-5"
                                style="position:relative;"
                            >
                                <label
                                    for="add-coin-symbol"
                                    class="form__label"
                                >
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
                                    on:click={searchCoin(post.symbol)}
                                    >Search</button
                                >
                            </div>
                            <div class="form__col col-7">
                                <label for="add-coin-name" class="form__label"
                                    >Name</label
                                >
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
                                        <div class="search-coin" on:click={() =>
                                                    (post.name = coin.id)}>
                                            <div class="search-coin__col search-coin__existing">
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
                                                    : "/"}
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
                                <label for="" class="form__label"
                                    >Buy value</label
                                >
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
                                    on:click={() => (isAddingCoin = false)}
                                    >Cancel</button
                                >
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        {/if}
    <!-- {/if} -->

    <!-- ERRORS -->
    <!-- {#if error.hasError}
        {error.admin ? error.admin : ""}
        {error.datas ? error.datas : ""}
        {error.update ? error.update : ""}
        {error.post ? error.post : ""}
    {/if} -->
</template>
