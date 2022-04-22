import { readable, writable } from "svelte/store";

export const adminUrl = readable("https://crypto-svelte.herokuapp.com");
export const loginToken = writable();
export const auth = writable();