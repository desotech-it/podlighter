'use strict';

async function fetchJSON(url) {
	return fetch(url).then(r => r.ok ? r.json() : new Error(`${r.status} ${r.statusText}`));
}

function currentSelectOption(select) {
	return select.options[select.selectedIndex].value;
}

function clearSelect(select) {
	const range = document.createRange();
	range.selectNodeContents(select);
	range.deleteContents();
}

function fillSelect(select, items) {
	clearSelect(select);
	if (items.length > 0) {
		items.forEach(element => {
			const option = document.createElement('option');
			option.appendChild(document.createTextNode(element));
			select.appendChild(option);
		});
		select.removeAttribute('disabled');
	} else {
		select.setAttribute('disabled', 'true');
	}
}

function fillSelectWithKubernetesList(select, list) {
	fillSelect(select, list.items.map(item => item.metadata.name));
}

class App {
	#namespaceSelect;
	#endpointSelect;

	constructor(namespaceSelect, endpointSelect) {
		this.#namespaceSelect = namespaceSelect;
		this.#endpointSelect = endpointSelect;
	}

	addEventListenerToNamespaceSelect(type, listener, useCapture) {
		this.#namespaceSelect.addEventListener(type, listener, useCapture);
	}

	addEventListenerToServiceSelect(type, listener, useCapture) {
		this.#endpointSelect.addEventListener(type, listener, useCapture);
	}

	updateNamespaceSelect(list) {
		fillSelectWithKubernetesList(this.#namespaceSelect, list);
	}

	updateServiceSelect(list) {
		fillSelectWithKubernetesList(this.#endpointSelect, list);
	}

	get namespace() {
		return currentSelectOption(this.#namespaceSelect);
	}
}

async function updateNamespace(app) {
	return fetchJSON('/api/namespaces')
	.then(namespaces => {
		app.updateNamespaceSelect(namespaces);
		return updateService(app.namespace, app);
	});
}

async function updateService(namespace, app) {
	return fetchJSON(`/api/endpoints?namespace=${namespace}`)
	.then(services => app.updateServiceSelect(services));
}

window.onload = function() {
	const ns = document.getElementById('namespace-select');
	const svc = document.getElementById('service-select');
	const app = new App(ns, svc);
	updateNamespace(app);
	app.addEventListenerToNamespaceSelect('change', e => updateService(app.namespace, app));
}
