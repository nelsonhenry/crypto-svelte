import { readable, writable } from "svelte/store";

export const adminUrl = readable("https://crypto-svelte.herokuapp.com");
export const apiUrl = readable("https://api.coingecko.com/api/v3/coins");
export let isLoading = writable(false);
export let isLogged = writable(false);
export let auth = writable();