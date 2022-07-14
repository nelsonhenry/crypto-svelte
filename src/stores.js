import { readable, writable } from "svelte/store";

export const adminUrl = readable("https://crypto-svelte.herokuapp.com");
export const apiUrl = readable("https://api.coingecko.com/api/v3/coins");
export let coins = writable([]);
export let isLoading = writable(false);
export let isLogged = writable(false);
export let auth = writable();
export let stops1 = writable(false);
export let stops2 = writable(false);
export let isShowingSoldCoins = writable(false);
export let isAddingCoin = writable(false);
export let isDetailCoin = writable(false);
export let listObj = writable();
export let listjsSearchValue = writable();
export let stats = writable({
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
});
export let error = writable({
    hasError: false,
});