<script>
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
</template>
<style lang='scss'>
</style>