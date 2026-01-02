// ==UserScript==
// @name phpmyadmin
// @description phpmyadmin
// @include http://localhost/phpmyadmin*
// @version  1
// @grant GM.xmlHttpRequest
// @grant         GM.setValue
// @grant         GM.getValue
// @grant         GM.deleteValue
// ==/UserScript==

const EXPORT_SETTINGS = {
	chunks : {
		menu : {
			id: [
				{
					db: 'chunks',
					table: 'sections',
					field: 'menu_id',
				},
				{
					db: 'chunks',
					table: 'menu',
					field: 'parent_id',
				},
			],
		},
		sections : {
			id: [
				{
					db: 'chunks',
					table: 'chunks',
					field: 'section_id',
				},
			],
		},
		chunks : {
			id: [
				{
					db: 'chunks',
					table: 'chunk_placeholders',
					field: 'chunk_id',
				},
			],
		},
	},
}

const observeUrlChange = () => {
	let oldHref = document.location.href;
	const body = document.querySelector('body');
	const observer = new MutationObserver(mutations => {
		if (oldHref !== document.location.href) {
			oldHref = document.location.href;
			const hrefChangedEvent = new CustomEvent("hrefChanged", {
				detail: {}
			});
			window.dispatchEvent(hrefChangedEvent);
		}
	});
	observer.observe(body, { childList: true, subtree: true });
};

window.onload = observeUrlChange;


document.addEventListener('DOMContentLoaded', async () => {
	window.addEventListener('hrefChanged', async (event) => {
		await start();
	});
	await start();
});

async function start() {
	console.log(window.location.href, "REEEEEEEDIREEEECCCCCTTTTT");
	let queue = await Queue.createFromCache();
	console.log(queue.cacheQueue);
	console.log(queue.tasks);
	//queue = await Queue.createFromExportSetting();

	if ( ! queue.isRunning() && window.location.href.includes('http://localhost/phpmyadmin/index.php?route=/table/search')) {
		const params = new URLSearchParams(window.location.search);
		const db = params.get('db');
		const table = params.get('table');
		if (params.has('db') && params.has('table')) {
			const form = await getDynamicElement('#tbl_search_form');

			for (const row of form.querySelector('table').tBodies[0].rows) {
				const field = row.cells[0].innerText.trim();

				const valuesInput = row.cells[4].querySelector('input[type="text"]');

				let type = row.cells[1].innerText.trim();
				if (type.includes('int')) {
					const criteriaSelect = row.cells[3].querySelector('select');
					criteriaSelect.value = 'IN (...)';
					valuesInput.setAttribute('multiple', "");
				}


				const exportButton = elem(`<span class="btn btn-primary">Export</a>`);
				valuesInput.parentElement.appendChild(exportButton);
				exportButton.addEventListener('click', async () => {
					if ( ! valuesInput.value) {
						return;
					}
					const exportSetting = getExportSetting(db, table, field, valuesInput.value);

					queue = await Queue.createFromExportSetting(exportSetting);
					console.log(queue);
					await queue.task();
				});
			}
		}
	}

	await queue.task();
}




class CacheQueue {
	exportSettings = [];

	index = null;

	result = false;
	sql = '';
}

class Queue {
	tasks = [];
	cacheQueue;

	static async createFromExportSetting(exportSetting = null) {
		const queue = new Queue();
		queue.cacheQueue = new CacheQueue();
		if ( ! exportSetting) {
			await queue.saveCache();
			return queue;
		}

		await queue.setExportSetting(exportSetting);
		await queue.setIndex(0);

		queue.addTasks();
		return queue;
	}

	static async createFromCache() {
		let queue = new Queue();
		let cache = await GM.getValue('queue', null);
		try {
			cache = JSON.parse(cache);
		} catch (e) {
			cache = new CacheQueue();
		}
		queue.cacheQueue = cache;

		if ( ! queue.isRunning()) {
			return queue;
		}

		queue.addTasks();
		if (queue.cacheQueue.index >= queue.tasks.length) {
			console.log(queue.cacheQueue.index, "HARD UKONCENI");
			// Reset když chceme task indexu který už není
			queue = await Queue.createFromExportSetting();
			return queue;
		}

		return queue;
	}

