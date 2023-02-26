import type { Graph, GraphNode } from "./graph";
import { NODE_WIDTH, NODE_HEIGHT, ANIMATION_DURATION } from "./rendered_graph";
import { EaseType, Tweened } from "./tween";
import { lerp, lerpPoints, remove } from "./utils";

const DUMMY_NODE_HEIGHT_FACTOR = 1/3;

export class LayoutNode {
    layer: number = 0;
    x: number = 0;
    a: number;
    in: LayoutNode[] = [];
    out: LayoutNode[] = [];
    component: number = null;
    neighbor: LayoutNode = null;

    tweenedPosition = new Tweened<{ x: number, y: number}>(
        null,
        ANIMATION_DURATION,
        lerpPoints,
        EaseType.EaseOutElasticQuarter
    );
    visibility = new Tweened(
        0,
        ANIMATION_DURATION,
        lerp,
        EaseType.EaseOutQuint
    );

    constructor(public node?: GraphNode) {
        this.visibility.target = 1;
    }

    get isDummy() {
        return !this.node;
    }

    get height() {
        return this.isDummy ? DUMMY_NODE_HEIGHT_FACTOR : 1;
    }

    computePosition(center = false) {
        let x = 350 * -this.layer;
        let y = 100 * this.x;
        let pos = { x, y };

        if (center) {
            pos.x += NODE_WIDTH/2;
            pos.y += NODE_HEIGHT/2;
        }

        return pos;
    }

    visualPosition(time?: number) {
        let actualPosition = this.computePosition();
        if (!this.tweenedPosition.target || this.tweenedPosition.target.x !== actualPosition.x || this.tweenedPosition.target.y !== actualPosition.y) {
            this.tweenedPosition.target = actualPosition;
        }

        let visibility = this.visibility.valueAt(time);
        let pos = this.tweenedPosition.valueAt(time);

        pos.y -= (1 - visibility) * 100;

        return pos;
    }

    visualHeight(time?: number) {
        return lerp(NODE_HEIGHT/2, NODE_HEIGHT, this.visibility.valueAt(time));
    }

    visualCenter(time?: number) {
        let pos = this.visualPosition(time);
        pos.x += NODE_WIDTH/2;
        pos.y += this.visualHeight(time)/2;

        return pos;
    }

    posOnBorder(angle: number, time?: number) {
        let { x: centerX, y: centerY } = this.visualCenter(time);

        let margin = 7;
        let extendedWidth = NODE_WIDTH/2 + margin;
        let extendedHeight = NODE_HEIGHT/2 + margin;

        let x = Math.cos(angle) * extendedWidth;
        let y = Math.sin(angle) * extendedHeight;

        if (Math.abs(Math.tan(angle)) < 1) { // equiv to Math.abs(Math.cos(angle)) < Math.abs(Math.tan(angle))
            let fac = extendedWidth / Math.abs(x);
            x *= fac;
            y *= fac;
        } else {
            let fac = extendedHeight / Math.abs(y);
            x *= fac;
            y *= fac;
        }

        return {
            x: centerX + x,
            y: centerY + y
        };
    }
}

export class LayoutEdge extends Array<LayoutNode> {
    waypoints: LayoutNode[] = [this[0], this[1]];

    constructor(from: LayoutNode, to: LayoutNode) {
        super(from, to);
    }

    get span() {
        return this[0].layer - this[1].layer;
    }
}

export class GraphLayout {
    nodes: LayoutNode[] = [];
    edges: LayoutEdge[] = [];

    constructor(public graph: Graph) {}

    addNode(layoutNode: LayoutNode) {
        this.nodes.push(layoutNode);
    }

    addEdge(from: LayoutNode, to: LayoutNode) {
        this.edges.push(new LayoutEdge(from, to));

        from.out.push(to);
        to.in.push(from);
    }

