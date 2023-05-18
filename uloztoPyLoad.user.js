// ==UserScript==
// @name          PyLoad Ulozto
// @namespace     PyLoad
// @description   PyLoad download button for Ulozto gozofinder
// @include       https://gozofinder.com*
// @version       2.0
// @grant GM.xmlHttpRequest
// ==/UserScript==

/**
 * Write the address of your pyLoad server to the #server property:
 */
class Queue {
    #server =  "http://pyLoad.xxx";
    #timeout = 2547; // After migration maybe not needed, prevent captcha request upon many requests in-time
    #running = false;
    #urlQueue = [];
    #sendQueue  = [];
    #timer; 

    addUrl(url) {
        this.#urlQueue.push(url)
        this.#run();
    }
    #run() {
        if (!this.#running) {
            this.#running = true;
            this.#timer = setInterval(() => {
                this.#process();
            }, this.#timeout);
        }
    }
    #process() {
        if (this.#getLink())
            return;
        if (this.#setQueue())
            return;

        clearInterval(this.#timer)
        this.#running = false;
    }
    #getLink(){
        if(!this.#urlQueue.length)
            return false;

        let url = this.#urlQueue.shift();
        GM.xmlHttpRequest({
            method: "GET",
            url: url,
            headers: {},
            onload: (response) => {
                console.log("Parsed url: ", response.finalUrl);
                this.#sendQueue.push(response.finalUrl);
            }
        });

        return true;
    }
    #setQueue(){
        if (!this.#sendQueue.length)
            return false;

        let url = this.#sendQueue.shift();
        let formData = new FormData();
        formData.append("add_name", "Ulozto - " + this.#getName(url));
        formData.append("add_links", url);
        formData.append("add_password", "");
        formData.append("add_file", "");
        formData.append("add_dest", "1");
        GM.xmlHttpRequest({
            method: "POST",
            url: this.#server + "/json/add_package",
            data: formData,
            headers: {},
            onload: function (response) {
                if(response.statusText === "OK"){
                    if(response.responseText)
                        console.log("PyLoad server is responding, but something is wrong. Are you logged in on this browser?");
                    else
                        console.log("File successfully added to the pyLoad server: ", url);
                }
                else
                    console.log("Something is wrong. Have you properly set your pyLoad #server to this GreaseMonkey script?");
            }
        });
        return true;
    }

    #getName(url){
        let pos = url.lastIndexOf("/");
        return url.substring(pos + 1);
    }
}

window.addEventListener('load', () => {

    const Q = new Queue();
    const getMain = function(){
        return new Promise((resolve) => {
            const main = document.querySelector("main");
            if(main)
                resolve(main);

            setTimeout(() => {
                resolve(getMain());
            }, 500);
        });
    }
    const init = async function() {
        const main = await getMain();
        main.addEventListener('DOMSubtreeModified', () => {
            for(const link of [... main.querySelectorAll('a')]){
                if(!link.hasAttribute('title') || link.previousElementSibling)
                    continue;
                const button = document.createElement('button');
                button.textContent = "+";
                button.addEventListener('click', () => {
                    Q.addUrl(link.href);
                });
                link.style.marginLeft = "2px";
                link.parentElement.insertBefore(button, link);
            }
        });
    }

    init();
});





