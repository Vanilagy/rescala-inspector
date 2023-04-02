import { get } from 'svelte/store';
import type { GraphNode } from './graph';
import type { RenderedGraph, PathStructureNode } from './rendered_graph';
import { remove } from './utils';

const DUMMY_NODE_HEIGHT_FACTOR = 1/3;

export class LayoutNode {
	layer = 0;
	x = 0;
	a: number;
	in: LayoutNode[] = [];
	out: LayoutNode[] = [];
	component: number = null;
	neighbor: LayoutNode = null;

	constructor(public node?: GraphNode) {}

	get isDummy() {
		return !this.node;
	}

	get height() {
		return this.isDummy ? DUMMY_NODE_HEIGHT_FACTOR : 1;
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

export class LayoutGraph {
	nodes: LayoutNode[] = [];
	edges: LayoutEdge[] = [];

	constructor(public renderedGraph: RenderedGraph) {}

	addNode(layoutNode: LayoutNode) {
		this.nodes.push(layoutNode);
	}

	addEdge(from: LayoutNode, to: LayoutNode) {
		this.edges.push(new LayoutEdge(from, to));

		from.out.push(to);
		to.in.push(from);
	}

	removeNode(layoutNode: LayoutNode) {
		remove(this.nodes, layoutNode);
	}

	removeEdge(edge: LayoutEdge) {
		remove(this.edges, edge);
		remove(edge[0].out, edge[1]);
		remove(edge[1].in, edge[0]);
	}

	layOut() {
		if (this.nodes.length === 0) return;

		this.assignLayers();
		this.createDummyNodes();
		this.assignComponents();
		this.decross();
		this.solve();
	}

	pathIsShown(node: PathStructureNode, path: string[]) {
		if (!node.shown) return false;
		const child = node.children.find(x => x.label === path[0]);
		if (!child) return true;
		return this.pathIsShown(child, path.slice(1));
	}

	reconcile() {
		const { nodes, edges } = this.renderedGraph.graph;

		const shownNodes = nodes.filter(x =>
			this.pathIsShown(get(this.renderedGraph.pathStructureRoot), x.reScalaResource.path.slice(0, -1))
		);
		for (const node of shownNodes) {
			if (this.nodes.some(x => x.node === node)) continue;
			const layoutNode = new LayoutNode(node);
			this.addNode(layoutNode);
		}
		for (const node of [...this.nodes]) {
			if (shownNodes.some(x => x === node.node) && !node.isDummy) continue;
			this.removeNode(node);
		}

		for (const edge of [...this.edges]) this.removeEdge(edge);

		for (const node of shownNodes) {
			const outgoingEdges = edges.filter(x => x[0] === node);
			while (true) {
				let changed = false;

				for (let i = 0; i < outgoingEdges.length; i++) {
					const edge = outgoingEdges[i];
					if (shownNodes.includes(edge[1])) continue;

					outgoingEdges.splice(i--, 1, ...edges.filter(y => y[0] === edge[1]));
					changed = true;
				}

				if (!changed) break;
			}

			for (const edge of outgoingEdges) {
				const from = this.nodes.find(x => x.node === edge[0]);
				const to = this.nodes.find(x => x.node === edge[1]);
				if (!from || !to) continue;

				if (from.out.includes(to)) continue;
				this.addEdge(from, to);
			}
		}
	}

	assignLayers() {
		const longestOutgoingPathCache = new Map<LayoutNode, number>();
		const longestOutgoingPath = (node: LayoutNode) => {
			if (longestOutgoingPathCache.has(node)) return longestOutgoingPathCache.get(node);

			let res: number;
			if (node.out.length === 0) res = 0;
			else res = Math.max(...node.out.map(longestOutgoingPath)) + 1;

			longestOutgoingPathCache.set(node, res);
			return res;
		};
		for (const node of this.nodes) node.layer = longestOutgoingPath(node);

		// See if long edges can be shortened
		const done = new Set<LayoutEdge>();
		while (true) {
			const nextEdge = this.edges
				.filter(x => x.span >= 2)
				.sort((a, b) => b[1].layer - a[1].layer)
				.find(x => !done.has(x));
			if (!nextEdge) break;

			const node = nextEdge[1];
			const parents = this.edges.filter(x => x[1] === node).map(x => x[0]);

			const computeConnectedEdgeLength = () => {
				return this.edges
					.filter(x => x[0] === node || parents.includes(x[0]) || parents.includes(x[1]))
					.reduce((a, b) => {
						// If the two layers match (difference = 0), return Infinity,
						// because we never want that to happen
						return a + (b.span || Infinity);
					}, 0);
			};

			const maxLayer = Math.max(...parents.map(x => x.layer));

			while (true) {
				const len = computeConnectedEdgeLength();
				node.layer++;
				const before = parents.map(x => x.layer);
				parents.forEach(x => x.layer = Math.max(x.layer, node.layer + 1));

				const newMaxLayer = Math.max(...parents.map(x => x.layer));

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
			const edge = this.edges[j];
			if (edge.span <= 1) continue;

			this.removeEdge(edge);
			j--;

			let prevNode = edge[0];
			for (let i = edge[0].layer; i > edge[1].layer; i--) {
				const nextNode = i === edge[1].layer + 1
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
		for (const node of this.nodes) node.component = null;

		const computeComponent = (node: LayoutNode, i: number) => {
			if (node.component !== null) return;

			node.component = i;
			for (const child of node.out) computeComponent(child, i);
			for (const parent of node.in) computeComponent(parent, i);
		};
		this.nodes.filter(x => x.in.length === 0).forEach(computeComponent);
	}

	computeNeighbors() {
		for (const node of this.nodes) node.neighbor = null;

		const sortedNodes = [...this.nodes].sort((a, b) => a.x - b.x).sort((a, b) => a.layer - b.layer);
		for (let i = 0; i < sortedNodes.length-1; i++) {
			const n1 = sortedNodes[i];
			const n2 = sortedNodes[i+1];

			if (n1.layer === n2.layer) n1.neighbor = n2;
		}

		return sortedNodes;
	}

	spreadOut(factor = 1) {
		const highestLayer = Math.max(...this.nodes.map(x => x.layer));
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

		this.computeNeighbors();
		this.spreadOut();

		for (let j = 0; j < 10; j++) {
			this.solve(true, 50);
			const sortedNodes = this.computeNeighbors();
			this.spreadOut();

			if (last && last.every((n, i) => n === sortedNodes[i])) break;

			last = sortedNodes;
		}
	}

	computeForces(noCollision: boolean) {
		for (const node of this.nodes) node.a = 0;
		for (const edge of this.edges) {
			let force = (edge[0].x + edge[0].height/2) - (edge[1].x + edge[1].height/2);
			if (noCollision) force = edge[0].x - edge[1].x;

			edge[0].a -= force / 2;
			edge[1].a += force / 2;
		}

		if (noCollision) return;

		for (const node of this.nodes) {
			if (!node.neighbor) continue;

			// Spring force between nodes of the same layer
			const dist = node.neighbor.x - (node.x + node.height);
			const wanted = 1;
			const delta = Math.max(wanted - dist, 0);

			const force = 0.5 * delta;
			node.a -= force;
			node.neighbor.a += force;
		}

		const did = new Set<LayoutNode>();
		for (const node of this.nodes) {
			if (did.has(node)) continue;

			const connected = [node];
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
				const end = connected.length-1 - currentStart;

				for (
					let i = currentStart;
					d*i <= d*end;
					i += d
				) {
					currentSum += connected[i].a;
					const currentAvg = currentSum / (d*(i-currentStart) + 1);

					if (i === end || d*currentAvg < d*connected[i + d].a - 1e-6) {
						for (let j = currentStart; d*j <= d*i; j += d) {
							connected[j].a = currentAvg;
						}
						currentSum = 0;
						currentStart = i + d;
					}
				}
			}

			for (const n of connected.slice(0, -1)) {
				const force = 0.25 * Math.min(n.neighbor.x - (n.x + n.height), 0);

				for (const m of connected) {
					const sign = connected.indexOf(m) <= connected.indexOf(n) ? 1 : -1;
					m.a += sign * force;
				}
			}
		}
	}

	solve(noCollision = false, iters?: number) {
		let lastAccel: number;
		const startingH = 0.3;
		let h = startingH;

		for (let i = 0; i < (iters ?? 500); i++) {
			this.computeForces(noCollision);

			this.nodes.forEach(n => n.x += h * n.a);

			const maxAccel = Math.max(...this.nodes.map(n => Math.abs(n.a)));
			if (lastAccel) {
				if (maxAccel < lastAccel * 1.1) {
					if (h < startingH) {
						h *= 1.25;
					} else {
						h *= 1.01;
					}
				} else {
					h *= 0.5;
				}
			}
			lastAccel = maxAccel;

			if (iters === undefined && maxAccel < 0.01) {
				break;
			}
		}
	}
}