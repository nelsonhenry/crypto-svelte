<script>
    import { stats } from '../stores'
    import { percentChange, sign, className } from '../helpers'

    let funds = $stats.funds.off.toFixed(0)
    let fundsOn = $stats.funds.on.toFixed(0)
    let fundsOnPercent = (($stats.funds.on / $stats.funds.off) * 100).toFixed(1)
    
    let gainsOnSign = sign($stats.gains.on)
    let gainsOn = gainsOnSign + $stats.gains.on.toFixed(0)
    let gainsOnClass = className($stats.gains.on)
    let gainsOnPercent = gainsOnSign + percentChange($stats.funds.on, $stats.funds.on + $stats.gains.on).toFixed(1)

    let gainsOffTotal = $stats.gains.off.q1 + $stats.gains.off.q2
    let gainsOffSign = sign(gainsOffTotal)
    let gainsOff = gainsOffSign + gainsOffTotal.toFixed(0)
    let gainsOffClass = className(gainsOffTotal)

    let maxLoose = $stats.maxLoose.toFixed(0)
    let maxLooseSign = sign($stats.maxLoose)
    let maxLoosePercent = maxLooseSign + percentChange($stats.funds.on, $stats.funds.on + $stats.maxLoose).toFixed(1)

    let gainsOffQ1Sign = sign($stats.gains.off.q1)
    let gainsOffQ1 = gainsOffQ1Sign + $stats.gains.off.q1.toFixed(0);
    let gainsOffQ2Sign = sign($stats.gains.off.q2)
    let gainsOffQ2 = gainsOffQ2Sign + $stats.gains.off.q2.toFixed(0)
</script>

<template>
    <!-- STATS -->
    <div class="stats">
        <div class="stats__col">
            <span class={gainsOnClass}>{gainsOn}&nbsp;({gainsOnPercent}%)</span>
        </div>
        <div class="stats__col">
            <span>{fundsOn}/{funds}&nbsp;({fundsOnPercent}%)</span>
        </div>
        <div class="stats__col">
            <span class={gainsOffClass}>{gainsOff}</span>
        </div>
    </div>
    <div class="stats">
        <div class="stats__col">
            <span>{maxLoose}&nbsp;({maxLoosePercent}%)</span>
        </div>
        <div class="stats__col">
            <span>({gainsOffQ1},&nbsp;{gainsOffQ2})</span>
        </div>
    </div>
</template>

<style lang="scss">
</style>