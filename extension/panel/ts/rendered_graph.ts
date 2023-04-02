import { subscribe } from 'svelte/internal';
import { get, writable } from 'svelte/store';
import type { Graph } from './graph';
import { LayoutGraph, LayoutNode } from './layout_graph';
import { RenderedEdge } from './rendered_edge';
import { RenderedNode } from './rendered_node';
import { ease, EaseType } from './tween';
import { clamp, getPositionAlongPath, lerp, roundedRect, type Point } from './utils';

export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 70;
export const MIN_SCALE = 2**-7;
export const MAX_SCALE = 2**2;

export const ANIMATION_SPEED_OPTIONS = [10000, 3000, 1000, 500, 0];
export const animationSpeedSetting = writable(Math.floor(ANIMATION_SPEED_OPTIONS.length / 2));
export const animationDuration = () => ANIMATION_SPEED_OPTIONS[get(animationSpeedSetting)];

export type PathStructureNode = { label: string, shown: boolean, children: PathStructureNode[] };

export class RenderedGraph {
	ctx: CanvasRenderingContext2D;
	originX = 0;
	originY = 0;
	scale = writable(0.5);
	mousePosition: Point = { x: 0, y: 0 };

	layout: LayoutGraph;
	renderedNodes: RenderedNode[] = [];
	renderedEdges: RenderedEdge[] = [];
	layoutToRenderedNode = new WeakMap<LayoutNode, RenderedNode>();

	hoveredNode = writable<RenderedNode>(null);
	selectedNode = writable<RenderedNode>(null);
	selectedNodeSubtree = new WeakSet<RenderedNode>();
	pathStructureRoot = writable<PathStructureNode>({ label: 'root', shown: true, children: [] });

	graphHasChanged = true;
	showNodeBoundingBoxes = false;
	hasCenteredOnce = false;

	elevation1Color: string;
	hover1Color: string;
	hoverStrongColor: string;
	border1Color: string;
	highlight1Color: string;
	textColor: string;
	booleanColor: string;
	numberColor: string;
	stringColor: string;
	instanceColor: string;
	listColor: string;
	domElementColor: string;

	constructor(public graph: Graph, public canvas: HTMLCanvasElement) {
		graph.on('change', () => this.graphHasChanged = true);

		this.ctx = canvas.getContext('2d');
		this.layout = new LayoutGraph(this);

		subscribe(this.pathStructureRoot, () => {
			if (this.graphHasChanged) return; // Because we'll reconcile anyway
			this.reconcile();
		});
	}

	render() {
		const { ctx } = this;

		// Keep the colors in sync with the CSS variables (in case the theme has changed)
		const computedStyle = getComputedStyle(document.body);
		this.elevation1Color = `rgb(${computedStyle.getPropertyValue('--elevation-1')})`;
		this.hover1Color = `rgb(${computedStyle.getPropertyValue('--hover-1')})`;
		this.hoverStrongColor = `rgb(${computedStyle.getPropertyValue('--hover-strong')})`;
		this.border1Color = `rgb(${computedStyle.getPropertyValue('--border-1')})`;
		this.highlight1Color = `rgb(${computedStyle.getPropertyValue('--highlight-1')})`;
		this.textColor = computedStyle.getPropertyValue('color');
		this.booleanColor = `rgb(${computedStyle.getPropertyValue('--boolean')})`;
		this.numberColor = `rgb(${computedStyle.getPropertyValue('--number')})`;
		this.stringColor = `rgb(${computedStyle.getPropertyValue('--string')})`;
		this.instanceColor = `rgb(${computedStyle.getPropertyValue('--instance')})`;
		this.listColor = `rgb(${computedStyle.getPropertyValue('--list')})`;
		this.domElementColor = `rgb(${computedStyle.getPropertyValue('--dom-element')})`;

		this.onGraphChange();
		this.checkHover();

		ctx.resetTransform();

		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		ctx.translate(this.originX, this.originY);
		ctx.scale(get(this.scale), get(this.scale));

		// First, draw all edges so they're below the nodes
		for (let i = 0; i < this.renderedEdges.length; i++) {
			const edge = this.renderedEdges[i];
			if (edge.visibility.target === 0 && edge.visibility.value === 0) {
				this.renderedEdges.splice(i--, 1);
				continue;
			}
			this.drawEdge(edge);
		}

		// Then, draw the nodes
		for (let i = 0; i < this.renderedNodes.length; i++) {
			const node = this.renderedNodes[i];
			if (node.exitCompletion.target === 1 && node.exitCompletion.value === 1) {
				this.renderedNodes.splice(i--, 1);
				continue;
			}
			this.drawNode(node);
		}
	}

