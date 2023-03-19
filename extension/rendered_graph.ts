import { subscribe } from "svelte/internal";
import { get, writable, type Writable } from "svelte/store";
import type { HistoryEntry, Graph } from "./graph";
import { GraphLayout, LayoutNode } from "./graph_layout";
import { EaseType, Tweened } from "./tween";
import { catmullRom, clamp, lerp, lerpPoints, quadraticBezier, roundedRect, type Path, type Point } from "./utils";

export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 70;
export const ANIMATION_DURATION = 1000;
export const MIN_SCALE = 2**-7;
export const MAX_SCALE = 2**2;

export type PathStructureNode = { label: string, shown: boolean, children: PathStructureNode[] };

export class RenderedGraph {
    ctx: CanvasRenderingContext2D;
    originX = window.innerWidth/2;
    originY = 200;
    scale = writable(0.5);
    showNodeBoundingBoxes = false;
    layout: GraphLayout;
    renderedEdges: RenderedEdge[] = [];
    graphHasChanged = true;
    hoveredNode = writable<LayoutNode>(null);
    selectedNode = writable<LayoutNode>(null);
    selectedNodeSubtree = new WeakSet<LayoutNode>();
    mousePosition: Point = { x: 0, y: 0 };
    pathStructureRoot = writable<PathStructureNode>({ label: 'root', shown: true, children: [] });
    viewedHistoryEntry: Writable<HistoryEntry>;

    elevation1Color: string;
    hover1Color: string;
    hoverStrongColor: string;
    border1Color: string;
    textColor: string;
    booleanColor: string;
    numberColor: string;
    stringColor: string;
    instanceColor: string;
    listColor: string;

    constructor(public graph: Graph, public canvas: HTMLCanvasElement) {
        graph.on('change', () => this.graphHasChanged = true);

        this.ctx = canvas.getContext('2d');
        this.layout = new GraphLayout(this);
        this.viewedHistoryEntry = writable(get(graph.history).at(-1))

        subscribe(this.pathStructureRoot, () => {
            if (this.graphHasChanged) return; // Because we'll reconcile anyway
            this.reconcile();
        });
    }
    
    render() {
        let { ctx } = this;

        let computedStyle = getComputedStyle(document.body);
        this.elevation1Color = `rgb(${computedStyle.getPropertyValue('--elevation-1')})`;
        this.hover1Color = `rgb(${computedStyle.getPropertyValue('--hover-1')})`;
        this.hoverStrongColor = `rgb(${computedStyle.getPropertyValue('--hover-strong')})`;
        this.border1Color = `rgb(${computedStyle.getPropertyValue('--border-1')})`;
        this.textColor = computedStyle.getPropertyValue('color');
        this.booleanColor = `rgb(${computedStyle.getPropertyValue('--boolean')})`;
        this.numberColor = `rgb(${computedStyle.getPropertyValue('--number')})`;
        this.stringColor = `rgb(${computedStyle.getPropertyValue('--string')})`;
        this.instanceColor = `rgb(${computedStyle.getPropertyValue('--instance')})`;
        this.listColor = `rgb(${computedStyle.getPropertyValue('--list')})`;

        this.onGraphChange();

        ctx.resetTransform();

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.translate(this.originX, this.originY);
        ctx.scale(get(this.scale), get(this.scale));

        for (let i = 0; i < this.renderedEdges.length; i++) {
            let edge = this.renderedEdges[i];
            if (edge.visibility.target === 0 && edge.visibility.value === 0) {
                this.renderedEdges.splice(i--, 1);
                continue;
            }
            this.drawEdge(edge);
        }

        for (let node of this.layout.nodes) {
            this.drawNode(node);
        }

        this.checkHover();
    }

    onGraphChange() {
        if (!this.graphHasChanged) return;

        let paths = this.graph.nodes.map(x => x.reScalaResource.path);
        for (let path of paths) {
            let node = get(this.pathStructureRoot);
            for (let section of path.slice(0, -1)) {
                if (!node.children.some(x => x.label === section)) {
                    node.children.push({ label: section, shown: true, children: [] });
                }
                node = node.children.find(x => x.label === section);
            }
        }
        this.pathStructureRoot.update(x => x);

        let history = get(this.graph.history);

        if (get(this.viewedHistoryEntry) === history.at(-2)) {
            // If we used to be at the end, stick to the end
            this.viewHistoryEntry(history.at(-1));
            if (history.length === 2) this.center();
        } else {
            this.reconcile();
        }

        this.graphHasChanged = false;
    }

