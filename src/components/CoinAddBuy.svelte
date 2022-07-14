<script>
    import axios from 'axios'
    import { beforeUpdate } from "svelte";

    import {
        adminUrl,
        auth,
    } from '../stores'

    export let coin;

    let datasSending = false,
        add = {
        buyAmount: 0,
        buyPrice: 0,
    };
        
    const addBuy = async (coin) => {
        datasSending = true;
        const res = await axios.put($adminUrl + '/coins/' + coin.id,
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
        );
        coin.isAddingBuy = false
        datasSending = false;
        location.reload();
    };

    beforeUpdate(async () => {
        // console.log(coin);
    });
</script>
<template>
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
                        bind:value={add.buyAmount}
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
                        bind:value={add.buyPrice}
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
                        value={add.buyAmount && add.buyPrice ? add.buyAmount * add.buyPrice : 0}
                    />
                </div>
            </div>
            <!-- Submit -->
            <div class="form__row form__row--no-border">
                <div class="form__col col-6 col-md-8">
                    <input
                        class="form__btn form__submit"
                        type="submit"
                        value="Submit"
                        on:click={addBuy(coin)}
                    />
                </div>
                <div class="form__col col-6 col-md-4">
                    <button
                        class="form__btn form__cancel"
                        on:click={() => coin.isAddingBuy = false}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang='scss'>
</style>