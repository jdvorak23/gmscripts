// ==UserScript==
// @name     ItNetwork
// @description Zkopíruj, to co jsi chtěl + zkopíruj terminálové příkazy
// @include https://www.itnetwork.cz*
// @version  1
// @grant    none
// ==/UserScript==

document.addEventListener('copy', () => {
    let text = window.getSelection().toString();
    navigator.clipboard.writeText(text);
});

for(let pre of [... document.querySelectorAll('pre')]){
    if(pre.innerText.includes("\n"))
        continue;
    let copyButton = document.createElement('span');
    copyButton.innerHTML = '<i class="fa fa-clone fa-2x" aria-hidden="true" style="cursor: pointer"></i>';
    copyButton.style.position = "absolute";
    copyButton.style.right = "5px";
    copyButton.style.top = "5px";
    copyButton.addEventListener('click', ()=>{
        navigator.clipboard.writeText(pre.innerText.trim());
    });
    pre.style.position = "relative";
    pre.appendChild(copyButton);
}