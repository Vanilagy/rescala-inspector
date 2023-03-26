import { get, writable } from "svelte/store";
import { Emitter } from "./emitter";
import { extractPathFromReScalaResource, parseReScalaValue, type ReScalaEvent, type ReScalaResource, type ReScalaValue } from "./re_scala";
import { remove } from "./utils";

export interface GraphNode {
    id: number,
    label: string,
    value: ReScalaValue,
    reScalaResource: ReScalaResource
}
export type GraphEdge = [GraphNode, GraphNode];

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

        for (let event of events) {
            if (event.type === 'Transaction' && event.phase === 'started') this.transactionId = event.id;
            event.batch = this.batchId;
            event.transaction = this.transactionId;
        }
        this.batchId++;

        let filteredEvents = events.filter(x => ['Create', 'Discover', 'Value', 'Drop'].includes(x.type));
        let atTheEnd = get(this.currentHistoryIndex) === get(this.history).length - 1;
        this.history.update(x => [...x, ...filteredEvents]);

        if (atTheEnd) {
            for (let event of filteredEvents) this.applyReScalaEvent(event);
            this.currentHistoryIndex.update(x => x + filteredEvents.length);
        }
    }

    setHistoryIndex(newIndex: number) {
        let history = get(this.history);
        let currentIndex = get(this.currentHistoryIndex);

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

            let newNode: GraphNode = {
                id: event.resource.idCounter,
                label: event.resource.enclosing.split('#').at(-1).split(':')[0].split(' ').at(-1).split('.').at(-1),
                value: parseReScalaValue(event.value),
                reScalaResource: event.resource
            };
            if (this.nodes.some(x => x.id === newNode.id)) throw new Error("Node already exists!");
            this.addNode(newNode);
        } else if (event.type === 'Discover') {
            let n1 = this.nodes.find(x => x.id === event.source.idCounter);
            let n2 = this.nodes.find(x => x.id === event.sink.idCounter);
            if (!n1 || !n2) throw new Error("Missing node(s)!");

            if (this.edges.some(x => x[0] === n1 && x[1] === n2)) return;
            this.addEdge(n1, n2);
        } else if (event.type === 'Value') {
            let n = this.nodes.find(x => x.id === event.source.idCounter);
            n.value = parseReScalaValue(event.value);

            this.emit('change');
        } else if (event.type === 'Drop') {
            let n1 = this.nodes.find(x => x.id === event.source.idCounter);
            let n2 = this.nodes.find(x => x.id === event.sink.idCounter);
            if (!n1 || !n2) throw new Error("Missing node(s)!");

            let edge = this.edges.find(x => x[0] === n1 && x[1] === n2);
            if (!edge) throw new Error("Attempted to drop edge that didn't exist!");
            this.removeEdge(edge);
        }
    }

    undoReScalaEvent(event: ReScalaEvent) {
        if (event.type === 'Create') {
            let node = this.nodes.find(x => x.id === event.resource.idCounter);
            if (!node) throw new Error("Missing node!");
            
            this.removeNode(node);
        } else if (event.type === 'Discover') {
            let n1 = this.nodes.find(x => x.id === event.source.idCounter);
            let n2 = this.nodes.find(x => x.id === event.sink.idCounter);
            if (!n1 || !n2) throw new Error("Missing node(s)!");

            let edge = this.edges.find(x => x[0] === n1 && x[1] === n2);
            if (!edge) throw new Error("Attempted to drop edge that didn't exist!");
            this.removeEdge(edge);
        } else if (event.type === 'Value') {
            let eventIndex = get(this.history).indexOf(event);
            let previousValue = (get(this.history).slice(0, eventIndex).reverse()
                .find(x =>
                    (x.type === 'Create' && x.resource.idCounter === event.source.idCounter)
                    || (x.type === 'Value' && x.source.idCounter === event.source.idCounter)
                ) as any).value;
            
            let n = this.nodes.find(x => x.id === event.source.idCounter);
            n.value = parseReScalaValue(previousValue);

            this.emit('change');
        } else if (event.type === 'Drop') {
            let n1 = this.nodes.find(x => x.id === event.source.idCounter);
            let n2 = this.nodes.find(x => x.id === event.sink.idCounter);
            if (!n1 || !n2) throw new Error("Missing node(s)!");

            if (this.edges.some(x => x[0] === n1 && x[1] === n2)) return;
            this.addEdge(n1, n2);
        }
    }
}