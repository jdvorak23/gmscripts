// ==UserScript==
// @name	CSFD Copy Folder Name
// @description	Copy Folder Name From CSFD
// @include       https://www.csfd.cz*
// @version  2
// @grant GM.getValue
// @grant GM.setValue
// ==/UserScript==

//Pok
window.addEventListener('DOMContentLoaded', async () =>
{
	const page = new Page();
	if(!page.hasMedia)
		return;
	const copy = (text) => {
		window.navigator.clipboard.writeText(text);
	}
	const media = new Media(page);
	await media.init();

	//Button for copying Movie Name
	page.insertMediaCopyDiv(media);
	page.media.button.addEventListener("click", () => {
		media.name = page.media.name.value;
		media.leftBracket = page.media.leftBracket.value;
		media.year = page.media.year.value;
		media.rightBracket = page.media.rightBracket.value;
		copy(media.nameToCopy);
	});

	if(!page.hasEpisodes)
		return;

	page.insertListCopyDiv((media));
	page.episodes.button.addEventListener("click", () => {
		media.episodesName = page.episodes.name.value;
		media.episodeDelimiter = page.episodes.delimiter.value;
		copy(media.listToCopy);
	});
	page.episodes.cancel.addEventListener("click", () => {
		page.episodes.name.value = "";
	});

	for(const episode of media.episodes){
		page.insertEpisodeCopyButton(episode, () =>{
			media.episodesName = page.episodes.name.value;
			media.episodeDelimiter = page.episodes.delimiter.value;
			copy(episode.getNameToCopy(media.episodeDelimiter));
		});
	}

});

class Episode{
	constructor(container) {
		this.container = container;
	}
	get name(){
		return this.container.innerText.replace(/[&\/\\#,+()$~%'":*?<>{}]/g,'');
	}
	get number(){
		return this.container.parentElement.querySelector(".info").innerText.slice(1,-1);
	}
	getNameToCopy(delimiter){
		return this.number + delimiter + this.name;
	}
}

class Media {
	#propEpisodes;
	name;year;episodesName;
	#propLeftBracket;#propRightBracket;#propEpisodeDelimiter;
	page;

	async init(){
		this.#propLeftBracket = await GM.getValue("leftBracket", " [");
		this.#propRightBracket = await GM.getValue("rightBracket", "]");
		this.#propEpisodeDelimiter = await GM.getValue("episodeDelimiter", " - ");
	}
	constructor(page) {
		if(!page || !page.hasMedia)
			throw new Error();
		this.page = page;
		this.name = this._extractName();
		this.episodesName = this.name + " ";
		this.year = this._extractYear();
	}
	_extractName(){
		const headingLink = this.page.heading.querySelector("a");
		return (headingLink || this.page.heading).innerText.trim()
			.replace(":", " -")
			.replace(/[&\/\\#,+()$~%'":*?<>{}]/g,'');
	}
	_extractYear(){
		let year = this.page.originSpan.textContent.slice(0,-2);
		if (year.startsWith("(")) year = year.slice(1);
		if (year.endsWith(")")) year = year.slice(0, -1);
		return year;
	}
	get leftBracket(){
		return this.#propLeftBracket;
	}
	set leftBracket(value){
		GM.setValue("leftBracket", value);
		this.#propLeftBracket = value;
	}
	get rightBracket(){
		return this.#propRightBracket;
	}
	set rightBracket(value){
		GM.setValue("rightBracket", value);
		this.#propRightBracket = value;
	}
	get episodeDelimiter(){
		return this.#propEpisodeDelimiter;
	}
	set episodeDelimiter(value){
		GM.setValue("episodeDelimiter", value);
		this.#propEpisodeDelimiter = value;
	}
	get nameToCopy(){
		return this.name + this.leftBracket + this.year + this.rightBracket;
	}
	get listToCopy(){
		let copyText = "";
		for (const episode of this.episodes){
			copyText = copyText === ""
				? this.episodesName + episode.getNameToCopy(this.episodeDelimiter)
				: copyText + "\n" + this.episodesName + episode.getNameToCopy(this.episodeDelimiter);
		}
		return copyText;
	}
	get episodes(){
		if(this.#propEpisodes)
			return this.#propEpisodes;
		this.#propEpisodes = [];
		for(const episode of [... this.page.episodesList]){
			this.#propEpisodes.push(new Episode(episode));
		}
		return this.#propEpisodes;
	}
}

class Page{
	heading;originSpan;episodesList;
	media = {}
	episodes = {}
	constructor() {
		this.heading = document.querySelector("h1");
		this.originSpan = document.querySelector(".origin span");
		this.episodesList = document.querySelectorAll(".film-episodes-list .film-title-name");
	}
	get hasMedia(){
		return this.heading && this.originSpan;
	}
	get hasEpisodes(){
		return !!this.episodesList.length;
	}
	insertMediaCopyDiv(media){
		const div = this.el(`<div style="display: flex;align-items: center;"></div>`);
		this.media.name = this.el(`<input type="text" value="${media.name}" style="flex: 1 1 auto;margin: 0;">`);
		div.append(this.media.name);
		this.media.leftBracket = this.el(`<input type="text" value="${media.leftBracket}" style="margin: 0;width: 20px;min-width: auto">`);
		div.append(this.media.leftBracket);
		this.media.year = this.el(`<input type="text" value="${media.year}" style="margin: 0;width: 50px;min-width: auto">`);
		div.append(this.media.year);
		this.media.rightBracket = this.el(`<input type="text" value="${media.rightBracket}" style="margin: 0;width: 15px;min-width: auto">`);
		div.append(this.media.rightBracket);
		this.media.button = this.el(`<button>Kopíruj</button>`);
		div.append(this.media.button);
		this.heading.parentElement.insertBefore(div, this.heading);
	}

	insertListCopyDiv(media){
		const div = this.el(`<div style="display: flex;align-items: center;"></div>`);
		this.episodes.cancel = this.el(`<button>X</button>`);
		div.append(this.episodes.cancel);
		this.episodes.name = this.el(`<input type="text" value="${media.episodesName}" style="flex: 1 1 auto;margin: 0;">`);
		div.append(this.episodes.name);
		div.append(this.el(`<span style="margin-left: 3px;margin-right: 3px;">SxxExx</span>`));
		this.episodes.delimiter = this.el(`<input type="text" value="${media.episodeDelimiter}" style="margin: 0;width: 25px;min-width: auto">`);
		div.append(this.episodes.delimiter);
		div.append(this.el(`<span style="margin-left: 3px;margin-right: 3px;">%name%</span>`));
		this.episodes.button = this.el(`<button>Kopíruj seznam</button>`);
		div.append(this.episodes.button);
		const container = document.querySelector(".film-episodes-list").parentElement.parentElement;
		container.insertBefore(div, container.firstElementChild)
	}

	insertEpisodeCopyButton(episode, callback){
		const button = this.el(`<button>Kopíruj</button>`);
		episode.container.parentElement.append(button);
		button.addEventListener("click", callback)
	}

	el(html){
		const template = document.createElement('template');
		template.innerHTML = html.trim();
		return template.content.firstElementChild;
	}
}