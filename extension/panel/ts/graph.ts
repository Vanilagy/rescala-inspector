import { get, writable } from 'svelte/store';
import {
	extractPathFromReScalaResource,
	parseReScalaValue,
	type ReScalaEvent,
	type ReScalaResource,
	type ReScalaValue
} from './re_scala';
import { Emitter, remove } from './utils';

export interface GraphNode {
	id: number,
	label: string,
	value: ReScalaValue,
	reScalaResource: ReScalaResource
}
export type GraphEdge = [GraphNode, GraphNode];

/** Base graph class, holding all of the actual nodes and the definition of the graph. */
export class Graph extends Emitter<{
	'change': void
}> {
	nodes: GraphNode[] = [];
	edges: GraphEdge[] = [];
	history = writable<ReScalaEvent[]>([]);
	currentHistoryIndex = writable(-1);
	batchId = 0;
	transactionId = -1;

	addNode(node: GraphNode) {
		this.nodes.push(node);
		this.emit('change');
	}

	removeNode(node: GraphNode) {
		remove(this.nodes, node);
		this.emit('change');
	}

	addEdge(from: GraphNode, to: GraphNode) {
		this.edges.push([from, to]);
		this.emit('change');
	}

	removeEdge(edge: GraphEdge) {
		remove(this.edges, edge);
		this.emit('change');
	}

	supplyReScalaEvents(events: ReScalaEvent[]) {
		if (events.length === 0) return;

		// Label events with batch and transaction
		for (const event of events) {
			if (event.type === 'Transaction' && event.phase === 'started') this.transactionId = event.id;
			event.batch = this.batchId;
			event.transaction = this.transactionId;
		}
		this.batchId++;

		const filteredEvents = events.filter(x => ['Create', 'Discover', 'Value', 'Drop'].includes(x.type));
		const atTheEnd = get(this.currentHistoryIndex) === get(this.history).length - 1;
		this.history.update(x => [...x, ...filteredEvents]);

		if (atTheEnd) {
			// If we were already at the end, let's stick to the end
			for (const event of filteredEvents) this.applyReScalaEvent(event);
			this.currentHistoryIndex.update(x => x + filteredEvents.length);
		}
	}

	setHistoryIndex(newIndex: number) {
		const history = get(this.history);
		const currentIndex = get(this.currentHistoryIndex);

		// Based on the direction we need to go, apply or undo events
		if (newIndex > currentIndex) {
			for (let i = currentIndex + 1; i <= newIndex; i++) {
				this.applyReScalaEvent(history[i]);
			}
		} else {
			for (let i = currentIndex; i > newIndex; i--) {
				this.undoReScalaEvent(history[i]);
			}
		}

		this.currentHistoryIndex.set(newIndex);
	}

	applyReScalaEvent(event: ReScalaEvent) {
		if (event.type === 'Create') {
			event.resource.path = extractPathFromReScalaResource(event.resource);

			const newNode: GraphNode = {
				id: event.resource.idCounter,
				label: event.resource.enclosing.split('#').at(-1).split(':')[0].split(' ').at(-1).split('.').at(-1),
				value: parseReScalaValue(event.value),
				reScalaResource: event.resource
			};

			if (this.nodes.some(x => x.id === newNode.id)) {
				console.warn('Node already exists!');
				return;
			}

			this.addNode(newNode);

			if (event.value) newNode.value = parseReScalaValue(event.value);
		} else if (event.type === 'Discover') {
			const n1 = this.nodes.find(x => x.id === event.source.idCounter);
			const n2 = this.nodes.find(x => x.id === event.sink.idCounter);

			if (!n1 || !n2) {
				console.warn('Missing node(s)!');
				return;
			}

			if (this.edges.some(x => x[0] === n1 && x[1] === n2)) return;
			this.addEdge(n1, n2);
		} else if (event.type === 'Value') {
			const n = this.nodes.find(x => x.id === event.source.idCounter);
			n.value = parseReScalaValue(event.value);

			this.emit('change');
		} else if (event.type === 'Drop') {
			const n1 = this.nodes.find(x => x.id === event.source.idCounter);
			const n2 = this.nodes.find(x => x.id === event.sink.idCounter);

			if (!n1 || !n2) {
				console.warn('Missing node(s)!');
				return;
			}

			const edge = this.edges.find(x => x[0] === n1 && x[1] === n2);
			if (!edge) {
				console.warn('Attempted to drop edge that didn\'t exist!');
				return;
			}

			this.removeEdge(edge);
		}
	}

	undoReScalaEvent(event: ReScalaEvent) {
		if (event.type === 'Create') {
			const node = this.nodes.find(x => x.id === event.resource.idCounter);
			if (!node) {
				console.warn('Missing node!');
				return;
			}

			this.removeNode(node);
		} else if (event.type === 'Discover') {
			const n1 = this.nodes.find(x => x.id === event.source.idCounter);
			const n2 = this.nodes.find(x => x.id === event.sink.idCounter);

			if (!n1 || !n2) {
				console.warn('Missing node(s)!');
				return;
			}

			const edge = this.edges.find(x => x[0] === n1 && x[1] === n2);
			if (!edge) {
				console.warn('Attempted to drop edge that didn\'t exist!');
				return;
			}

			this.removeEdge(edge);
		} else if (event.type === 'Value') {
			const eventIndex = get(this.history).indexOf(event);
			const previousValue = (get(this.history).slice(0, eventIndex).reverse()
				.find(x =>
					(x.type === 'Create' && x.resource.idCounter === event.source.idCounter)
                    || (x.type === 'Value' && x.source.idCounter === event.source.idCounter)
				) as any).value;

			const n = this.nodes.find(x => x.id === event.source.idCounter);
			n.value = parseReScalaValue(previousValue);

			this.emit('change');
		} else if (event.type === 'Drop') {
			const n1 = this.nodes.find(x => x.id === event.source.idCounter);
			const n2 = this.nodes.find(x => x.id === event.sink.idCounter);

			if (!n1 || !n2) {
				console.warn('Missing node(s)!');
				return;
			}

			if (this.edges.some(x => x[0] === n1 && x[1] === n2)) return;
			this.addEdge(n1, n2);
		}
	}
}
