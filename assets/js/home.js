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
	const item = select.options[select.selectedIndex];
	return item ? item.value : undefined;
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
			style: [
				{
					selector: 'node',
					style: {
						'label': ele => ele.scratch()._label,
					}
				},
				{
					selector: '.service',
					style: {
						'text-valign': 'bottom',
					}
				},
				{
					selector: 'edge',
					style: {
						'curve-style': 'straight',
						'target-arrow-shape': 'triangle',
						'source-endpoint': 'outside-to-node-or-label',
						'target-endpoint': 'outside-to-node-or-label',
					}
				}
			]
		});
		this.#cy = cy;
		this.#nodes = cy.collection();
	}

	update(endpoints) {
		// In Kubernetes, the name for the Endpoints resource is equal to the service name
		const serviceName = endpoints.metadata.name;
		const serviceNode = {
			group: 'nodes',
			data: {
				id: serviceName,
				weight: 75
			},
			scratch: {
				_label: serviceName,
			},
			classes: [
				'service',
			],
			position: { x: innerWidth / 2, y: innerHeight / 2 }
		};
		const eles = new Array();
		eles.push(serviceNode);
		endpoints.subsets.forEach(subset => {
			subset.addresses.forEach(address => {
				const node = {
					group: 'nodes',
					data: {
						id: address.ip
					},
					scratch: {
						_label: subset.ports.map(item => `${address.ip}:${item.port}/${item.protocol}`).join(',')
					},
					position: { x: innerWidth / 2, y: innerHeight / 4 }
				};
				const edge = {
					group: 'edges',
					data: {
						id: `${serviceName}-${address.ip}`,
						source: serviceNode.data.id,
						target: node.data.id,
					},
				};
				eles.push(node);
				eles.push(edge);
			});
		});
		this.#nodes.remove();
		this.#nodes = this.#cy.add(eles);

		const layout = this.#cy.layout({
			name: 'circle',
			animate: true,
			animationDuration: 500,
			startAngle: Math.PI / 2.0,
		});
		layout.run();
	}
}

class App {
	#namespaceSelect;
	#serviceSelect;
	#alertPlaceholder;
	#graph;
	#namespaceList;
	#serviceList;

	constructor(namespaceSelect, serviceSelect, alertPlaceholder, graph) {
		this.#namespaceSelect = namespaceSelect;
		this.#serviceSelect = serviceSelect;
		this.#alertPlaceholder = alertPlaceholder;
		this.#graph = graph;
	}

	addEventListenerToNamespaceSelect(type, listener, useCapture) {
		this.#namespaceSelect.addEventListener(type, listener, useCapture);
	}

	addEventListenerToServiceSelect(type, listener, useCapture) {
		this.#serviceSelect.addEventListener(type, listener, useCapture);
	}

	updateGraph() {
		const currentService = this.service;
		if (!currentService) {
			return;
		}
		const endpoints = this.endpoints;
		if (!('subsets' in endpoints)) {
			this.warning(`${currentService} has no endpoints to show`);
			return;
		}
		this.#graph.update(endpoints);
	}

	error(message) {
		this.#alert(message, 'danger');
	}

	warning(message) {
		this.#alert(message, 'warning');
	}

	#alert(message, type) {
		const wrapper = document.createElement('div');
		wrapper.innerHTML = `
		<div class="alert alert-${type} alert-dismissible fade show" role="alert">
			${message}
			<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close">
			</button>
		</div>`;
		this.#alertPlaceholder.append(wrapper);
	}

	get namespace() {
		return currentSelectOption(this.#namespaceSelect);
	}

	get service() {
		return currentSelectOption(this.#serviceSelect);
	}

	get namespaces() {
		return this.#namespaceList;
	}

	get services() {
		return this.#serviceList;
	}

	set namespaces(namespaces) {
		this.#namespaceList = namespaces;
		fillSelectWithKubernetesList(this.#namespaceSelect, namespaces);
	}

	set services(services) {
		this.#serviceList = services;
		fillSelectWithKubernetesList(this.#serviceSelect, services);
	}
}

async function apiGet(url) {
	return fetchJSON(url).catch(e => { throw new Error(`GET ${url} failed`, { cause: e }); });
}

async function fetchNamespaces() {
	return apiGet('/api/namespaces');
}

async function fetchServices(namespace) {
	return apiGet(`/api/services?namespace=${namespace}`);
}

async function fetchEndpoints(name, namespace) {
	return apiGet(`/api/endpoints/${name}?namespace=${namespace}`);
}

window.onload = function() {
	const ns = document.getElementById('namespace-select');
	const svc = document.getElementById('service-select');
	const err = document.getElementById('alert-placeholder');

	const graphContainer = document.getElementById('cy');
	const graph = new Graph(graphContainer);

	const app = new App(ns, svc, err, graph);

	const updateNamespaces = async () => {
		return fetchNamespaces()
		.then(namespaces => app.namespaces = namespaces);
	};

	const updateServices = async () => {
		return fetchServices(app.namespace)
		.then(services => app.services = services);
	};

	const updateEndpoints = async () => {
		return fetchEndpoints(app.service, app.namespace)
		.then(endpoints => app.endpoints = endpoints);
	};

	const updateGraph = () => app.updateGraph();

	const showError = e => {
		app.error('cause' in e ? `${e.message}: ${e.cause.message}` : e.message);
	};

	updateNamespaces()
	.then(updateServices)
	.then(updateEndpoints)
	.then(updateGraph)
	// .catch(showError);

	app.addEventListenerToNamespaceSelect('change', () => {
		updateServices()
		.then(updateEndpoints)
		.then(updateGraph)
		.catch(showError);
	});
	app.addEventListenerToServiceSelect('change', () => {
		updateEndpoints()
		.then(updateGraph)
		.catch(showError);
	});
}
