<script>
    let isLogged = false,
        loginEmail,
        loginPw,
        login = () => console.log(test);
</script>

<template lang="pug">
if (!isLogged)
    .form.form--login
        .form__section
            .form__row
                .form__col.col-12
                    label.form__label(for="login-email") Email
                    input.form__input(
                        id="login-email" type="email"
                        bind:value={loginEmail})

                .form__col.col-12
                    label.form__label(for="login-pw") Password
                    input.form__input(
                        id="login-pw"
                        type="password"
                        bind:value={loginPw})

            .form__row.form__row--no-border
                .form__col.col-12
                    button.form__btn.form__submit(
                        type="submit"
                        on:click={login}) Login
</template>