    removeEdge(edge: LayoutEdge) {
        remove(this.edges, edge);
        remove(edge[0].out, edge[1]);
        remove(edge[1].in, edge[0]);
    }

    layOut() {
        this.assignLayers();
        this.createDummyNodes();
        this.assignComponents();
        this.decross();
        this.solve();
    }

    reconcile() {
        for (let node of this.graph.nodes) {
            if (this.nodes.some(x => x.node === node)) continue;
            let layoutNode = new LayoutNode(node);
            this.addNode(layoutNode);
        }

        for (let edge of [...this.edges]) this.removeEdge(edge);

        for (let edge of this.graph.edges) {
            let from = this.nodes.find(x => x.node === edge[0]);
            let to = this.nodes.find(x => x.node === edge[1]);

            if (from.out.includes(to)) continue;
            this.addEdge(from, to);
        }
    }

    assignLayers() {
        let longestOutgoingPathCache = new Map<LayoutNode, number>();
        const longestOutgoingPath = (node: LayoutNode) => {
            if (longestOutgoingPathCache.has(node)) return longestOutgoingPathCache.get(node);

            let res: number;
            if (node.out.length === 0) res = 0;
            else res = Math.max(...node.out.map(longestOutgoingPath)) + 1;

            longestOutgoingPathCache.set(node, res);
            return res;
        };
        for (let node of this.nodes) node.layer = longestOutgoingPath(node);

        // See if long edges can be shortened
        let done = new Set<LayoutEdge>();
        while (true) {
            let nextEdge = this.edges
                .filter(x => x.span >= 2)
                .sort((a, b) => b[1].layer - a[1].layer)
                .find(x => !done.has(x));
            if (!nextEdge) break;

            let node = nextEdge[1];
            let parents = this.edges.filter(x => x[1] === node).map(x => x[0]);

            const computeConnectedEdgeLength = () => {
                return this.edges
                    .filter(x => x[0] === node || parents.includes(x[0]) || parents.includes(x[1]))
                    .reduce((a, b) => {
                        // If the two layers match (difference = 0), return Infinity, because we never want that to happen
                        return a + (b.span || Infinity);
                    }, 0);
            };

            let maxLayer = Math.max(...parents.map(x => x.layer));

            while (true) {
                let len = computeConnectedEdgeLength();
                node.layer++;
                let before = parents.map(x => x.layer);
                parents.forEach(x => x.layer = Math.max(x.layer, node.layer + 1));

                let newMaxLayer = Math.max(...parents.map(x => x.layer));

                if (computeConnectedEdgeLength() > len || newMaxLayer > maxLayer) {
                    parents.forEach((x, i) => x.layer = before[i]);
                    node.layer--;

                    break;
                }
            }

            done.add(nextEdge);
        }
    }

    createDummyNodes() {
        // Add dummy nodes for long edges
        for (let j = 0; j < this.edges.length; j++) {
            let edge = this.edges[j];
            if (edge.span <= 1) continue;

            this.removeEdge(edge);
            j--;

            let prevNode = edge[0];
            for (let i = edge[0].layer; i > edge[1].layer; i--) {
                let nextNode = i === edge[1].layer + 1
                    ? edge[1]
                    : new LayoutNode();
                nextNode.layer = i - 1;

                if (nextNode !== edge[1]) this.addNode(nextNode);
                this.addEdge(prevNode, nextNode);

                prevNode = nextNode;
            }
        }
    }

    assignComponents() {
        for (let node of this.nodes) node.component = null;

        const computeComponent = (node: LayoutNode, i: number) => {
            if (node.component !== null) return;

            node.component = i;
            for (let child of node.out) computeComponent(child, i);
            for (let parent of node.in) computeComponent(parent, i);
        };
        this.nodes.filter(x => x.in.length === 0).forEach(computeComponent);
    }

