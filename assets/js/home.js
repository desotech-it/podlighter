'use strict';

class PodlighterError extends Error {
  constructor(...params) {
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PodlighterError);
    }

    this.name = 'PodlighterError';
  }
}

async function fetchJSON(url) {
	return fetch(url)
	.then(response => {
		if (response.ok) {
			return response.json();
		} else {
			throw new PodlighterError(`${url} returned ${response.status} (${response.statusText})`);
		}
	});
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
		const nodeSize = '75%';
		const cy = cytoscape({
			container: container,
			style: [
				{
					selector: 'node',
					style: {
						'label': ele => ele.scratch()._label,
						'background-fit': 'contain',
						'background-opacity': 0,
						'width': nodeSize,
						'height': nodeSize,
						'font-family': 'SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace',
						'font-size': '0.8em',
					}
				},
				{
					selector: '.endpoint',
					style: {
						'background-image': '/assets/icons/kubernetes/svg/labeled/pod.svg',
					}
				},
				{
					selector: '.service',
					style: {
						'text-valign': 'bottom',
						'text-wrap': 'wrap',
						'background-image': '/assets/icons/kubernetes/svg/labeled/svc.svg',
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

	update(service, endpoints) {
		const serviceName = service.metadata.name;
		const serviceClusterIP = service.spec.clusterIP;
		const servicePorts = service.spec.ports;
		const serviceLabel = `(${serviceName})\n${serviceClusterIP}:`
			+ servicePorts.map(item => `${item.port}/${item.protocol}`).join(',');
		const serviceNode = {
			group: 'nodes',
			data: {
				id: serviceName,
				weight: 75
			},
			scratch: {
				_label: serviceLabel

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
					classes: [
						'endpoint',
					],
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
		const service = this.service;
		if (!service) {
			return;
		}
		const endpoints = this.endpoints;
		if (!('subsets' in endpoints)) {
			this.warning(`${service} has no endpoints to show`);
			return;
		}
		this.#graph.update(service, endpoints);
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
		return this.#namespaceList.items[this.#namespaceSelect.selectedIndex];
	}

	get service() {
		return this.#serviceList.items[this.#serviceSelect.selectedIndex];
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
	return fetchJSON(url).catch(e => { throw new PodlighterError(`GET ${url} failed`, { cause: e }); });
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

	const emptyCheckbox = new PodlighterError(null);

	const updateNamespaces = async () => {
		return fetchNamespaces()
		.then(namespaces => app.namespaces = namespaces);
	};

	const updateServices = async () => {
		const namespace = app.namespace;
		if (!namespace) {
			throw emptyCheckbox;
		}
		return fetchServices(namespace.metadata.name)
		.then(services => app.services = services);
	};

	const updateEndpoints = async () => {
		const service = app.service;
		if (!service) {
			throw emptyCheckbox;
		}
		const namespace = app.namespace;
		if (!namespace) {
			throw new emptyCheckbox;
		}
		return fetchEndpoints(service.metadata.name, namespace.metadata.name)
		.then(endpoints => app.endpoints = endpoints);
	};

	const updateGraph = () => app.updateGraph();

	const showError = e => {
		if (e == emptyCheckbox) {
			// intentionally left empty
		} else if (e instanceof PodlighterError) {
			app.error('cause' in e ? `${e.message}: ${e.cause.message}` : e.message);
		} else {
			throw e;
		}
	};

	updateNamespaces()
	.then(updateServices)
	.then(updateEndpoints)
	.then(updateGraph)
	.catch(showError);

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
