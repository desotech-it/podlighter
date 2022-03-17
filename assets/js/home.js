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

class Graph {
	#cy;
	#nodes;

	constructor(container) {
		const cy = cytoscape({
			container: container,
			// elements: {
			// 	nodes: [
			// 		{
			// 			data: { id: 'svc' }
			// 		},
			// 		{
			// 			data: { id: 'endpointA' }
			// 		},
			// 		{
			// 			data: { id: 'endpointB' }
			// 		}
			// 	],
			// 	edges: [
			// 		{
			// 			data: { id: 'a', source: 'svc', target: 'endpointA' }
			// 		},
			// 		{
			// 			data: { id: 'b', source: 'svc', target: 'endpointB' }
			// 		}
			// 	]
			// },
			layout: {
				name: 'circle',
			},
			style: [
				{
					selector: 'node',
					style: {
						'label': 'data(id)'
					}
				},
				{
					selector: 'edge',
					style: {
						'label': 'data(id)'
					}
				}
			]
		});
		this.#cy = cy;
		this.#nodes = cy.collection();
	}

	setService(service) {
		const node = {
			group: 'nodes',
			data: {
				id: service,
				weight: 75
			},
			position: { x: 200, y: 200 }
		};
		this.#nodes.remove();
		this.#nodes = this.#cy.add(node);
	}
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

	get service() {
		return currentSelectOption(this.#endpointSelect);
	}
}

async function apiGet(url) {
	return fetchJSON(url).catch(e => { throw new Error(`GET ${url} failed`, { cause: e }); });
}

async function fetchNamespaces() {
	return apiGet('/api/namespaces');
}

async function fetchServices(namespace) {
	return apiGet(`/api/endpoints?namespace=${namespace}`);
}

window.onload = function() {
	const ns = document.getElementById('namespace-select');
	const svc = document.getElementById('service-select');
	const err = document.getElementById('error-placeholder');

	const graphContainer = document.getElementById('cy');
	const graph = new Graph(graphContainer);

	const app = new App(ns, svc, err);

	const updateGraph = services => {
		graph.setService(services);
	};

	const updateNamespace = async () => {
		return fetchNamespaces().then(namespaces => app.updateNamespaceSelect(namespaces));
	};

	const updateServices = async () => {
		return fetchServices(app.namespace)
		.then(services => {
			app.updateServiceSelect(services);
			// updateGraph(services);
		});
	};

	const showError = e => {
		app.error('cause' in e ? `${e.message}: ${e.cause.message}` : e.message);
	};

	updateNamespace().then(updateServices).catch(showError);

	app.addEventListenerToNamespaceSelect('change', () => updateServices().catch(showError));
}
