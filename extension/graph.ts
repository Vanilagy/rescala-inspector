import { writable } from "svelte/store";
import { Emitter } from "./emitter";
import { extractPathFromReScalaResource, parseReScalaValue, type ReScalaEvent, type ReScalaResource, type ReScalaValue } from "./re_scala";
import { remove } from "./utils";

export interface GraphNode {
    id: number,
    label: string,
    reScalaResource: ReScalaResource
}
export type GraphEdge = [GraphNode, GraphNode];

export interface HistoryEntry {
    nodes: GraphNode[],
    edges: GraphEdge[],
    values: Map<GraphNode, ReScalaValue>,
    events: ReScalaEvent[]
}

export class Graph extends Emitter<{
    'change': void
}> {
    nodes: GraphNode[] = [];
    edges: GraphEdge[] = [];
    values = new Map<GraphNode, ReScalaValue>();
    history = writable<HistoryEntry[]>([{
        nodes: [],
        edges: [],
        values: new Map(),
        events: []
    }]);

    addNode(node: GraphNode) {
        this.nodes.push(node);
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

    processReScalaEvents(events: ReScalaEvent[]) {
        if (events.length === 0) return;

        for (let event of events) this.processReScalaEvent(event);

        this.history.update(x => [...x, {
            nodes: [...this.nodes],
            edges: [...this.edges],
            values: new Map(this.values.entries()),
            events
        }]);
    }

    processReScalaEvent(event: ReScalaEvent) {
        if (event.type === 'Create') {
            event.resource.path = extractPathFromReScalaResource(event.resource);

            let newNode: GraphNode = {
                id: event.resource.idCounter,
                label: event.resource.enclosing.split('#').at(-1).split(':')[0].split(' ').at(-1).split('.').at(-1),
                reScalaResource: event.resource
            };
            if (this.nodes.some(x => x.id === newNode.id)) throw new Error("Node already exists!");
            this.addNode(newNode);

            this.values.set(newNode, parseReScalaValue(event.value));

            if (!event.inputs) return;

            for (let input of event.inputs) {
                let node = this.nodes.find(x => x.id === input.idCounter);
                if (node) this.addEdge(node, newNode);
                else throw new Error("Missing node!");
            }
        } else if (event.type === 'Discover') {
            let n1 = this.nodes.find(x => x.id === event.source.idCounter);
            let n2 = this.nodes.find(x => x.id === event.sink.idCounter);
            if (!n1 || !n2) throw new Error("Missing node(s)!");

            if (this.edges.some(x => x[0] === n1 && x[1] === n2)) return;
            this.addEdge(n1, n2);
        } else if (event.type === 'Value') {
            let n = this.nodes.find(x => x.id === event.source.idCounter);
            this.values.set(n, parseReScalaValue(event.value));

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
}