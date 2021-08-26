import { readable, writable } from "svelte/store";

export const baseUrl = readable("https://crypto-svelte.herokuapp.com");
export const auth = writable();