	drawNode(node: RenderedNode) {
		const { ctx } = this;
		const { x, y } = node.visualPosition();

		if (!node.layoutNode.isDummy) {
			this.ctx.globalAlpha = node.entryCompletion.value;

			if (this.nodeIsDimmed(node)) this.ctx.globalAlpha *= 0.15;

			const label = node.layoutNode.node.label;
			const value = node.layoutNode.node.value;

			if (node.exitCompletion.target === 1) {
				node.lastRenderedValue = null;
			} else {
				if (node.lastRenderedValue && node.lastRenderedValue !== value) {
					// Create a pulse effect whenever the value changes
					node.valueChangeCompletion.set(0);
					node.valueChangeCompletion.target = 1;
				}
				node.lastRenderedValue = value;
			}

			ctx.save();

			const scale = lerp(1, 0.75, node.exitCompletion.value)
                + lerp(0.2, 0, ease(node.valueChangeCompletion.value, EaseType.EaseOutQuint));
			this.ctx.globalAlpha *= 1 - node.exitCompletion.value;

			ctx.translate(x + NODE_WIDTH/2, y + node.visualHeight()/2);
			ctx.scale(scale, scale);
			ctx.translate(-x - NODE_WIDTH/2, -y - node.visualHeight()/2);

			roundedRect(ctx, x, y, NODE_WIDTH, node.visualHeight(), 6);

			const highlighted = get(this.hoveredNode) === node || get(this.selectedNode) === node;

			ctx.strokeStyle = highlighted ? this.hoverStrongColor : this.border1Color;
			ctx.lineWidth = 4;
			ctx.stroke();

			if (node.valueChangeCompletion.value < 1) {
				// Draw a highlighted border over the original one

				ctx.save();
				ctx.strokeStyle = this.highlight1Color;
				ctx.lineWidth = 8;
				ctx.globalAlpha *= 1 - ease(node.valueChangeCompletion.value, EaseType.EaseInQuad);
				ctx.stroke();
				ctx.restore();
			}

			ctx.fillStyle = this.elevation1Color;
			ctx.fill();

			// Draw the main text
			ctx.textAlign = 'center';
			ctx.font = '14px sans-serif';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = this.textColor;
			ctx.fillText(node.layoutNode.node.id + ' | ' + label, x + NODE_WIDTH/2, y + node.visualHeight()/2);

			// Draw the value text
			if (value) {
				if (value.type === 'boolean') ctx.fillStyle = this.booleanColor;
				else if (value.type === 'number') ctx.fillStyle = this.numberColor;
				else if (value.type === 'string') ctx.fillStyle = this.stringColor;
				else if (value.type === 'instance') ctx.fillStyle = this.instanceColor;
				else if (value.type === 'list') ctx.fillStyle = this.listColor;
				else if (value.type === 'dom-element') ctx.fillStyle = this.domElementColor;
				else if (value.type === 'unknown') ctx.globalAlpha *= 2/3;

				ctx.font = '10px monospace';
				ctx.fillText(value.short, x+NODE_WIDTH/2, y + node.visualHeight() - 10);
			}
		}

		ctx.restore();

		if (this.showNodeBoundingBoxes) {
			ctx.globalAlpha = 0.2;
			ctx.fillStyle = `hsl(${100 + 50 * this.renderedNodes.indexOf(node)}, 60%, 60%)`;
			roundedRect(ctx, x, y, NODE_WIDTH, 100 * node.layoutNode.height, 6);
			ctx.fill();
		}

		ctx.globalAlpha = 1;
	}

