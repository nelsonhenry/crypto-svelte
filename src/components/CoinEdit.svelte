<script>
    import axios from 'axios'
    import { beforeUpdate } from "svelte";
    
    import {
        computeAmount, 
        computeGains, 
        computeSold
    } from '../helpers'

    import {
        adminUrl,
        auth,
        error,
    } from '../stores'

    export let coin;

    let datasSending, edit;
    
    const editCoin = async (coin) => {
        datasSending = true;

        let buysBody = []

        let sellsBody = [...coin.sells,
                {
                    amount: edit.sellAmount,
                    price: edit.sellPrice
                }
            ];

        // IF is not sold
        if (!computeSold(edit.buysAmount, edit.sellAmount)) {
            buysBody = [
                {
                    amount: edit.buysAmount - edit.sellAmount,
                    price: edit.buysPrice,
                }
            ];
        }

        await axios.put($adminUrl + '/coins/' + coin.id,
                {
                    sold: computeSold(
                        edit.buysAmount,
                        edit.sellAmount
                    ),
                    buys: buysBody,
                    sells: sellsBody,
                    gains: [
                        ...coin.gains,
                        {
                            amount: computeGains(
                                edit.buysPrice,
                                edit.sellPrice,
                                edit.sellAmount
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
                $error.hasError = true;
                $error.update = "Put: " + err;
            });
    };

    beforeUpdate(async () => {
        edit = {
            buysAmount: coin.buysAmount.toFixed(4),
            buysPrice: coin.buysPrice,
            buysValue: coin.buysValue,
            sellAmount: coin.buysAmount.toFixed(4),
            sellPrice: coin.buysPrice,
            sellValue: coin.buysValue,
        };
    });
</script>

<template>
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
                        bind:value={edit.buysAmount}
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
                        bind:value={edit.buysPrice}
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
                        value={edit.buysAmount && edit.buysPrice ? (edit.buysAmount * edit.buysPrice).toFixed(2) : 0}
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
                        bind:value={edit.sellAmount}
                    />
                    <button
                        class="form__btn form__btn--inline"
                        on:click={() => edit.sellAmount = edit.sellAmount / 2}
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
                        bind:value={edit.sellPrice}
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
                        value={edit.sellAmount && edit.sellPrice ? (edit.sellAmount * edit.sellPrice).toFixed(2) : 0}
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
                            edit.buysAmount,
                            edit.sellAmount
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
                            edit.buysPrice,
                            edit.sellPrice,
                            edit.sellAmount
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
                                edit.buysAmount,
                                edit.sellAmount
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
                        on:click={editCoin(coin)}
                    />
                </div>
                <div
                    class="form__col col-6 col-md-4"
                >
                    <button
                        class="form__btn form__cancel"
                        on:click={() => coin.isEdited = false}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
</style>
