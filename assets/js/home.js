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
						'label': ele => ele.scratch()._ports
					}
				}
			]
		});
		this.#cy = cy;
		this.#nodes = cy.collection();
	}

	setService(service) {
		const serviceName = service.metadata.name;
		const serviceNode = {
			group: 'nodes',
			data: {
				id: serviceName,
				weight: 75
			},
			position: { x: innerWidth / 2, y: innerHeight / 2 }
		};
		const eles = new Array();
		eles.push(serviceNode);
		service.subsets.forEach(subset => {
			const portList = subset.ports.map(item => `${item.port}/${item.protocol}`).join(',');
			subset.addresses.forEach((address, index) => {
				const node = {
					group: 'nodes',
					data: {
						id: address.ip
					},
					position: { x: innerWidth / 2, y: innerHeight / 2 }
				};
				const edge = {
					group: 'edges',
					data: {
						id: `${serviceName}-${address.ip}`,
						source: serviceNode.data.id,
						target: node.data.id,
					},
					scratch: {
						_ports: portList
					}
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
	#endpointSelect;
	#alertPlaceholder;
	#graph;
	#namespaceList;
	#endpointList;

	constructor(namespaceSelect, endpointSelect, alertPlaceholder, graph) {
		this.#namespaceSelect = namespaceSelect;
		this.#endpointSelect = endpointSelect;
		this.#alertPlaceholder = alertPlaceholder;
		this.#graph = graph;
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

	updateGraph() {
		const service = this.#endpointList.items.find(item => item.metadata.name == this.service);
		if (service) {
			this.#graph.setService(service);
		}
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
		return currentSelectOption(this.#endpointSelect);
	}

	get namespaces() {
		return this.#namespaceList;
	}

	get services() {
		return this.#endpointList;
	}

	set namespaces(namespaces) {
		this.#namespaceList = namespaces;
		fillSelectWithKubernetesList(this.#namespaceSelect, namespaces);
	}

	set services(services) {
		this.#endpointList = services;
		fillSelectWithKubernetesList(this.#endpointSelect, services);
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
	const err = document.getElementById('alert-placeholder');

	const graphContainer = document.getElementById('cy');
	const graph = new Graph(graphContainer);

	const app = new App(ns, svc, err, graph);

	const updateNamespace = async () => {
		return fetchNamespaces().then(namespaces => app.namespaces = namespaces);
	};

	const updateServices = async () => {
		return fetchServices(app.namespace)
		.then(services => {
			app.services = services;
			app.updateGraph();
		});
	};

	const showError = e => {
		app.error('cause' in e ? `${e.message}: ${e.cause.message}` : e.message);
	};

	updateNamespace().then(updateServices).catch(showError);

	app.addEventListenerToNamespaceSelect('change', () => updateServices().catch(showError));
	app.addEventListenerToServiceSelect('change', () => app.updateGraph());
}
