<script>
</script>
<template>
    <div class="loading">
        <div class="loading__text">
            Loading<span class="loading__dot">.</span><span class="loading__dot">.</span><span class="loading__dot">.</span>
        </div>
    </div>
</template>
<style lang='scss'>
    .loading {
        background: var(--bg-trans);
        position: fixed;
        width: 100%;
        height: 100vh;
        top: 0;
        left: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        &__text {
            padding: 0.5rem 0.75rem;
            background: var(--bg);
            border: 1px solid var(--bd);
            border-radius: 0.25rem;
            text-align: center;
        }

        @keyframes blink {
            0% {
                opacity: 0;
            }
            50% {
                opacity: 1;
            }
        }
        
        &__dot {
            word-break: break-all;
            animation: blink 1s infinite;
            animation-timing-function: step-end;
            &:nth-child(2) {
                animation-delay: 0.25s;
            }
            &:nth-child(3) {
                animation-delay: 0.5s;
            }
        }
    }
</style>