	async task() {
		if ( ! this.isRunning()) {
			return;
		}
		const index = this.cacheQueue.index;
		await this.setIndex(index + 1);
		await this.tasks[index]();

	}

	async setExportSetting(value) {
		this.cacheQueue.exportSettings.push(value);
		await this.saveCache();
	}


	get exportSetting() {
		if (this.cacheQueue.exportSettings.length === 0) {
			return null;
		}
		return this.cacheQueue.exportSettings[0];
	}

	async setIndex(value) {
		this.cacheQueue.index = value;
		await this.saveCache();
	}


	async setResult(value) {
		this.cacheQueue.result = value;
		await this.saveCache();
	}

	async setSql(value) {
		this.cacheQueue.sql = value;
		await this.saveCache();
	}

	async saveCache() {
		await GM.setValue('queue', JSON.stringify(this.cacheQueue));
	}

	isRunning() {
		if (this.cacheQueue.index === null) {
			return false;
		}
		return true;
	}

	addTasks() {
		if (this.exportSetting && this.exportSetting.isChild) {
			console.log("child task");
			this.tasks.push(async ()=> {
				const form = await getDynamicElement('#tbl_search_form');
				for (const row of form.querySelector('table').tBodies[0].rows) {
					const field = row.cells[0].innerText.trim();
					if (field !== this.exportSetting.field) {
						continue;
					}

					const criteriaSelect = row.cells[3].querySelector('select');
					criteriaSelect.value = 'IN (...)';

					const valuesInput = row.cells[4].querySelector('input[type="text"]');
					valuesInput.setAttribute('multiple', "");
					valuesInput.value = this.exportSetting.criteria;

					await this.task();
				}
			});
		}
		this.tasks.push(async ()=> {
			let form = await getDynamicElement('#tbl_search_form');
			form.querySelector("input[name='submit'][type='submit']").click();
			await this.exportData();
		});

		this.tasks.push(async ()=> {
			console.log("sqldump");
			let el = await getDynamicElement('#page_content');
			let textarea = el.querySelector('#textSQLDUMP');
			if ( ! textarea) {
				textarea = elem(`<textarea name="sqldump" cols="50" rows="30" id="textSQLDUMP" wrap="OFF" style="width: 1878px; height: 697.467px;"></textarea>`);
				el.appendChild(textarea);
			}

			let sql = textarea.innerHTML.replace('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";', " ").trim();
			if (this.cacheQueue.sql !== '') {
				sql = "\n" + sql;
			}
			await this.setSql(this.cacheQueue.sql + sql);
			textarea.innerHTML = this.cacheQueue.sql;

			const exportSetting = this.cacheQueue.exportSettings.shift();
			console.log(exportSetting);

			for (const childSetting of exportSetting.children) {
				if (childSetting.criteria === null) {
					continue;
				}
				addChildrenToExportSetting(childSetting);
				this.cacheQueue.exportSettings.push(childSetting);
			}
			await this.saveCache();

			if (this.exportSetting) {
				console.log(this.exportSetting.criteria);
				// Máme další ve frontě
				await this.setIndex(0);
				window.location.href = `index.php?route=/table/search&db=${this.exportSetting.db}&table=${this.exportSetting.table}`;
			}
		});
	}

