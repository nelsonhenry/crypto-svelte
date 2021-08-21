 export function percentChange(a, b) {
     return ((b - a) / a) * 100;
 }

 export function fixed(n) {
     if (n < 0.1) n = Number(n.toFixed(4));
     if (n >= 0.1) n = Number(n.toFixed(3));
     if (n >= 1) n = Number(n.toFixed(2));
     if (n >= 100) n = Number(n.toFixed(1));
     if (n >= 1000) n = Number(n.toFixed(0));
     return n;
 }

 export function sumArray(arr) {
     return arr.reduce((a, b) => a + b, 0);
 }

 export function hasValue(obj, key, value) {
     return obj.hasOwnProperty(key) && obj[key] === value;
 }

 export function setRootProperty(prop, val) {
     document.querySelector(":root").style.setProperty(prop, val);
 }

 export function sumProps(items, prop) {
     return items.reduce(function(a, b) {
         return a + b[prop];
     }, 0);
 };