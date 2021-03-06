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

function clearChildren(select) {
	const range = document.createRange();
	range.selectNodeContents(select);
	range.deleteContents();
}

function fillSelect(select, items) {
	clearChildren(select);
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
	const entries = list.items.map(item => item.metadata.name);
	fillSelect(select, entries);
}

class Graph {
	#cy;
	#nodes;
	#container;
	#service;

	constructor(container, service) {
		const nodeSize = '80px';
		const cy = cytoscape({
			userPanningEnabled: false,
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
						'font-size': '16px',
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
		this.#container = container;
		this.#service = service;

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
			position: { x: 0, y: 0 }
		};

		this.#nodes = cy.add(serviceNode);
	}

	mount() {
		this.#cy.mount(this.#container);
		const layout = this.#cy.layout({
			name: 'circle',
			animate: true,
			animationDuration: 500,
			startAngle: 1 / 2 * Math.PI,
		});
		layout.run();
	}

	destroy() {
		this.#cy.unmount();
		this.#cy.destroy();
	}

	addAddress(address, ports) {
		const node = {
			group: 'nodes',
			data: {
				id: address.ip
			},
			scratch: {
				_label: address.ip + ':' + ports.map(item => `${item.port}/${item.protocol}`).join(',')
			},
			classes: [
				'endpoint',
			],
			position: {x: 0, y: 0}
		};
		const edge = {
			group: 'edges',
			data: {
				id: `${this.#service.metadata.name}-${address.ip}`,
				source: this.#service.metadata.name,
				target: node.data.id,
			},
		};
		this.#cy.add(node);
		this.#cy.add(edge);
	}
}

function makeSelect(selectId) {
	const select = document.createElement('select');
	select.setAttribute('id', selectId);
	select.classList.add('kubernetes-badge', 'kubernetes-select','form-select');
	return select;
}

function makeLabel(text) {
	const label = document.createElement('span');
	label.classList.add('kubernetes-badge', 'kubernetes-label', 'form-select');
	const textNode = document.createTextNode(text);
	label.appendChild(textNode);
	return label;
}

function makeEntity(logoPath, elementNextToLogo) {
	const wrapper = document.createElement('div');
	wrapper.classList.add('entity-wrapper');
	const container = document.createElement('div');
	container.classList.add('entity-container');
	const selectWrapper = document.createElement('div');
	selectWrapper.classList.add('kubernetes-badge-wrapper');
	const img = document.createElement('img');
	img.setAttribute('src', logoPath);
	img.classList.add('kubernetes-badge-logo');
	selectWrapper.appendChild(img);
	selectWrapper.appendChild(elementNextToLogo);
	container.appendChild(selectWrapper);
	wrapper.appendChild(container);
	return wrapper;
}

function makeNodeGrid() {
	const grid = document.createElement('div');
	grid.setAttribute('id', 'node-grid');
	grid.classList.add('row', 'g-0');
	return grid;
}

class App {
	#alertPlaceholder;
	#namespaceList;
	#serviceList;
	#nodeList;
	#graphs;

	constructor(main, alertPlaceholder) {
		this.#alertPlaceholder = alertPlaceholder;
		this.#graphs = new Map();
		this.namespaceSelect = makeSelect('namespace-select');
		const namespaceEntity = makeEntity('/assets/icons/kubernetes/svg/labeled/ns.svg', this.namespaceSelect);
		main.appendChild(namespaceEntity);
		this.serviceSelect = makeSelect('service-select');
		const serviceEntity = makeEntity('/assets/icons/kubernetes/svg/labeled/svc.svg', this.serviceSelect);
		namespaceEntity.getElementsByClassName('entity-container')[0].appendChild(serviceEntity);
		this.nodeGrid = makeNodeGrid();
		serviceEntity.getElementsByClassName('entity-container')[0].appendChild(this.nodeGrid);
	}

	updateGraph() {
		const service = this.service;
		if (!service) {
			return;
		}
		const endpoints = this.endpoints;
		if (!('subsets' in endpoints)) {
			this.warning(`${service.metadata.name} has no endpoints to show`);
			return;
		}

		this.#graphs.forEach(graph => graph.destroy());

		this.#graphs.clear();

		clearChildren(this.nodeGrid);

		const items = this.#nodeList.items;

		const columnClasses = ['col'];
		if (items.length > 1) {
			columnClasses.push('col-xl-6');
			if (items.length > 2) {
				columnClasses.push('col-xxl-4');
			}
		}

		items.forEach(node => {
			const nodeName = node.metadata.name;
			const col = document.createElement('div');
			col.classList.add(...columnClasses);
			const graphContainer = document.createElement('div');
			graphContainer.setAttribute('id', 'graph-' + nodeName);
			graphContainer.classList.add('graph-container');
			const nodeEntity = makeEntity('/assets/icons/kubernetes/svg/labeled/node.svg', makeLabel(nodeName));
			nodeEntity.getElementsByClassName('entity-container')[0].appendChild(graphContainer);
			col.appendChild(nodeEntity);
			this.nodeGrid.appendChild(col);
			const graph = new Graph(graphContainer, service);
			this.#graphs.set(nodeName, graph);
		});

		endpoints.subsets.forEach(subset => {
			const ports = subset.ports;
			subset.addresses.forEach(address => {
				const nodeName = address.nodeName;
				if (!nodeName) return;
				const graph = this.#graphs.get(nodeName);
				graph.addAddress(address, ports);
			});
		});

		this.#graphs.forEach(graph => {
			graph.mount();
		});
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
		return this.#namespaceList.items[this.namespaceSelect.selectedIndex];
	}

	get service() {
		return this.#serviceList.items[this.serviceSelect.selectedIndex];
	}

	get namespaces() {
		return this.#namespaceList;
	}

	get services() {
		return this.#serviceList;
	}

	get nodes() {
		return this.#nodeList;
	}

	set namespaces(namespaces) {
		this.#namespaceList = namespaces;
		fillSelectWithKubernetesList(this.namespaceSelect, namespaces);
	}

	set services(services) {
		this.#serviceList = services;
		fillSelectWithKubernetesList(this.serviceSelect, services);
	}

	set nodes(nodes) {
		this.#nodeList = nodes;
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

async function fetchNodes() {
	return apiGet('/api/nodes');
}

window.onload = function() {
	const main = document.getElementById('main');
	const alertPlaceholder = document.getElementById('alert-placeholder');

	const app = new App(main, alertPlaceholder);

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
		.then(endpoints => {
			app.endpoints = endpoints;
		});
	};

	const updateNodes = async () => {
		return fetchNodes()
		.then(nodes => app.nodes = nodes);
	};

	const updateGraph = () => app.updateGraph();

	const showError = e => {
		if (e === emptyCheckbox) {
			// intentionally left empty
		} else if (e instanceof PodlighterError) {
			app.error('cause' in e ? `${e.message}: ${e.cause.message}` : e.message);
		} else {
			throw e;
		}
	};

	updateNamespaces()
	.then(updateNodes)
	.then(updateServices)
	.then(updateEndpoints)
	.then(updateGraph)
	.catch(showError);

	app.namespaceSelect.addEventListener('change', () => {
		updateServices()
		.then(updateEndpoints)
		.then(updateGraph)
		.catch(showError);
	});
	app.serviceSelect.addEventListener('change', () => {
		updateEndpoints()
		.then(updateGraph)
		.catch(showError);
	});
}