	async exportData() {
		console.log("export");
		let result = await getOneDynamicElement(['table[data-uniqueid]', 'div.alert.alert-success[role="alert"]'], document.getElementById('sqlqueryresultsouter'));
		if (result.tagName === 'DIV') {
			// Nenalezen ani jeden řádek
			console.log("no results");
			for (const childSetting of this.exportSetting.children) {
				// Pokud jsou vázáni stejným klíčem, přes jaký se vyhledávalo, použijeme původní vstup
				if (childSetting.foreignKey === this.exportSetting.field) {
					childSetting.criteria = this.exportSetting.criteria;
				}
			}
			await this.setResult(false);
			window.location.href = 'index.php?route=/export';
			return;
		}

		// Z tabulky najdeme sloupce
		let columns = [];
		for (let i = 1; i < result.tHead.rows[0].cells.length - 1; i++) { // -1 nějaký 1 navíc nakonci
			const cell = result.tHead.rows[0].cells[i];
			const column = cell.innerText.trim();
			columns.push(column);
		}

		// Pro všechny potomky se pokusíme přidělit criteria
		for (const childSetting of this.exportSetting.children) {
			// Pokud jsou vázáni stejným klíčem, přes jaký se vyhledávalo, použijeme původní vstup
			if (childSetting.foreignKey === this.exportSetting.field) {
				childSetting.criteria = this.exportSetting.criteria;
				continue;
			}
			// Jinak najdeme podle sloupce všechny hodnoty  v tabulce
			let index = columns.indexOf(childSetting.foreignKey);
			if (index === -1) {
				continue;
			}
			let values= [];
			for (const row of result.tBodies[0].rows) {
				values.push(row.cells[index+4].innerText.trim()); // +4 za více ovládacích tdček
			}
			childSetting.criteria =values.join(',');
		}
		await this.setResult(true); // Tím se i uloží vše

		let el = await getDynamicElement('.checkall_box');
		await new Promise((res) => {
			setTimeout(() => res(), 20);
		});
		el.click();
		el = await getDynamicElement('button[name="submit_mult"][type="submit"][value="export"]');
		el.click();
		el = await getDynamicElement('#radio_custom_export');
		el.click();
		el = await getDynamicElement('#radio_view_as_text');
		el.click();
		el = await getDynamicElement('#checkbox_sql_include_comments');
		el.click();
		el = await getDynamicElement('#checkbox_sql_use_transaction');
		el.click();
		el = await getDynamicElement('#radio_sql_structure_or_data_data');
		el.click();
		el = await getDynamicElement('#checkbox_sql_utc_time');
		el.click();
		el = await getDynamicElement('#buttonGo');
		el.click();
	}
}


class ExportSetting {
	db;
	table;
	field;
	criteria;
	children = [];
	foreignKey = null;
	isChild = false;

	constructor(db, table, field, criteria) {
		this.db = db;
		this.table = table;
		this.field = field;
		this.criteria = criteria;
	}
}

function getExportSetting(db, table, field, value = null, createChildren = true) {
	const exportSetting = new ExportSetting(db, table, field, value);
	if (createChildren) {
		addChildrenToExportSetting(exportSetting);
	}
	return exportSetting;
}


function addChildrenToExportSetting(exportSetting) {
	if (EXPORT_SETTINGS[exportSetting.db] && EXPORT_SETTINGS[exportSetting.db][exportSetting.table]) {
		console.log("user setting found");
		for (const prop of Object.entries(EXPORT_SETTINGS[exportSetting.db][exportSetting.table])) {
			const foreignKey = prop[0];
			for (const setting of prop[1]) {
				console.log(setting);
				const childExportSetting = getExportSetting(setting.db, setting.table, setting.field, null, false);
				childExportSetting.foreignKey = foreignKey;
				childExportSetting.isChild = true;
				exportSetting.children.push(childExportSetting);
			}
		}
	}
}





function elem(html){
	const template = document.createElement('template');
	template.innerHTML = html.trim();
	return template.content.firstElementChild;
}



function getDynamicElement(selector, from = document){
	return new Promise((resolve) => {
		const element = from.querySelector(selector);
		if (element) {
			resolve(element);
			return;
		}

		setTimeout(() => {
			resolve(getDynamicElement(selector, from));
		}, 20);
	});
}

function getOneDynamicElement(selectors = [], from = document){
	return new Promise((resolve) => {
		if ( ! selectors.length) {
			resolve(null);
			return;
		}

		let element = null;
		for (const selector of selectors) {
			element = from.querySelector(selector);
			if (element) {
				resolve(element);
				return;
			}
		}

		setTimeout(() => {
			resolve(getOneDynamicElement(selectors, from));
		}, 20);
	});
}