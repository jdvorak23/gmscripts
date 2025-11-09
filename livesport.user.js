// ==UserScript==
// @name Livesport
// @description Bannery rovnou pryč
// @include https://www.livesport.cz*
// @version  1
// @grant    none
// ==/UserScript==

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('box-over-content-revive')?.remove();
    document.getElementById('zoneContainer-top')?.remove();
    document.getElementById('zoneContainer-left_menu_1')?.remove();
    document.getElementById('rc-top')?.remove();
});
