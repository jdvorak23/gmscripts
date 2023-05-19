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
    #processed = 0;
    #errors = 0;
    #changeCallback = null;
    logs = [];

    addUrl(url) {
        this.#urlQueue.push(url);
        this.#change();
        this.#run();
    }

    onChange(callback){
        this.#changeCallback = callback;
    }

    #change(){
        if(!this.#changeCallback)
            return;
        let files = this.#urlQueue.length + this.#sendQueue.length;
        if(this.logs.length)
            this.#changeCallback(files, this.#processed, this.#errors, this.logs[this.logs.length - 1]);
        else
            this.#changeCallback(files, this.#processed, this.#errors);
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
                this.#sendQueue.push(response.finalUrl);
                this.#addLog("Parsed url: " + response.finalUrl);
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
            onload: (response) => {
                if(response.statusText === "OK"){
                    if(response.responseText){
                        this.#errors++;
                        this.#addLog("PyLoad server is responding, but something is wrong. Are you logged in on this browser?");
                    }else{
                        this.#processed++;
                        this.#addLog("Added to the pyLoad server: " + url);
                    }
                }else{
                    this.#errors++;
                    this.#addLog("Something is wrong. Have you properly set your pyLoad #server to this GreaseMonkey script?");
                }
            }
        });
        return true;
    }

    #getName(url){
        let pos = url.lastIndexOf("/");
        return url.substring(pos + 1);
    }
    #addLog(log){
        this.logs.push(log);
        console.log(log);
        this.#change();
    }
}

class FooterInfo{
    #elements = {};
    constructor(element = document.body) {
        element.append(this.footer);
        this.footer.append(this.queueCounter);
        this.footer.append(this.#createElement("Files in the queue"));
        this.footer.append(this.successCounter);
        this.footer.append(this.#createElement("Files processed"));
        const logLabel = this.#createElement("Log:");
        logLabel.style.borderLeft = "1px solid gray";
        this.footer.append(logLabel);
        this.footer.append(this.logMessage);
        const errorLabel = this.#createElement("Errors:");
        errorLabel.style.borderLeft = "1px solid gray";
        errorLabel.style.marginLeft = "auto";
        this.footer.append(errorLabel);
        this.footer.append(this.errorCounter);
    }
    get footer(){
        if(this.#elements.footer)
            return this.#elements.footer;
        this.#elements.footer = document.createElement('div');
        this.#elements.footer.style.position = "fixed";
        this.#elements.footer.style.display = "flex";
        this.#elements.footer.style.right = 0;
        this.#elements.footer.style.left = 0;
        this.#elements.footer.style.bottom = 0;
        this.#elements.footer.style.zIndex = 1030;
        this.#elements.footer.style.backgroundColor = "rgb(231, 231, 231)";
        this.#elements.footer.style.height = "38px";
        return this.#elements.footer;
    }
    get queueCounter(){
        if(this.#elements.queueCounter)
            return this.#elements.queueCounter;
        this.#elements.queueCounter = this.#createElement();
        this.#elements.queueCounter.style.backgroundColor = "rgb(255, 193, 7)";
        return this.#elements.queueCounter;
    }
    get successCounter(){
        if(this.#elements.successCounter)
            return this.#elements.successCounter;
        this.#elements.successCounter = this.#createElement();
        this.#elements.successCounter.style.backgroundColor = "rgb(25, 135, 84)";
        this.#elements.successCounter.style.color = "white";
        return this.#elements.successCounter;
    }
    get logMessage(){
        if(this.#elements.logMessage)
            return this.#elements.logMessage;
        this.#elements.logMessage = this.#createElement();
        return this.#elements.logMessage;
    }
    get errorCounter(){
        if(this.#elements.errorCounter)
            return this.#elements.errorCounter;
        this.#elements.errorCounter = this.#createElement();
        this.#elements.errorCounter.style.backgroundColor = "rgb(220, 53, 69)";
        this.#elements.errorCounter.style.color = "white";
        return this.#elements.errorCounter;
    }
    #createElement(innerText = ""){
        const element = document.createElement('div');
        element.style.padding = "10px";
        element.innerText = innerText;
        return element;
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
        const Footer = new FooterInfo();
        const changeFooter = function(queuedFiles = 0, processedFiles = 0, errors = 0, lastLog = ""){
            Footer.queueCounter.innerText = queuedFiles;
            Footer.successCounter.innerText = processedFiles;
            Footer.errorCounter.innerText = errors;
            Footer.logMessage.innerText = lastLog;
        }
        changeFooter();
        Q.onChange(changeFooter);
    }

    init();


});