    drawNode(node: LayoutNode) {
        let { ctx } = this;
        let { x, y } = node.visualPosition();

        if (!node.isDummy) {
            this.ctx.globalAlpha = node.visibility.value;

            if (this.nodeIsDimmed(node)) this.ctx.globalAlpha *= 0.15;

            let label = node.node.label;
            let value = get(this.viewedHistoryEntry).values.get(node.node);

            roundedRect(ctx, x, y, NODE_WIDTH, node.visualHeight(), 6);

            let highlighted = get(this.hoveredNode) === node || get(this.selectedNode) === node;

            ctx.strokeStyle = highlighted ? this.hoverStrongColor : this.border1Color;
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = this.elevation1Color;
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.font = '14px sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.textColor;
            ctx.fillText(node.node.id + ' | ' + label, x + NODE_WIDTH/2, y + node.visualHeight()/2);

            if (value) {
                if (value.type === 'boolean') ctx.fillStyle = this.booleanColor;
                else if (value.type === 'number') ctx.fillStyle = this.numberColor;
                else if (value.type === 'string') ctx.fillStyle = this.stringColor;
                else if (value.type === 'instance') ctx.fillStyle = this.instanceColor;
                else if (value.type === 'list') ctx.fillStyle = this.listColor;
                else if (value.type === 'unknown') ctx.globalAlpha = 2/3;

                ctx.font = '10px monospace';
                ctx.fillText(value.short, x+NODE_WIDTH/2, y + node.visualHeight() - 10);
            }
        }

        if (this.showNodeBoundingBoxes) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = `hsl(${100 + 50 * this.layout.nodes.indexOf(node)}, 60%, 60%)`;
            roundedRect(ctx, x, y, NODE_WIDTH, 100 * node.height, 6);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    nodeIsDimmed(node: LayoutNode) {
        return get(this.selectedNode) && !this.selectedNodeSubtree.has(node);
    }

    drawEdge(edge: RenderedEdge) {
        let { ctx } = this;

        let visibility = edge.visibility.value;
        ctx.globalAlpha = visibility;

        if (this.nodeIsDimmed(edge[0]) || this.nodeIsDimmed(edge[1])) {
            ctx.globalAlpha *= 0.15;
        }

        let path = edge.tweenedPath.value;

        ctx.beginPath();
        let len = Math.max(Math.ceil(path.length * visibility), 2);
        for (let i = 0; i < len; i++) {
            let { x, y } = getPositionAlongPath(path, visibility * i/(len-1));

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = `hsl(${100 + 50 * edge.id}, 60%, 60%)`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        let clean1 = getPositionAlongPath(path, visibility);
        let clean2 = getPositionAlongPath(path, Math.max(visibility - 1e-6, 0));

        let angle = Math.atan2(
            clean1.y - clean2.y,
            clean1.x - clean2.x
        );

        this.drawArrow(clean1.x, clean1.y, angle);

        ctx.globalAlpha = 1;
    }

    drawArrow(endX: number, endY: number, endAngle: number) {
        let { ctx } = this;

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

    reconcile() {
        this.layout.reconcile();
        this.layout.layOut();

        let hit = new Set<RenderedEdge>();
        for (let layoutNode of this.layout.nodes) {
            if (layoutNode.isDummy) continue;
            
            for (let child of layoutNode.out) {
                let current = child;
                let waypoints = [layoutNode];

                while (current.isDummy) {
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
                hit.add(edge);
            }
        }

        for (let edge of this.renderedEdges) {
            if (hit.has(edge)) continue;

            edge.visibility.target = 0;
            edge.tweenedPath.target = edge.computePath(Infinity);
        }

        if (!this.layout.nodes.includes(get(this.selectedNode))) {
            this.selectedNode.set(null);
        }
    }

    viewHistoryEntry(entry: HistoryEntry) {
        this.viewedHistoryEntry.set(entry);
        this.reconcile();
    }

    supplyMousePosition(position: Point) {
        this.mousePosition = position;
    }

    getNodesOverlappingWithMouse() {
        let nodes: LayoutNode[] = [];
        let mouseX = (this.mousePosition.x - this.originX) / get(this.scale);
        let mouseY = (this.mousePosition.y - this.originY) / get(this.scale);

        for (let node of this.layout.nodes) {
            if (node.isDummy) continue;

            let minPos = node.visualPosition();
            let maxPos = structuredClone(minPos);
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

    checkHover() {
        let newNode = this.getNodesOverlappingWithMouse()[0] ?? null;
        this.hoveredNode.set(newNode);
    }

    tryToSelect() {
        let candidates = this.getNodesOverlappingWithMouse();
        if (candidates.length === 0) {
            this.selectedNode.set(null);
            return;
        }

        let node = candidates[0];
        this.selectedNode.set(node);

        this.selectedNodeSubtree = new WeakSet();

        let forwardsQueue = [node];
        let backwardsQueue = [node];
        while (forwardsQueue.length > 0) {
            let nextNode = forwardsQueue.pop();
            this.selectedNodeSubtree.add(nextNode);
            forwardsQueue.push(...nextNode.out);
        }
        while (backwardsQueue.length > 0) {
            let nextNode = backwardsQueue.pop();
            this.selectedNodeSubtree.add(nextNode);
            backwardsQueue.push(...nextNode.in);
        }
    }

    center() {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (let node of this.layout.nodes) {
            let pos = node.computePosition();

            minX = Math.min(minX, pos.x);
            minY = Math.min(minY, pos.y);
            maxX = Math.max(maxX, pos.x + NODE_WIDTH);
            maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
        }

        if (minX > maxX) return; // Empty AABB

        let centerX = (minX + maxX) / 2;
        let centerY = (minY + maxY) / 2;
        let width = 1.2 * (maxX - minX); // With added margin
        let height = 1.2 * (maxY - minY);

        this.scale.update(x => clamp(
            Math.min(window.innerWidth / width, window.innerHeight / height),
            MIN_SCALE,
            MAX_SCALE
        ));
        this.originX = window.innerWidth/2 - centerX * get(this.scale);
        this.originY = window.innerHeight/2 - centerY * get(this.scale);
    }
}

let renderedEdgeId = 0;
export class RenderedEdge extends Array<LayoutNode> {
    id = renderedEdgeId++;
    waypoints: LayoutNode[] = [this[0], this[1]];
    tweenedPath = new Tweened<{ x: number, y: number }[]>(
        null,
        ANIMATION_DURATION,
        lerpPaths,
        EaseType.EaseOutElasticQuarter,
        true
    );
    visibility = new Tweened(
        0,
        (_, to: number) => (to === 0 ? 0.4 : 1) * ANIMATION_DURATION,
        lerp,
        EaseType.EaseOutQuint
    );

    constructor(from: LayoutNode, to: LayoutNode) {
        super(from, to);
    }

    computePath(time?: number) {
        let path: Path = [];

        if (this.waypoints.length === 2) {
            let c1 = this[0].visualCenter(time);
            let c2 = this[1].visualCenter(time);
            let angle = Math.atan2(c2.y-c1.y, c2.x-c1.x);
            const dampeningThreshold = Math.PI/6;
            if (Math.abs(angle) >= dampeningThreshold) {
                // Dampen the angle a bit
                angle = Math.sign(angle) * (dampeningThreshold + 0.5*(Math.abs(angle) - dampeningThreshold))
            }

            let { x: x1, y: y1 } = this[0].posOnBorder(angle, time);
            let { x: x2, y: y2 } = this[1].posOnBorder(Math.PI + angle, time);

            let cpx = (x1+x2)/2;
            let cpy = lerp(y1, y2, 0.8);

            for (let i = 0; i <= 20; i++) {
                let t = i/20;
                path.push({
                    x: quadraticBezier(x1, cpx, x2, t),
                    y: quadraticBezier(y1, cpy, y2, t)
                });
            }
        } else {
            let points: { x: number, y: number }[] = [];

            for (let i = 0; i < this.waypoints.length-1; i++) {
                let from = this.waypoints[i];
                let to = this.waypoints[i+1];

                let p1 = from.visualCenter(time);
                let p2 = to.visualCenter(time);
                let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);

                if (!from.isDummy) p1 = from.posOnBorder(angle, time);
                if (!to.isDummy) p2 = to.posOnBorder(Math.PI + angle, time);

                if (i === 0) points.push(p1);
                points.push(p2);
            }

            points.unshift({
                x: points[0].x - (points[1].x - points[0].x),
                y: points[0].y - (points[1].y - points[0].y)
            });
            points.push({
                x: points.at(-1).x - (points.at(-2).x - points.at(-1).x),
                y: points.at(-1).y - (points.at(-2).y - points.at(-1).y)
            });

            path.push(points[1]);
            for (let i = 0; i < points.length-3; i++) {
                let p0 = points[i+0];
                let p1 = points[i+1];
                let p2 = points[i+2];
                let p3 = points[i+3];
            
                for (let j = 1; j <= 20; j++) {
                    let t = j/20;
                    let x = catmullRom(t, p0.x, p1.x, p2.x, p3.x);
                    let y = catmullRom(t, p0.y, p1.y, p2.y, p3.y);
                    path.push({ x, y });
                }
            }
        }

        return path;
    }
}

const lerpPaths = (path1: Path, path2: Path, t: number) => {
    let finalPath: Path = Array(Math.max(path1.length, path2.length));

    for (let i = 0; i < finalPath.length; i++) {
        let u = i / (finalPath.length - 1);
        let p1 = getPositionAlongPath(path1, u);
        let p2 = getPositionAlongPath(path2, u);
        finalPath[i] = lerpPoints(p1, p2, t);
    }

    return finalPath;
};

const getPositionAlongPath = (path: { x: number, y: number }[], t: number) => {
    let index = (path.length-1) * t;
    let indexLow = Math.floor(index);
    let indexHigh = Math.ceil(index);

    let p1 = path[indexLow];
    let p2 = path[indexHigh];

    if (index === indexLow) return p1;
    return lerpPoints(p1, p2, index - indexLow);
};