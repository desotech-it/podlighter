'use strict';

function getNamespaceSelect() {
	return document.getElementById('namespace-select');
}

function getServiceSelect() {
	return document.getElementById('service-select');
}

async function fetchNamespaces() {
	return await fetch('/api/namespaces')
		.then(response => {
			if (!response.ok) {
				return new Error('could not retrieve namespaces at this time');
			} else {
				return response.json();
			}
		})
}

async function fetchServices(namespace) {
	return await fetch(`/api/endpoints?namespace=${namespace}`)
		.then(response => {
			if (!response.ok) {
				return new Error('could not retrieve endpoints at this time');
			} else {
				return response.json();
			}
		})
}

function fillSelect(select, items) {
	clearOptions(select);
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

function currentOption(select) {
	return select.options[select.selectedIndex].value
}

function clearOptions(select) {
	const range = document.createRange();
	range.selectNodeContents(select);
	range.deleteContents();
}

async function updateServiceSelect(namespace) {
	const service_select = getServiceSelect();
	return fetchServices(namespace)
		.then(services => {
			fillSelect(service_select, services.items.map(item => item.metadata.name));
		});
}

async function updateNamespaceSelect() {
	const namespace_select = getNamespaceSelect();
	return fetchNamespaces()
		.then(namespaces => {
			fillSelect(namespace_select, namespaces.items.map(item => item.metadata.name));
			const opt = currentOption(namespace_select);
			return updateServiceSelect(opt);
		});
}

function addListeners() {
	const namespace_select = getNamespaceSelect();
	namespace_select.addEventListener('change', event => {
		const opt = currentOption(event.target);
		updateServiceSelect(opt);
	});
}

function init() {
	updateNamespaceSelect();
	addListeners();
}

window.onload = init;
