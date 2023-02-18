import { Emitter } from "./emitter";

export interface GraphNode {
    id: number,
    label: string,
    value: string
}
export type GraphEdge = [GraphNode, GraphNode];

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
    }
}