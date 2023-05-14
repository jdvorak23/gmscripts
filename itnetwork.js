// ==UserScript==
// @name     ItNetwork
// @include https://www.itnetwork.cz*
// @version  1
// @grant    none
// ==/UserScript==

document.addEventListener('copy', ev => {
    let text = window.getSelection().toString();
    navigator.clipboard.writeText(text).then(() => {
    },() => {
        console.error('Failed to copy');
    });
});