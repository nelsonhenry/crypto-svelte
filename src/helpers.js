export const percentChange = (a, b) => ((b - a) / a) * 100

export const sign = (n) => (n >= 0 ? '+' : '')

export const className = (n) => (n >= 0 ? 'pos' : 'neg')

export const fixed = (n) => {
    if (n < 0.1) n = Number(n.toFixed(4))
    if (n >= 0.1) n = Number(n.toFixed(3))
    if (n >= 1) n = Number(n.toFixed(2))
    if (n >= 100) n = Number(n.toFixed(1))
    if (n >= 1000) n = Number(n.toFixed(0))
    return n
}

export const sumArray = (arr) => arr.reduce((a, b) => a + b, 0)

export const hasValue = (obj, key, value) =>
    obj.hasOwnProperty(key) && obj[key] === value

export const setRootProperty = (prop, val) =>
    document.querySelector(':root').style.setProperty(prop, val)

export const sumProps = (items, prop) => items.reduce((a, b) => a + b[prop], 0)

export const computeGains = (buysPrice, sellPrice, sellAmount) =>
    sellPrice * sellAmount - buysPrice * sellAmount

export const computeAmount = (buysAmount, sellAmount) => buysAmount - sellAmount

export const computeSold = (buysAmount, sellAmount) =>
    buysAmount - sellAmount <= 1 ? true : false

export const smallImg = (el) => el.replace('large', 'small')

export const createGroups = (arr, portions) => {
    const numGroups = Math.ceil(arr.length / portions);
    return new Array(numGroups).fill('').map((_, i) => arr.slice(i * portions, (i + 1) * portions));
}