    computeNeighbors() {
        for (let node of this.nodes) node.neighbor = null;

        let sortedNodes = [...this.nodes].sort((a, b) => a.x - b.x).sort((a, b) => a.layer - b.layer);
        for (let i = 0; i < sortedNodes.length-1; i++) {
            let n1 = sortedNodes[i];
            let n2 = sortedNodes[i+1];
            
            if (n1.layer === n2.layer) n1.neighbor = n2;
        }

        return sortedNodes;
    }

    spreadOut(factor = 1) {
        let highestLayer = Math.max(...this.nodes.map(x => x.layer));
        for (let layer = 0; layer <= highestLayer; layer++) {
            this.nodes
                .filter(x => x.layer === layer)
                .sort((a, b) => a.x - b.x)
                .sort((a, b) => a.component - b.component)
                .forEach((n, i) => n.x = i * factor);
        }
    }

    decross() {
        let last: LayoutNode[] = null;

        let j: number;
        for (j = 0; j < 100; j++) {
            this.solve(true, 50);
            let sortedNodes = this.computeNeighbors();
            this.spreadOut();

            if (last && last.every((n, i) => n === sortedNodes[i])) break;

            last = sortedNodes;
        }
    }

    computeForces(noCollision: boolean) {
        for (let node of this.nodes) node.a = 0;
        for (let edge of this.edges) {
            let force = (edge[0].x + edge[0].height/2) - (edge[1].x + edge[1].height/2);
            if (noCollision) force = edge[0].x - edge[1].x;

            edge[0].a -= force / 2;
            edge[1].a += force / 2;
        }

        if (noCollision) return;

        for (let node of this.nodes) {
            if (!node.neighbor) continue

            // Spring force between nodes of the same layer
            let dist = node.neighbor.x - (node.x + node.height);
            let wanted = 1;
            let delta = Math.max(wanted - dist, 0);

            let force = 0.5 * delta;
            node.a -= force;
            node.neighbor.a += force;
        }

        let did = new Set<LayoutNode>();
        for (let node of this.nodes) {
            if (did.has(node)) continue;

            let connected = [node];
            while (
                connected.at(-1).neighbor &&
                connected.at(-1).neighbor.x - (connected.at(-1).x + connected.at(-1).height + 1e-6) <= 0
            ) {
                connected.push(connected.at(-1).neighbor);
            }

            connected.forEach(x => did.add(x));
            if (connected.length === 1) continue;

            // Need to do it twice, otherwise there was a little bit of constant translation over time
            for (let $ = 0; $ < 2; $++) for (let d = 1; d >= -1; d -= 2) {
                let currentSum = 0;
                let currentStart = d === 1 ? 0 : connected.length-1;
                let end = connected.length-1 - currentStart;

                for (
                    let i = currentStart;
                    d*i <= d*end;
                    i += d
                ) {
                    currentSum += connected[i].a;
                    let currentAvg = currentSum / (d*(i-currentStart) + 1);

                    if (i === end || d*currentAvg < d*connected[i + d].a - 1e-6) {
                        for (let j = currentStart; d*j <= d*i; j += d) {
                            connected[j].a = currentAvg;
                        }
                        currentSum = 0;
                        currentStart = i + d;
                    }
                }
            }

            for (let n of connected.slice(0, -1)) {
                let force = 0.25 * Math.min(n.neighbor.x - (n.x + n.height), 0);

                for (let m of connected) {
                    let sign = connected.indexOf(m) <= connected.indexOf(n) ? 1 : -1;
                    m.a += sign * force;
                }
            }
        }
    }

    solve(noCollision = false, iters?: number) {
        let h = 0.25;

        for (let i = 0; i < (iters ?? 500); i++) {
            let x = this.nodes.map(n => n.x);
            this.computeForces(noCollision);
            this.nodes.forEach(n => n.x += h * n.a);

            if (iters !== undefined) continue;

            let highestDx = Math.max(...this.nodes.map((n, i) => Math.abs(x[i] - n.x)));
            if (highestDx < 0.001) {
                break;
            }
        }
    }
}