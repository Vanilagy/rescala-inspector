import type { Graph, GraphNode } from "./graph";
import { GraphLayout, LayoutNode } from "./graph_layout";
import { EaseType, Tweened } from "./tween";
import { catmullRom, lerp, quadraticBezier, quadraticBezierDerivative, remove, roundedRect, saturate } from "./utils";

export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 70;
const EDGE_ANIMATION_START = 0.5;

export class RenderedGraph {
    ctx: CanvasRenderingContext2D;
    originX = window.innerWidth/2;
    originY = 100;
    scale = 0.5;
    showNodeBoundingBoxes = false;

    renderedNodes: RenderedNode[] = [];
    renderedEdges: RenderedEdge[] = [];
    graphHasChanged = true;

    layout: GraphLayout;

    constructor(public graph: Graph, public canvas: HTMLCanvasElement) {
        graph.on('change', () => this.graphHasChanged = true);
        this.ctx = canvas.getContext('2d');
        this.layout = new GraphLayout(graph);
    }

    addNode(renderedNode: RenderedNode) {
        this.renderedNodes.push(renderedNode);
    }
    
    render() {
        let { ctx } = this;

        this.maybeReconcile();

        ctx.resetTransform();

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.translate(this.originX, this.originY);
        ctx.scale(this.scale, this.scale);

        for (let [index, edge] of this.renderedEdges.entries()) {
            this.drawEdge(edge);
        }

        for (let [index, node] of this.renderedNodes.entries()) {
            this.drawNode(node, index);
        }
    }

    drawNode(node: RenderedNode, n: number) {
        let { ctx } = this;
        let { x, y } = node.visualPosition;

        if (node.visibility.target === 0) node.visibility.target = 1;

        this.ctx.globalAlpha = node.visibility.value;

        let label = node.node.label;
        let value = node.node.value;

        roundedRect(ctx, x, y, NODE_WIDTH, node.visualHeight, 6);

        ctx.strokeStyle = '#474a52';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#292a2d';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = '14px Inter';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(node.node.id + ' | ' + label, x + NODE_WIDTH/2, y + node.visualHeight/2);

        if (node.node.value !== null) {
            ctx.font = '10px Inter';
            ctx.fillText(value, x+NODE_WIDTH/2, y + node.visualHeight - 10);
        }

        /*
        if (this.showNodeBoundingBoxes) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = `hsl(${100 + 50 * n}, 60%, 60%)`;
            roundedRect(ctx, x, y, NODE_WIDTH, 100 * node.height, 6);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        */

        this.ctx.globalAlpha = 1;
    }

    drawEdge(edge: RenderedEdge) {
        let { ctx } = this;

        let visibility = edge[0].visibility.value * edge[1].visibility.value;
        ctx.globalAlpha = visibility;

        let cursed1 = (1 - edge[0].visibility.value) * -100;
        let cursed2 = (1 - edge[1].visibility.value) * -100;
        //let cursed1x = edge[0].visualPosition.x - edge[0].layoutNode.computePosition().x;
        //let cursed1y = edge[0].visualPosition.y - edge[0].layoutNode.computePosition().y;
        //let cursed2x = edge[1].visualPosition.x - edge[1].layoutNode.computePosition().x;
        //let cursed2y = edge[1].visualPosition.y - edge[1].layoutNode.computePosition().y;
        
        let path = edge.tweenedPath.value;
        for (let i = 0; i < path.length; i++) {
            //path[i].y += lerp(cursed1, cursed2, i/(path.length-1));
        }

        ctx.beginPath();
        let len = Math.max(Math.ceil(path.length * visibility), 2);
        for (let i = 0; i < len; i++) {
            let { x, y } = getPositionAlongPath(path, visibility * i/(len-1));

            /*
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI*2);
            ctx.fill();
            continue;
            */
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

        ctx.save();
        ctx.translate(clean1.x, clean2.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(-7, -5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-7, 5);
        ctx.stroke();

        ctx.restore();

        ctx.globalAlpha = 1;
    }

    drawArrow(n: number, endX: number, endY: number, endAngle: number) {
        let { ctx } = this;

        ctx.lineWidth = 2;
        ctx.strokeStyle = `hsl(${100 + 50 * n}, 60%, 60%)`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

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

    maybeReconcile() {
        if (!this.graphHasChanged) return;
        this.graphHasChanged = false;

        this.layout.reconcile();
        this.layout.layOut();

        for (let layoutNode of this.layout.nodes) {
            if (layoutNode.isDummy || this.renderedNodes.some(x => x.layoutNode === layoutNode)) continue;
            let renderedNode = new RenderedNode(layoutNode.node, layoutNode);
            this.addNode(renderedNode);
        }

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

                let edge = this.renderedEdges.find(x => x[0].layoutNode === waypoints[0] && x[1].layoutNode === waypoints.at(-1));
                if (edge) {
                    edge.waypoints = waypoints;
                } else {
                    edge = new RenderedEdge(
                        this.renderedNodes.find(x => x.layoutNode === waypoints.at(0)),
                        this.renderedNodes.find(x => x.layoutNode === waypoints.at(-1))
                    );
                    edge.waypoints = waypoints;
                    this.renderedEdges.push(edge);
                    edge.tweenedPath.target = edge.computePath(true);
                }

                edge.tweenedPath.target = edge.computePath();
                hit.add(edge);
            }
        }

        this.renderedEdges = this.renderedEdges.filter(x => hit.has(x));
    }
}

const lerpPoints = (p1: { x: number, y: number }, p2: { x: number, y: number }, t: number) => {
    return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
};

export class RenderedNode {
    tweenedPosition = new Tweened<{ x: number, y: number}>(
        null,
        1001,
        lerpPoints,
        EaseType.EaseOutElasticQuarter
    );
    visibility = new Tweened(
        0,
        1001,
        lerp,
        EaseType.EaseOutQuint
    );

