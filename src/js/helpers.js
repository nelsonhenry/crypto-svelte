 export const percentChange = (a, b) => {
     return ((b - a) / a) * 100;
 }

 export const fixed = (n) => {
     if (n < 0.1) n = Number(n.toFixed(4));
     if (n >= 0.1) n = Number(n.toFixed(3));
     if (n >= 1) n = Number(n.toFixed(2));
     if (n >= 100) n = Number(n.toFixed(1));
     if (n >= 1000) n = Number(n.toFixed(0));
     return n;
 }

 export const sumArray = (arr) => {
     return arr.reduce((a, b) => a + b, 0);
 }

 export const hasValue = (obj, key, value) => {
     return obj.hasOwnProperty(key) && obj[key] === value;
 }

 export const setRootProperty = (prop, val) => {
     document.querySelector(":root").style.setProperty(prop, val);
 }

 export const sumProps = (items, prop) => {
     return items.reduce(function(a, b) {
         return a + b[prop];
     }, 0);
 };

 export const computeGains = (buysPrice, sellPrice, sellAmount) => {
     return sellPrice * sellAmount - buysPrice * sellAmount;
 };

 export const computeAmount = (buysAmount, sellAmount) => {
     return buysAmount - sellAmount;
 };

 export const computeSold = (buysAmount, sellAmount) => {
     return buysAmount - sellAmount <= 1 ? true : false;
 };

 export const smallImg = (el) => el.replace("large", "small");