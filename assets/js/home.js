'use strict';

async function fetchJSON(url) {
	return fetch(url)
	.then(response => {
		if (response.ok) {
			return response.json();
		} else {
			throw new Error(`${url} returned ${response.status} (${response.statusText})`);
		}
	});
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
	#errorPlaceholder;

	constructor(namespaceSelect, endpointSelect, errorPlaceholder) {
		this.#namespaceSelect = namespaceSelect;
		this.#endpointSelect = endpointSelect;
		this.#errorPlaceholder = errorPlaceholder;
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

	error(message) {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = `
		<div class="alert alert-danger alert-dismissible fade show" role="alert">
			${message}
			<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close">
			</button>
		</div>`;
		this.#errorPlaceholder.append(wrapper);
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
	})
	.catch(err => app.error(`unable to retrieve namespaces: ${err.message}`));
}

async function updateService(namespace, app) {
	return fetchJSON(`/api/endpoints?namespace=${namespace}`)
	.then(services => app.updateServiceSelect(services))
	.catch(err => app.error(`unable to retrieve services: ${err.message}`));
}

window.onload = function() {
	const ns = document.getElementById('namespace-select');
	const svc = document.getElementById('service-select');
	const err = document.getElementById('error-placeholder');
	const app = new App(ns, svc, err);
	updateNamespace(app);
	app.addEventListenerToNamespaceSelect('change', e => updateService(app.namespace, app));
}