    constructor(public node: GraphNode, public layoutNode: LayoutNode) {
        this.visibility.target = 1;
    }

    get visualPosition() {
        let actualPosition = this.layoutNode.computePosition();
        if (!this.tweenedPosition.target || this.tweenedPosition.target.x !== actualPosition.x || this.tweenedPosition.target.y !== actualPosition.y) {
            this.tweenedPosition.target = actualPosition;
        }

        let visibility = this.visibility.value;
        let pos = this.tweenedPosition.value;

        pos.y -= (1-visibility) * 100;

        return pos;
    }

    get visualHeight() {
        return lerp(NODE_HEIGHT/2, NODE_HEIGHT, this.visibility.value);
    }

    get visualCenter() {
        let pos = this.visualPosition;
        pos.x += NODE_WIDTH/2;
        pos.y += this.visualHeight/2;

        return pos;
    }

    posOnBorder(angle: number) {
        let { x: centerX, y: centerY } = this.visualCenter;

        let margin = 7;
        let extendedWidth = NODE_WIDTH/2 + margin;
        let extendedHeight = this.visualHeight/2 + margin;

        let x = Math.cos(angle) * extendedWidth;
        let y = Math.sin(angle) * extendedHeight;

        if (Math.abs(Math.tan(angle)) < 1) { // equiv to Math.abs(Math.cos(angle)) < Math.abs(Math.tan(angle))
            let uh = extendedWidth / Math.abs(x);
            x *= uh;
            y *= uh;
        } else {
            let uh = extendedHeight / Math.abs(y);
            x *= uh;
            y *= uh;
        }

        return {
            x: centerX + x,
            y: centerY + y
        };
    }
}

let renderedEdgeId = 0;
export class RenderedEdge extends Array<RenderedNode> {
    id = renderedEdgeId++;
    waypoints: LayoutNode[] = [this[0].layoutNode, this[1].layoutNode];
    tweenedPath = new Tweened<{ x: number, y: number }[]>(
        null,
        1001,
        lerpPaths,
        EaseType.EaseOutElasticQuarter
    );

    computePath(cursed = false) {
        let path: { x: number, y: number }[] = [];

        if (this.waypoints.length === 2) {
            let c1 = cursed ? this[0].visualCenter : this.waypoints[0].computePosition(true);
            let c2 = cursed ? this[1].visualCenter : this.waypoints[1].computePosition(true);
            let angle = Math.atan2(c2.y-c1.y, c2.x-c1.x);
            const dampeningThreshold = Math.PI/6;
            if (Math.abs(angle) >= dampeningThreshold) {
                // Dampen the angle a bit
                angle = Math.sign(angle) * (dampeningThreshold + 0.5*(Math.abs(angle) - dampeningThreshold))
            }

            let { x: x1, y: y1 } = cursed ? this[0].posOnBorder(angle) : this.waypoints[0].posOnBorder(angle);
            let { x: x2, y: y2 } = cursed ? this[1].posOnBorder(Math.PI + angle) : this.waypoints[1].posOnBorder(Math.PI + angle);

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

                let p1 = from.computePosition(true);
                let p2 = to.computePosition(true);
                let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);

                if (!from.isDummy) p1 = from.posOnBorder(angle);
                if (!to.isDummy) p2 = to.posOnBorder(Math.PI + angle);

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
            let lastX = points[1].x;
            let lastY = points[1].y;
            let angle: number;
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

                    angle = Math.atan2(y-lastY, x-lastX);
                    lastX = x;
                    lastY = y;
                }
            }

            //this.drawArrow(n, points.at(-2).x, points.at(-2).y, angle);
        }

        return path;
    }
}

const lerpPaths = (path1: { x: number, y: number }[], path2: { x: number, y: number }[], t: number) => {
    let finalPath = Array<{ x: number, y: number }>(Math.max(path1.length, path2.length));

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
    return lerpPoints(p1, p2, index - indexLow);
};