	nodeIsDimmed(node: RenderedNode) {
		return get(this.selectedNode) && !this.selectedNodeSubtree.has(node);
	}

	drawEdge(edge: RenderedEdge) {
		const { ctx } = this;

		const visibility = edge.visibility.value;
		ctx.globalAlpha = visibility;

		if (this.nodeIsDimmed(edge[0]) || this.nodeIsDimmed(edge[1])) {
			ctx.globalAlpha *= 0.15;
		}

		const path = edge.tweenedPath.value;

		ctx.beginPath();
		const len = Math.max(Math.ceil(path.length * visibility), 2);
		for (let i = 0; i < len; i++) {
			const { x, y } = getPositionAlongPath(path, visibility * i/(len-1));

			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.lineWidth = 2;
		ctx.strokeStyle = `hsl(${100 + 50 * edge.id}, 60%, 60%)`;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.stroke();

		const endPos = getPositionAlongPath(path, visibility);
		const rightBeforeEndPos = getPositionAlongPath(path, Math.max(visibility - 1e-6, 0));

		// Estimated derivative
		const angle = Math.atan2(
			endPos.y - rightBeforeEndPos.y,
			endPos.x - rightBeforeEndPos.x
		);

		this.drawArrow(endPos.x, endPos.y, angle);

		ctx.globalAlpha = 1;
	}

	drawArrow(endX: number, endY: number, endAngle: number) {
		const { ctx } = this;

		ctx.save();

		ctx.translate(endX, endY);
		ctx.rotate(endAngle);

		ctx.beginPath();
		ctx.moveTo(-7, -5);
		ctx.lineTo(0, 0);
		ctx.lineTo(-7, 5);
		ctx.stroke();

		ctx.restore();
	}

	onGraphChange() {
		if (!this.graphHasChanged) return;

		// Keep the path structure in sync with the graph (but never remove, only add)
		const paths = this.graph.nodes.map(x => x.reScalaResource.path);
		for (const path of paths) {
			let node = get(this.pathStructureRoot);
			for (const section of path.slice(0, -1)) {
				if (!node.children.some(x => x.label === section)) {
					node.children.push({ label: section, shown: true, children: [] });
				}
				node = node.children.find(x => x.label === section);
			}
		}
		this.pathStructureRoot.update(x => x);

		this.reconcile();

		const shouldCenter = this.layout.nodes.length > 0 && !this.hasCenteredOnce;
		if (shouldCenter) {
			// Visually center the graph the first time we see it
			this.center();
			this.hasCenteredOnce = true;
		}

		this.graphHasChanged = false;
	}

	reconcile() {
		this.layout.reconcile();
		this.layout.layOut();

		const hitNodes = new Set<RenderedNode>();
		const hitEdges = new Set<RenderedEdge>();

		// Keep the nodes in sync
		for (const layoutNode of this.layout.nodes) {
			// Find the layout node corresponding to this rendered node
			let node = this.layoutToRenderedNode.get(layoutNode)
				?? this.renderedNodes.find(x =>
					// Having the same underlying GraphNode also counts as a match
					x.layoutNode.node && x.layoutNode.node.id === layoutNode.node?.id
				);

			if (!node) {
				node = new RenderedNode(layoutNode, this);
				this.renderedNodes.push(node);
			} else {
				node.layoutNode = layoutNode;
			}

			this.layoutToRenderedNode.set(layoutNode, node);
			node.exitCompletion.target = 0;
			hitNodes.add(node);
		}

		// Construct the edges
		for (const node of this.renderedNodes) {
			if (node.layoutNode.isDummy) continue;

			for (const child of node.out) {
				let current = child;
				const waypoints = [node];

				// Construct a single, long edge for one that goes through dummy nodes
				while (current.layoutNode.isDummy) {
					waypoints.push(current);
					current = current.out[0];
				}
				waypoints.push(current);

				let edge = this.renderedEdges.find(x => x[0] === waypoints[0] && x[1] === waypoints.at(-1));
				if (edge) {
					edge.waypoints = waypoints;
				} else {
					edge = new RenderedEdge(waypoints.at(0), waypoints.at(-1));
					edge.waypoints = waypoints;
					this.renderedEdges.push(edge);
					edge.tweenedPath.target = edge.computePath();
				}

				edge.visibility.target = 1;
				edge.tweenedPath.target = edge.computePath(Infinity);
				hitEdges.add(edge);
			}
		}

		// Fade out removed edges
		for (const edge of this.renderedEdges) {
			if (hitEdges.has(edge)) continue;

			edge.visibility.target = 0;
			edge.tweenedPath.target = edge.computePath(Infinity);
		}

		// Fade out removed nodes
		for (const node of this.renderedNodes) {
			if (hitNodes.has(node)) continue;

			node.exitCompletion.target = 1;
		}

		if (this.layout.nodes.some(x => this.layoutToRenderedNode.get(x) === get(this.selectedNode))) {
			this.computeSelectedNodeSubtree();
		} else {
			this.selectedNode.set(null);
		}
	}

	supplyMousePosition(position: Point) {
		this.mousePosition = position;
	}

	checkHover() {
		const newNode = this.getNodesOverlappingWithMouse()[0] ?? null;
		this.hoveredNode.set(newNode);
	}

	tryToSelect() {
		const candidates = this.getNodesOverlappingWithMouse();
		if (candidates.length === 0) {
			this.selectedNode.set(null);
			return;
		}

		const node = candidates[0];
		this.selectedNode.set(node);
		this.computeSelectedNodeSubtree();
	}

	getNodesOverlappingWithMouse() {
		const nodes: RenderedNode[] = [];
		const mouseX = (this.mousePosition.x - this.originX) / get(this.scale);
		const mouseY = (this.mousePosition.y - this.originY) / get(this.scale);

		for (const node of this.renderedNodes) {
			if (node.layoutNode.isDummy) continue;

			const minPos = node.visualPosition();
			const maxPos = structuredClone(minPos);
			maxPos.x += NODE_WIDTH;
			maxPos.y += NODE_HEIGHT;

			if (
				mouseX >= minPos.x
				&& mouseX < maxPos.x
				&& mouseY >= minPos.y
				&& mouseY < maxPos.y
			) {
				nodes.push(node);
			}
		}

		return nodes;
	}

	/**
	 * The selected node subtree is comprised of the selected node, all of its ancestors and all of its descendants.
	 */
	computeSelectedNodeSubtree() {
		const node = get(this.selectedNode);
		if (!node) return;

		this.selectedNodeSubtree = new WeakSet();

		const forwardsQueue = [node];
		const backwardsQueue = [node];
		while (forwardsQueue.length > 0) {
			const nextNode = forwardsQueue.pop();
			this.selectedNodeSubtree.add(nextNode);
			forwardsQueue.push(...nextNode.out);
		}
		while (backwardsQueue.length > 0) {
			const nextNode = backwardsQueue.pop();
			this.selectedNodeSubtree.add(nextNode);
			backwardsQueue.push(...nextNode.in);
		}
	}

	/** Centers the entire visible graph. */
	center() {
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const node of this.renderedNodes) {
			const pos = node.computePosition();

			minX = Math.min(minX, pos.x);
			minY = Math.min(minY, pos.y);
			maxX = Math.max(maxX, pos.x + NODE_WIDTH);
			maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
		}

		if (minX > maxX) return; // Empty AABB

		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const width = 1.2 * (maxX - minX); // With added margin
		const height = 1.2 * (maxY - minY);

		this.scale.update(() => clamp(
			Math.min(window.innerWidth / width, window.innerHeight / height),
			MIN_SCALE,
			1
		));
		this.originX = window.innerWidth/2 - centerX * get(this.scale);
		this.originY = window.innerHeight/2 - centerY * get(this.scale);
	}
}