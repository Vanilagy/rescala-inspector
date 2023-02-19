import { Emitter } from "./emitter";
import { remove } from "./utils";

export interface GraphNode {
    id: number,
    label: string,
    value: string
}
export type GraphEdge = [GraphNode, GraphNode];

interface ReScalaResource {
    idCounter: number,
    description: string,
    enclosing: string,
    file: string,
    line: number
}

export type ReScalaEvent = {
    type: 'Create',
    resource: ReScalaResource,
    inputs?: ReScalaResource[]
} | {
    type: 'Discover',
    source: ReScalaResource,
    sink: ReScalaResource
} | {
    type: 'Value',
    source: ReScalaResource,
    value: string
} | {
    type: 'Drop',
    source: ReScalaResource,
    sink: ReScalaResource
}

export class Graph extends Emitter<{
    'change': void
}> {
    nodes: GraphNode[] = [];
    edges: GraphEdge[] = [];

    addNode(node: GraphNode) {
        this.nodes.push(node);
        this.emit('change');
    }

    addEdge(from: GraphNode, to: GraphNode) {
        this.edges.push([from, to]);
        this.emit('change');
    }

    removeEdge(edge: GraphEdge) {
        console.log(this.edges.length, edge);
        remove(this.edges, edge);
        this.emit('change');
    }

    processReScalaEvents(events: ReScalaEvent[]) {
        for (let event of events) this.processReScalaEvent(event);
    }

    processReScalaEvent(event: ReScalaEvent) {
        if (event.type === 'Create') {
            let newNode: GraphNode = {
                id: event.resource.idCounter,
                label: event.resource.enclosing.split('#').at(-1).split(':')[0].split(' ').at(-1).split('.').at(-1),
                value: null
            };
            if (this.nodes.some(x => x.id === newNode.id)) throw new Error("Node already exists!");
            this.addNode(newNode);

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
            n.value = event.value;
        } else if (event.type === 'Drop') {
            let n1 = this.nodes.find(x => x.id === event.source.idCounter);
            let n2 = this.nodes.find(x => x.id === event.sink.idCounter);
            if (!n1 || !n2) throw new Error("Missing node(s)!");

            let edge = this.edges.find(x => x[0] === n1 && x[1] === n2);
            if (!edge) throw new Error("Ain't no way");
            this.removeEdge(edge);
        }
    }
}