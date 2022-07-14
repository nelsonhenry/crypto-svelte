<script>
    import {
        stops1, 
        stops2,
        listjsSearchValue,
        isShowingSoldCoins,
        isAddingCoin,
        listObj
    } from '../stores'
</script>
<template>
    <header class="header">
        <div class="header__inner">
            <button
                class="button"
                class:active={$stops1}
                on:click={() => ($stops1 = !$stops1)}
            >
                T1
            </button>
            <button
                class="button"
                class:active={$stops2}
                on:click={() => ($stops2 = !$stops2)}
            >
                T2
            </button>
            <button
                class="button"
                class:active={$isShowingSoldCoins || $listjsSearchValue}
                on:click={() => {
                    if ($isShowingSoldCoins) {
                        $listObj.search();
                        $listjsSearchValue = '';
                        $isShowingSoldCoins = false
                    } else {
                        $isShowingSoldCoins = true;
                    }
                }}
            >
                Sold
            </button>
            <button class="button" on:click={() => ($isAddingCoin = true)}>
                Add
            </button>
            <input 
                type="search" 
                class="form__input listjs__search" 
                placeholder="Search"
                bind:value={$listjsSearchValue} > 
        </div>
    </header>
</template>
<style lang='scss'>
</style>