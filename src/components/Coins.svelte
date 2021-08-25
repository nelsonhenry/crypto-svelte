<script>
    import Loading from "./Loading.svelte";
    import axios from "axios";
    import List from "list.js";
    import {
        percentChange,
        fixed,
        sumArray,
        sumProps,
        computeGains,
        computeAmount,
        computeSold,
        smallImg,
    } from "../js/helpers";

    let baseUrl = "https://crypto-svelte.herokuapp.com",
        isLogged = false,
        loginEmail,
        loginPw,
        coins = [],
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
        isAddingCoin = false,
        isShowingSoldCoins = false,
        searchCoins = [],
        error = {
            hasError: false,
        },
        auth;

    const resetVars = () => {
        coins = [];
        post = {};
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
        };
        datas = [];
        listObj;
        datasLoaded = false;
        isSearchDatasLoaded = undefined;
        isAddingCoin = false;
        isShowingSoldCoins = false;
        searchCoins = [];
        error = {
            hasError: false,
        };
    };

    const getAdminDatas = async () => {
        await axios
            .get(`${baseUrl}/coins`, auth)
            .then((res) => {
                coins = res.data;
                for (let coin of coins) {
                    setCoinProps(coin);
                }

                // get coingecko datas
                axios
                    .get(
                        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${stats.list.join(
                            ","
                        )}`
                    )
                    .then((res) => {
                        datas = res.data;
                        Object.entries(datas).forEach((el) => {
                            let data = el[1];
                            let coin = coins.find(
                                (coin) => coin.name === data.id
                            );
                            setCoinApiProps(coin, data);
                        });

                        stats.funds.off = 18670;
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
                            // searchColumns: 'coin__symbol'
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

    const checkIfLogged = async () => {
        if (sessionStorage.getItem("auth")) {
            isLogged = true;
            auth = {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem("auth")}`,
                },
            };
            await getAdminDatas();
        }
    };

    checkIfLogged();

    const login = async () => {
        await axios
            .post(`${baseUrl}/auth/local`, {
                identifier: loginEmail,
                password: loginPw,
            })
            .then((res) => {
                loginEmail = "";
                loginPw = "";
                sessionStorage.setItem("auth", res.data.jwt);
                auth = {
                    headers: {
                        Authorization: `Bearer ${res.data.jwt}`,
                    },
                };
                isLogged = true;
                getAdminDatas();
            })
            .catch((error) => {
                console.log("An error occurred:", error.response);
            });
    };

    const setCoinProps = (coin) => {
        // list
        stats.list.push(coin.name);

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
                buysAmount: coin.buysAmount,
                buysPrice: coin.buysPrice,
                buysValue: coin.buysValue,
                sellAmount: coin.buysAmount,
                sellPrice: coin.buysPrice,
                sellValue: coin.buysValue,
            };

            stats.funds.onList.push(coin.buysValue);

            if (coin.stops.min10)
                stats.maxLooseList.push(coin.buysValue * -0.1);
            if (coin.stops.max10) stats.maxLooseList.push(coin.buysValue * 0.1);
            if (coin.stops.max20) stats.maxLooseList.push(coin.buysValue * 0.2);
            if (coin.stops.max30) stats.maxLooseList.push(coin.buysValue * 0.3);
            stats.maxLoose = sumArray(stats.maxLooseList);
        }

        // gains off + stats gains off
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
        coin.isEdited = false;
        coin.isAddingBuy = false;
    };

    const searchCoin = async () => {
        if (!post.symbol) return;
        searchCoins = [];
        isSearchDatasLoaded = false;
        await axios
            .get(`https://api.coingecko.com/api/v3/coins/list`)
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
                            .get(`${baseUrl}/coins?name_eq=${coin.id}`, auth)
                            .then(res => {
                                if (res !== []) {
                                    coin.marketCapRank = '✔';
                                    post.id = res.data[0].id;
                                    isSearchDatasLoaded = true;
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
                        .get(
                            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin.id}`
                        )
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
            .put(
                `${baseUrl}/coins/${coin.id}`,
                {
                    stops: {
                        ...coin.stops,
                        [stopValue]: coin.stops[stopValue] ? false : true,
                    },
                },
                auth
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
                .get(`${baseUrl}/coins/${post.id}`, auth)
                .then((res) => {
                    let coin = res.data;
                    axios.put(
                        `${baseUrl}/coins/${coin.id}`,
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
                        auth
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
                    `${baseUrl}/coins`,
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
                    auth
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
                `${baseUrl}/coins/${coin.id}`,
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
                auth
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
            .put(
                `${baseUrl}/coins/${coin.id}`,
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
                auth
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
    };
</script>

<template>
    <!-- IS NOT LOGGED -->
    {#if !isLogged}
        <div class="form form--login">
            <div class="form__section">
                <div class="form__row">
                    <div class="form__col col-12">
                        <label for="login-email" class="form__label">
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            class="form__input"
                            bind:value={loginEmail}
                        />
                    </div>
                    <div class="form__col col-12">
                        <label for="login-pw" class="form__label">
                            Password
                        </label>
                        <input
                            id="login-pw"
                            type="password"
                            class="form__input"
                            bind:value={loginPw}
                        />
                    </div>
                </div>
                <div class="form__row form__row--no-border">
                    <div class="form__col col-12">
                        <input
                            type="submit"
                            value="Login"
                            class="form__btn form__submit"
                            on:click={login}
                        />
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- IS LOGGED -->
    {#if isLogged}
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
                        -10 +10
                    </button>
                    <button
                        class="button"
                        class:active={stops2}
                        on:click={() => (stops2 = !stops2)}
                    >
                        +20 +30
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
                                : "-"}
                            {(stats.gains.off.q1 + stats.gains.off.q2).toFixed(
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
                        [{stats.gains.off.q1 >= 0
                            ? "+"
                            : ""}{stats.gains.off.q1.toFixed(0)},&nbsp;{stats
                            .gains.off.q2 >= 0
                            ? "+"
                            : ""}{stats.gains.off.q2.toFixed(0)}]
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
                        <span>24h</span>
                    </div>
                    <div
                        class="sort__col sort__gain sort"
                        data-sort="coin__gain"
                    >
                        <span>Gain</span>
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
                    {#if stops1}
                        <div class="sort__col sort__stop">
                            <span>-10</span>
                        </div>
                    {/if}
                    <div class="sort__col sort__old sort__stop">
                        <span>+0</span>
                    </div>
                    {#if stops1}
                        <div class="sort__col sort__stop">
                            <span>+10</span>
                        </div>
                    {/if}
                    {#if stops2}
                        <div class="sort__col sort__stop">
                            <span>+20</span>
                        </div>
                        <div class="sort__col sort__stop">
                            <span>+30</span>
                        </div>
                    {/if}
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
                                    <span>{coin.symbol.toUpperCase()}</span>
                                </div>
                                <div class="coin__col coin__percent">
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
                                        {coin.percentChange.toFixed(1)}
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
                                        {coin.percentChange24h.toFixed(1)}
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
                                            {coin.buysValue.toFixed(0)}
                                        </span>
                                    </div>
                                {/if}
                                <div class="coin__col coin__now">
                                    <span>
                                        {fixed(coin.currentPrice)}
                                    </span>
                                </div>
                                {#if stops1}
                                    <div class="coin__col coin__stop">
                                        <span
                                            on:click={editStops(coin, "min10")}
                                            class:selected={coin.stops &&
                                                coin.stops.min10}
                                            class:higher={coin.percentChange <
                                                -10}
                                            class:advised={coin.percentChange >
                                                -10 && coin.percentChange < 10}
                                        >
                                            {fixed(coin.buysPrice * 0.9)}
                                        </span>
                                    </div>
                                {/if}
                                <div class="coin__col coin__old coin__stop">
                                    <span
                                        on:click={editStops(coin, "max0")}
                                        class:selected={coin.stops &&
                                            coin.stops.max0}
                                        class:higher={coin.percentChange < 0}
                                        class:advised={coin.percentChange >=
                                            10 && coin.percentChange < 20}
                                    >
                                        {fixed(coin.buysPrice)}
                                    </span>
                                </div>
                                {#if stops1}
                                    <div class="coin__col coin__stop">
                                        <span
                                            on:click={editStops(coin, "max10")}
                                            class:selected={coin.stops &&
                                                coin.stops.max10}
                                            class:higher={coin.percentChange <
                                                10}
                                            class:advised={coin.percentChange >=
                                                20 && coin.percentChange < 30}
                                        >
                                            {fixed(coin.buysPrice * 1.1)}
                                        </span>
                                    </div>
                                {/if}
                                {#if stops2}
                                    <div class="coin__col coin__stop">
                                        <span
                                            on:click={editStops(coin, "max20")}
                                            class:selected={coin.stops &&
                                                coin.stops.max20}
                                            class:higher={coin.percentChange <
                                                20}
                                            class:advised={coin.percentChange >=
                                                30 && coin.percentChange < 40}
                                        >
                                            {fixed(coin.buysPrice * 1.2)}
                                        </span>
                                    </div>
                                    <div class="coin__col coin__stop">
                                        <span
                                            on:click={editStops(coin, "max30")}
                                            class:selected={coin.stops &&
                                                coin.stops.max30}
                                            class:higher={coin.percentChange <
                                                30}
                                            class:advised={coin.percentChange >=
                                                40 && coin.percentChange < 50}
                                        >
                                            {fixed(coin.buysPrice * 1.3)}
                                        </span>
                                    </div>
                                {/if}

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
                                                        value={coin.symbol}
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
                                                        type="text"
                                                        bind:value={coin.edit
                                                            .buysAmount}
                                                    />
                                                </div>
                                                <div class="form__col col-4">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Buys price
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="text"
                                                        bind:value={coin.edit
                                                            .buysPrice}
                                                    />
                                                </div>
                                                <div class="form__col col-4">
                                                    <label
                                                        class="form__label"
                                                        for=""
                                                    >
                                                        Buys value
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="text"
                                                        readonly
                                                        value={coin.edit
                                                            .buysAmount &&
                                                        coin.buysPrice
                                                            ? coin.edit
                                                                  .buysAmount *
                                                              coin.edit
                                                                  .buysPrice
                                                            : 0}
                                                    />
                                                </div>
                                            </div>
                                            <!-- Sell -->
                                            <div class="form__row">
                                                <div class="form__col col-4">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Sell amount
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="text"
                                                        bind:value={coin.edit
                                                            .sellAmount}
                                                    />
                                                </div>
                                                <div class="form__col col-4">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                    >
                                                        Sell price
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="text"
                                                        bind:value={coin.edit
                                                            .sellPrice}
                                                    />
                                                </div>
                                                <div class="form__col col-4">
                                                    <label
                                                        for=""
                                                        class="form__label"
                                                        >Sell value</label
                                                    >
                                                    <input
                                                        class="form__input"
                                                        type="text"
                                                        readonly
                                                        value={coin.edit
                                                            .sellAmount &&
                                                        coin.edit.sellPrice
                                                            ? coin.edit
                                                                  .sellAmount *
                                                              coin.edit
                                                                  .sellPrice
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
                                                        Remaining amount
                                                    </label>
                                                    <input
                                                        class="form__input"
                                                        type="text"
                                                        readonly
                                                        value={computeAmount(
                                                            coin.edit
                                                                .buysAmount,
                                                            coin.edit.sellAmount
                                                        )}
                                                    />
                                                </div>
                                                <div class="form__col col-4">
                                                    <label
                                                        for="coin-gain"
                                                        class="form__label"
                                                    >
                                                        Gain
                                                    </label>
                                                    <input
                                                        id="coin-gain"
                                                        class="form__input"
                                                        type="text"
                                                        readonly
                                                        value={computeGains(
                                                            coin.edit.buysPrice,
                                                            coin.edit.sellPrice,
                                                            coin.edit.sellAmount
                                                        )}
                                                    />
                                                </div>
                                                <div class="form__col col-4">
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
                                                        type="text"
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
                                                        type="text"
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
                                                        type="text"
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
            </main>
            <!-- ADD COIN -->
            {#if isAddingCoin}
                <div class="form form--add-coin">
                    <div class="form__section">
                        <div class="form__row">
                            <div
                                class="form__col col-6 col-md-4"
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
                                    style="position: absolute; right: 0; bottom: 0; width: auto;"
                                    on:click={searchCoin(post.symbol)}
                                    >Search</button
                                >
                            </div>
                            <div class="form__col col-6 col-md-8">
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
                            {#if isSearchDatasLoaded}
                                <div class="form__col col-12">
                                    <div class="search-coins">
                                        {#each searchCoins as coin}
                                            <div class="search-coin">
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
                                                    on:click={() =>
                                                        (post.name = coin.id)}
                                                >
                                                    {coin.id}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {:else if isSearchDatasLoaded === false}
                                <Loading />
                            {/if}
                        </div>
                        <div class="form__row">
                            <div class="form__col col-4">
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
                            <div class="form__col col-4">
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
    {/if}

    <!-- ERRORS -->
    {#if error.hasError}
        {error.admin ? error.admin : ""}
        {error.datas ? error.datas : ""}
        {error.update ? error.update : ""}
        {error.post ? error.post : ""}
    {/if}
</template>

<style lang="scss">
    @import "../styles/_include-media";

    $breakpoints: (
        xxs: 320px,
        xs: 480px,
        sm: 768px,
        md: 1024px,
        lg: 1280px,
        xl: 1440px,
        xxl: 1920px,
    );

    .form {
        position: fixed;
        z-index: 11;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        overflow-y: auto;
        background: var(--bg);
        display: flex;
        &__section {
            width: 100%;
            margin: auto;
            max-width: calc(var(--max-width) + 2rem);
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 3rem 1.5rem;
        }
        &__row {
            // background: var(--bg2);
            // padding: 1.5rem;
            // border-radius: 0.25rem;
            // border: 1px solid var(--bg3);
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 1.5rem;
            &--no-border {
                padding: 0;
                border-radius: 0;
                background: none;
                border: none;
            }
        }
        &__label {
            display: block;
            font-size: 0.875rem;
            // text-transform: uppercase;
            color: var(--comment);
            margin-bottom: 0.75rem;
        }
        &__input {
            width: 100%;
            // border: 1px solid var(--bg3);
            border: 1px solid var(--bd);
            border-radius: 0.25rem;
            // line-height: 1.5;
            padding: 0.75rem;
            background: var(--bg);
            &:focus {
                outline: none;
                border: 1px solid var(--bd);
                background: var(--bg2);
            }
        }
        &__btn {
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 0.25rem;
            border: 1px solid var(--bd);
            &:hover {
                @media(hover: hover) {
                    cursor: pointer;
                    background: var(--bg3);
                }
            }
        }
        &__btn--inline {
            padding: 0.25rem 0.75rem;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            border: none;
            // background: var(--bg3);
            background: none;
            &:hover {
                @media(hover: hover) {
                    background: none;
                }
            }
        }
        &__submit {
            background: var(--bg2);
        }
    }

    .form--login .form__section {
        max-width: calc(400px + 2rem);
    }

    .checkbox {
        display: block;
        position: relative;
        top: 2rem;
        height: calc(2.5rem + 2px);
        user-select: none;
        &:hover {
            @media(hover: hover) {
                cursor: pointer;
            }
        }
        &__label {
            position: absolute;
            top: -2rem;
            left: 0;
        }
        &__input {
            position: absolute;
            opacity: 0;
            height: 0;
            width: 0;
        }
        &__mark {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            &:after {
                content: "No";
                position: absolute;
                left: 0;
                bottom: 0;
                padding: 0.75rem;
                width: 100%;
                border: 1px solid var(--bd);
                border-radius: 0.25rem;
            }
        }
        &__input:checked ~ &__mark:after {
            content: "Yes";
        }
    }

    .hidden {
        display: none !important;
    }

    .header {
        position: fixed;
        z-index: 10;
        width: 100%;
        left: 0;
        bottom: 0;
        &__inner {
            max-width: calc(var(--max-width) + 1rem);
            margin: 0 auto;
            padding: 1rem 0.5rem;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            gap: 1rem;
        }
        .button {
            white-space: nowrap;
        }
        .listjs__search {
            padding: 0.5rem 0.75rem;
        }
    }

    .main {
        max-width: calc(var(--max-width) + 1rem);
        margin: 0 auto;
        margin-bottom: 5rem;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
    }

    .sorts {
        position: sticky;
        top: 0;
        background: var(--bg);
        padding: 0.75rem 0.25rem;
        display: flex;
        gap: 0.5ch;
        @media (min-width: 640px) {
            gap: 1ch;
        }
    }

    .sort {
        span {
            &:hover {
                @media(hover: hover) {
                    cursor: pointer;
                        background: var(--bg3);
                }
            }
        }
        &__col {
            flex: none;
            text-align: right;
            text-transform: uppercase;
            &.asc,
            &.desc {
                span {
                    background: var(--bg3);
                }
            }
        }
    }

    .coins {
        list-style: none;
        display: flex;
        flex-direction: column;
        border-top: 1px dotted var(--bd);
        border-bottom: 1px dotted var(--bd);
    }

    .coin {
        padding: 4px 0.25rem;
        display: flex;
        border-top: 1px dotted var(--bd);
        gap: 0.5ch;
        order: 0 !important;
        @media (min-width: 640px) {
            gap: 1ch;
        }

        &__col {
            flex: 1;
            text-align: right;
            &.hidden {
                display: none;
            }
            span {
                &.pos {
                    color: var(--green);
                    &.tp {
                        background: var(--darkgreen);
                    }
                    &.tp20 {
                        border-color: var(--midgreen);
                    }
                    &.tp30 {
                        border-color: var(--green);
                    }
                }
                &.neg {
                    color: var(--red);
                    &.stop {
                        background: var(--darkred);
                    }
                }
                &.selected {
                    color: var(--blue);
                    background: var(--darkblue);
                }
                &.higher {
                    color: var(--comment);
                    pointer-events: none;
                }
                &.selected.higher {
                    color: var(--red);
                    background: var(--darkred);
                    text-decoration: line-through;
                    pointer-events: all;
                }
                &.advised:not(.selected):not(.higher) {
                    background: var(--bg2);
                }
            }
        }

        &__stop:not(.higher),
        &__symbol {
            span {
                &:hover {
                    @media(hover: hover) {
                        cursor: pointer;
                        color: var(--fg);
                        background: var(--bg3);
                    }
                }
            }
        }
        &--btc,
        &--eth {
            border-top: none;
            order: -2 !important;
        }
    }

    .coin,
    .sort {
        &__image {
            width: 1.25rem;
            min-width: 1.25rem;
            flex: none;
        }
        &__col {
            span {
                padding: 1px 0.25rem;
                margin-right: -0.25rem;
                border-radius: 0.25rem;
                border: 1px solid transparent;
            }
        }
        &__rank,
        &__symbol {
            text-align: left;
            span {
                margin-right: 0;
                margin-left: -0.25rem;
            }
        }
        &__rank {
            flex: none;
            min-width: 4ch;
            width: 4ch;
        }
        &__gain,
        &__bet {
            flex: none;
            min-width: 5ch;
            width: 5ch;
        }
        &__symbol,
        &__percent,
        &__percent24h {
            flex: none;
            min-width: 6ch;
            width: 6ch;
        }
        &__now,
        &__old,
        &__stop {
            flex: 1;
            min-width: 5ch;
            width: 5ch;
        }
    }

    .search-coins {
        list-style: none;
        display: flex;
        flex-direction: column;
        width: 100%;

        .search-coin {
            padding: 0.75rem 0;
            display: flex;
            gap: 0.5ch;
            order: 0 !important;
            &:not(:last-child) {
                border-bottom: 1px dotted var(--bd);
            }
            @media (min-width: 640px) {
                gap: 1ch;
            }

            &__image {
                width: 1.25rem;
                min-width: 1.25rem;
                flex: none;
                height: 1.25rem;
                img {
                    height: 100%;
                }
            }

            &__rank {
                flex: none;
                width: 5ch;
                min-width: 5ch;
            }

            &__symbol {
                flex: none;
                width: 6ch;
                min-width: 6ch;
            }

            &__name {
                &:hover {
                    @media(hover: hover) {
                        cursor: pointer;
                        color: var(--comment);
                    }
                }
            }
        }
    }

    .button {
        border: none;
        padding: 0.5rem 0.75rem;
        border-radius: 0.25rem;
        background: var(--bg2);
        border: 1px solid var(--bd);
        &:hover {
            @media(hover: hover) {
                cursor: pointer;
                background: var(--bg3);
            }
        }
        &.active {
            color: var(--blue);
            border-color: var(--midblue);
            background: var(--darkblue);
        }
    }

    .stats {
        width: 100%;
        display: flex;
        justify-content: space-between;
        padding: 0 0.25rem;
        & + & {
            margin-top: 0.5rem;
        }
        &__col {
            white-space: nowrap;
            span {
                padding: 1px 0.25rem;
                margin-right: -0.25rem;
                border-radius: 0.25rem;
                border: 1px solid transparent;
                &.pos {
                    color: var(--green);
                    background: var(--darkgreen);
                }
                &.neg {
                    color: var(--red);
                    background: var(--darkred);
                }
            }
        }
    }
</style>
