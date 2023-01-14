<script lang="ts">
    import { onMount } from "svelte";

    const NODE_WIDTH = 100;
    const NODE_HEIGHT = 70;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    let innerWidth = window.innerWidth;
    let innerHeight = window.innerHeight;
    let spacePressed = false;
    let mouseHeld = false;
    let scale = 0.3;
    let originX = 200 / scale;
    let originY = 100 / scale;
    let doIterate = false;
    
    onMount(() => {
        ctx = canvas.getContext('2d', { desynchronized: true });
        render();
    });

    const onMouseMove = (e: MouseEvent) => {
        if (!spacePressed || !mouseHeld) return;

        originX += e.movementX; 
        originY += e.movementY;
    };

    interface Node {
        label: string,
        value: string,
        layer?: number,
        x?: number,
        dx?: number,
        in?: Node[],
        out?: Node[],
        neighbor?: Node,
    }
    type Edge = {
        from: Node,
        to: Node
    };

    let n1: Node = { label: 'username', value: '"1"' };
    let n2: Node = { label: 'username', value: '"2"' };
    let n3: Node = { label: 'username', value: '"3"' };
    let n4: Node = { label: 'username', value: '"4"' };
    let n5: Node = { label: 'username', value: '"5"' };
    let n6: Node = { label: 'username', value: '"6"' };
    let n7: Node = { label: 'username', value: '"7"' };
    let n8: Node = { label: 'username', value: '"8"' };
    let n9: Node = { label: 'username', value: '"9"' };
    let nodes = [n1, n2, n3, n4, n5, n6, n7, n8, n9];
    let edges: Edge[] = [
        //{ from: n1, to: n2 },
        //{ from: n2, to: n3 },
        //{ from: n4, to: n3 },
        //{ from: n4, to: n2 },
        //{ from: n1, to: n4 },
        //{ from: n5, to: n4 },
        //{ from: n5, to: n3 },

        //{ from: n1, to: n3 },
        //{ from: n2, to: n3 },
        //{ from: n4, to: n6 },
        //{ from: n5, to: n6 },

        { from: n1, to: n2 },
        { from: n2, to: n3 },

        { from: n4, to: n1 },
        { from: n5, to: n2 },
        { from: n6, to: n3 },

        { from: n4, to: n5 },
        { from: n5, to: n6 },

        { from: n7, to: n4 },
        { from: n8, to: n5 },
        { from: n9, to: n6 },

        { from: n7, to: n8 },
        { from: n8, to: n9 },

        //{ from: n1, to: n2 },
        //{ from: n2, to: n3 },
        //{ from: n1, to: n3 },
    ];

    function shuffle<T>(a: T[]) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    nodes = Array(10).fill(0).map((x, i): Node => ({ label: 'username', value: i.toString() }));
    edges = [];
    for (let [i, node] of nodes.entries()) {
        let availableNodes = shuffle(nodes.slice(i + 1));
        let connections = Math.floor(Math.random() * 4 * (1 ?? availableNodes.length/nodes.length));
        for (let to of availableNodes.slice(0, connections)) edges.push({ from: node, to: to });
    }

    
    /*
    nodes = [n1, n2, n3, n4, n5, n6];
    edges = [
        { from: n1, to: n2 },
        { from: n2, to: n3 },
        //{ from: n3, to: n4 },
        //{ from: n1, to: n3 },
        { from: n1, to: n4 },
        { from: n4, to: n3 },
        { from: n5, to: n6 },
        //{ from: n1, to: n3 },
    ]
    */
    

    /*
    edges = [
        { from: n2, to: n1 },
        { from: n3, to: n1 },
        { from: n5, to: n4 },
    ]
    */

    /*
    nodes = [
        n1, n2, n3, n4, n5
    ];
    edges = [
        { from: n1, to: n2 },
        { from: n3, to: n5 },
    ];
    */

    //nodes = nodes.filter(x => edges.some(y => y.from === x || y.to === x));

    /*
    while (true) {
        let did = false;
        for (let edge of edges) {
            let others = edges.filter(x => x.from === edge.to);
            for (let edge2 of others) {
                if (!edges.some(x => x.from === edge.from && x.to === edge2.to)) {
                    edges.push({ from: edge.from, to: edge2.to });
                    did = true;
                }
            }
        }
        if (!did) break;
    }*/

    let longestOutgoingPathCache = new Map<Node, number>();
    const longestOutgoingPath = (node: Node) => {
        if (longestOutgoingPathCache.has(node)) return longestOutgoingPathCache.get(node);
        let relevantEdges = edges.filter(x => x.from === node);
        let res: number;

        if (relevantEdges.length === 0) res = 0;
        else res = Math.max(...relevantEdges.map(x => longestOutgoingPath(x.to))) + 1;

        longestOutgoingPathCache.set(node, res);
        return res;
    };

    //for (let node of nodes) node.layer = longestOutgoingPath(node);

    for (let node of nodes) node.layer = 0;
    let q: Node[] = nodes.filter(x => !edges.some(y => y.to === x));
    while (q.length > 0) {
        let rn = q.pop();
        let children = edges.filter(x => x.from === rn).map(x => x.to);
        for (let child of children) {
            child.layer = Math.min(child.layer, rn.layer-1);
        }
        q.push(...children);
    }
    let lowestLayer = Math.min(...nodes.map(x => x.layer));
    nodes.forEach(x => x.layer -= lowestLayer);

    // Add dummy nodes for long edges
    for (let j = 0; j < edges.length; j++) {
        let edge = edges[j];

        if (edge.from.layer - edge.to.layer > 1) {
            edges.splice(j--, 1);

            let prevNode = edge.from;
            for (let i = edge.from.layer; i > edge.to.layer; i--) {
                let nextNode: Node = (i === edge.to.layer + 1) ? edge.to : { label: '', value: 'dummy', layer: i - 1 };
                if (nextNode !== edge.to) nodes.push(nextNode);
                edges.push({ from: prevNode, to: nextNode });

                prevNode = nextNode;
            }
        }
    }

    for (let node of nodes) {
        node.in = [];
        node.out = [];
    }
    for (let edge of edges) {
        edge.from.out.push(edge.to);
        edge.to.in.push(edge.from);
    }

    let sortedNodes = [...nodes].sort((a, b) => a.layer - b.layer);
    for (let node of sortedNodes) node.x = Infinity;
    
    for (let layer = 0; layer <= sortedNodes.at(-1).layer; layer++) {
        let deezNodes = nodes.filter(x => x.layer === layer);
        if (layer === 0) {
            deezNodes.forEach((x, i) => x.x = i);
        } else {
            deezNodes.forEach(x => x.x /= x.out.length);
            deezNodes.sort((a, b) => a.x - b.x);
            deezNodes.forEach((x, i) => x.x = i);
        }

        for (let edge of edges) {
            if (edge.to.layer !== layer) continue;
            if (!isFinite(edge.from.x)) edge.from.x = 0;
            edge.from.x += edge.to.x;
        }
    }

    sortedNodes.sort((a, b) => a.x - b.x);
    let ayo = [...sortedNodes].sort((a, b) => a.x - b.x).sort((a, b) => a.layer - b.layer);
    for (let node of nodes) {
        node.neighbor = ayo.find((x, i) => x.layer === node.layer && i > ayo.indexOf(node));
    }

    const fixCollisions = () => {
        for (let i = 0; i < 10; i++) for (let node of nodes) {
            if (!node.neighbor) continue;

            let nodeHeight = node.value === 'dummy' ? 0.5 : 1;
            let neighborHeight = node.neighbor.value === 'dummy' ? 0.25 : 0.5;

            let diff = Math.min(node.neighbor.x - (node.x + nodeHeight), 0) / 2;

            node.x += diff;
            node.neighbor.x -= diff;
        }
    };

    const computeDxNew = () => {
        let did = new Set<Node>();

        for (let node of nodes) node.dx = 0;
        for (let edge of edges) {
            edge.to.dx += (edge.from.x - edge.to.x) / 2;
            edge.from.dx -= (edge.from.x - edge.to.x) / 2;
        }

        for (let node of ayo) {
            if (!node.neighbor) continue;
            if (did.has(node)) continue;

            const nodeHeight = (n: Node) => {
                return n.value === 'dummy' ? 0.5 : 1;
            };

            let connected = [node];
            while (connected.at(-1).neighbor && connected.at(-1).neighbor.x - (connected.at(-1).x + nodeHeight(connected.at(-1)) + 1e-6) <= 0) {
                connected.push(connected.at(-1).neighbor);
            }

            connected.forEach(x => did.add(x));
            if (connected.length === 1) continue;

            let avg = connected.reduce((a, b) => a + b.dx, 0) / connected.length;
            for (let n of connected) {
                n.dx = avg;
            }

            for (let n of connected.slice(0, -1)) {
                for (let m of connected) {
                    let sign = connected.indexOf(m) <= connected.indexOf(n) ? 1 : -1;
                    m.dx += sign * Math.min(n.neighbor.x - (n.x + nodeHeight(n)), 0);
                }
            }
        }
    };

    const iterateNewNew = () => {
        let h = 0.8;

        console.time()
        for (let i = 0; i < 1000; i++) {
            let x = nodes.map(n => n.x);
            computeDxNew();
            nodes.forEach(n => n.x += h**2 * n.dx / 2);

            let highestDx = Math.max(...nodes.map((n, i) => Math.abs(x[i] - n.x)));
            if (highestDx < 0.001) break;
        }
        console.timeEnd()
    };

    const iterateNew = () => {
        console.time()
        while (true) {
            let h = 1;
            let x = nodes.map(n => n.x);

            computeDxNew();
            let k1 = nodes.map(n => n.dx);

            nodes.forEach((n, i) => n.x = x[i] + h**2 *k1[i]/2/2);
            computeDxNew();
            let k2 = nodes.map(n => n.dx);

            nodes.forEach((n, i) => n.x = x[i] + h**2 *k2[i]/2/2);
            computeDxNew();
            let k3 = nodes.map(n => n.dx);
            
            nodes.forEach((n, i) => n.x = x[i] + h**2 *k3[i]/2);
            computeDxNew();
            let k4 = nodes.map(n => n.dx);

            let k = nodes.map((_, i) => (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]) / 6);
            nodes.forEach((n, i) => n.x = x[i] + h**2 * k[i] / 2);

            let highestDx = Math.max(...nodes.map((n, i) => Math.abs(x[i] - n.x)));
            if (true || highestDx < 0.001) break;
        }
        console.timeEnd()
    }


    const iterate = (collision = true, fromLayer?: number, iters = 100) => {
        for (let iter = 0; iter < iters; iter++) {
            let ayo = [...nodes].sort((a, b) => a.x - b.x).sort((a, b) => a.layer - b.layer);
            let midX = (Math.max(...nodes.map(x => x.x)) + Math.min(...nodes.map(x => x.x))) / 2;// nodes.map(x => x.x).reduce((a, b) => a + b, 0) / nodes.length;

            for (let node of nodes) node.dx = 0;
            for (let edge of edges) {
                if (fromLayer !== undefined && edge.from.layer !== fromLayer) continue;

                edge.to.dx += 0.01 * (edge.from.x - edge.to.x) / 2;
                edge.from.dx -= 0.01 * (edge.from.x - edge.to.x) / 2;
            }

            if (collision) for (let node of nodes) {
                let neighbor = ayo.find((x, i) => x.layer === node.layer /*&& x.value !== 'dummy'*/ && i > ayo.indexOf(node));
                if (neighbor) {
                    let bro = (neighbor.value === 'dummy' || node.value === 'dummy') ? 0.75 : 1;
                    node.dx += Math.min(neighbor.x - node.x - bro, 0) / 2;
                    neighbor.dx -= Math.min(neighbor.x - node.x - bro, 0) / 2;
                }
            }
            for (let node of nodes) node.x += node.dx;

            let newMidX = (Math.max(...nodes.map(x => x.x)) + Math.min(...nodes.map(x => x.x))) / 2;
            //for (let node of nodes) node.x -= newMidX - midX;
        }

        /*
        let midX = (Math.max(...nodes.map(x => x.x)) + Math.min(...nodes.map(x => x.x))) / 2;
        console.log(midX);
        originY = (-100 * midX) * 0.4 + window.innerHeight;
        */
    };

    /*
    let highestLayer = -lowestLayer;
    for (let i = 0; i < 100; i++) iterate(false);

    let ayo = [...nodes].sort((a, b) => a.x - b.x);
    for (let i = 0; i <= highestLayer; i++) {
        let deezNodes = ayo.filter(x => x.layer === i);
        deezNodes.forEach((x, i) => x.x = i * 1.25);
    }
    */




    //for (let node of nodes) node.x *= 10;

    /*

    let sortedNodes = [...nodes].sort((a, b) => a.layer - b.layer);

    //nodes.forEach(x => x.height = 0);
    for (let [i, node] of sortedNodes.filter(x => x.layer === sortedNodes.at(-1).layer).entries()) {
        node.height = i;
    }

    for (let depth = sortedNodes.at(-1).layer; depth >= 0; depth--) {
        let ofThisDepth = sortedNodes.filter(x => x.layer === depth);

        ofThisDepth.sort((a, b) => a.height - b.height);
        let hasHeight = ofThisDepth.filter(x => x.height !== undefined);
        let avgHeight = hasHeight.reduce((a, b) => a + b.height, 0) / hasHeight.length;

        let lastHeight = -Infinity;
        for (let [i, node] of [...hasHeight, ...ofThisDepth.filter(x => x.height === undefined)].entries()) {
            if (node.height !== undefined) {
                node.height /= edges.filter(x => x.from === node).length || 1;
                node.height = avgHeight - (hasHeight.length-1)/2 + i;
                lastHeight = node.height;
            } else {
                lastHeight++;
                if (!isFinite(lastHeight)) lastHeight = 0
                node.height = lastHeight;
            }
        }

        for (let node of ofThisDepth) {
            for (let edge of edges) {
                if (edge.to !== node || edge.from.layer !== depth-1) continue;
                if (!edge.from.height) edge.from.height = 0;
                edge.from.height += node.height;
            }
        }
    }
    */

    const getNodePosition = (node: Node, center = false) => {
        let x = 300 * node.layer;
        let y = 100 * node.x;

        if (center) {
            x += NODE_WIDTH/2;
            y += NODE_HEIGHT/2;
        }

        return { x, y };
    };

    const render = () => {
        //if (doIterate) iterate(undefined, undefined, 5);

        ctx.resetTransform();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.scale(scale, scale);
        ctx.translate(originX, originY);

        for (let edge of edges) {
            drawEdge(edge, edges.indexOf(edge));
        }

        for (let node of nodes) {
            if (node.value === 'dummy') continue;

            let pos = getNodePosition(node);
            drawNode(pos.x, pos.y, node.value ?? node.label, `${node.x.toFixed(2)} ${node.dx?.toFixed(2)}` ?? node.value);
        }
        /*

        drawEdge(300+7, 235, 500-7, 335);
        drawEdge(300+7, 235, 700-7, 135);

        drawNode(200, 200);
        drawNode(500, 300);
        drawNode(700, 100);
        */

        requestAnimationFrame(render);
    };

    const drawNode = (x: number, y: number, label: string, value: string) => {
        roundedRect(x, y, NODE_WIDTH, NODE_HEIGHT, 6);

        ctx.strokeStyle = '#474a52';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#292a2d';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = '14px Inter';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.fillText(label, x+50, y+20);

        ctx.font = '10px Inter';
        ctx.fillText(value, x+50, y+40);
    };

    const roundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        if (w < 2 * r) r = w / 2;
		if (h < 2 * r) r = h / 2;
		ctx.beginPath();
		ctx.moveTo(x+r, y);
		ctx.arcTo(x+w, y,   x+w, y+h, r);
		ctx.arcTo(x+w, y+h, x,   y+h, r);
		ctx.arcTo(x,   y+h, x,   y,   r);
		ctx.arcTo(x,   y,   x+w, y,   r);
		ctx.closePath();
    };

    const getPosAroundNode = (nodeX: number, nodeY: number, angle: number) => {
        let centerX = nodeX + NODE_WIDTH/2;
        let centerY = nodeY + NODE_HEIGHT/2;

        let margin = 7;

        let x = Math.cos(angle) * (NODE_WIDTH/2 + margin);
        let y = Math.sin(angle) * (NODE_HEIGHT/2 + margin);

        if (Math.abs(Math.tan(angle)) < 1) { // Math.abs(Math.cos(angle)) < Math.abs(Math.tan(angle))
            let uh = (NODE_WIDTH/2 + margin) / Math.abs(x);
            x *= uh;
            y *= uh;
        } else {
            let uh = (NODE_HEIGHT/2 + margin) / Math.abs(y);
            x *= uh;
            y *= uh;
        }

        return {
            x: centerX + x,
            y: centerY + y
        };
    }
    
    const quadraticBezierDerivative = (p0: number, p1: number, p2: number, t: number) => {
        return 2*(1-t)*(p1-p0) + 2*t*(p2-p1);
    };

    const drawEdge = (edge: Edge, n = 0) => {
        if (edge.from.value === 'dummy') return;

        if (edge.to.value === 'dummy') {
            let allPaths: Node[][] = [[edge.from, edge.to]];

            while (allPaths.some(x => x.at(-1).value === 'dummy')) {
                for (let path of allPaths.slice()) {
                    if (path.at(-1).value === 'dummy') {
                        let outgoingEdges = edges.filter(x => x.from === path.at(-1));
                        let mutated = false;
                        for (let edge of outgoingEdges) {
                            if (!mutated) {
                                path.push(edge.to);
                                mutated = true;
                            } else {
                                allPaths.push([...path, edge.to]);
                            }
                        }
                    }
                }
            }

            const catmullRom = (t: number, p0: number, p1: number, p2: number, p3: number) => {
                let point = t*t*t*((-1) * p0 + 3 * p1 - 3 * p2 + p3) / 2;
                point += t*t*(2*p0 - 5 * p1+ 4 * p2 - p3) / 2;
                point += t*((-1) * p0 + p2) / 2;
                point += p1;

                return point;
            };

            for (let path of allPaths) {
                let points: { x: number, y: number }[] = [];

                for (let i = 0; i < path.length-1; i++) {
                    let from = path[i];
                    let to = path[i+1];

                    let p1 = getNodePosition(from, true);
                    let p2 = getNodePosition(to, true);
                    let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);

                    if (from.value !== 'dummy') p1 = getPosAroundNode(getNodePosition(from).x, getNodePosition(from).y, angle);
                    if (to.value !== 'dummy') p2 = getPosAroundNode(getNodePosition(to).x, getNodePosition(to).y, Math.PI + angle);

                    //if (i === 0) ctx.moveTo(p1.x, p1.y);
                    //ctx.lineTo(p2.x, p2.y);

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

                ctx.beginPath();
                ctx.moveTo(points[1].x, points[1].y);
                let lastX = points[1].x;
                let lastY = points[1].y;
                let angle: number;
                for (let i = 0; i < points.length-3; i++) {
                    let p0 = points[i+0];
                    let p1 = points[i+1];
                    let p2 = points[i+2];
                    let p3 = points[i+3];
                
                    for (let t = 0; t <= 1 + Number.EPSILON; t += 0.05) {
                        let x = catmullRom(t, p0.x, p1.x, p2.x, p3.x);
                        let y = catmullRom(t, p0.y, p1.y, p2.y, p3.y);
                        ctx.lineTo(x, y);

                        angle = Math.atan2(y-lastY, x-lastX);
                        lastX = x;
                        lastY = y;
                    }
                }

                ctx.lineWidth = 2;
                ctx.strokeStyle = `hsl(${100 + 50 * n}, 60%, 60%)`;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();

                ctx.save();
                ctx.translate(points.at(-2).x, points.at(-2).y);
                ctx.rotate(angle);

                ctx.beginPath();
                ctx.moveTo(-7, -5);
                ctx.lineTo(0, 0);
                ctx.lineTo(-7, 5);
                ctx.stroke();

                ctx.restore();
            }

            return; 
        }

        let p1 = getNodePosition(edge.from);
        let p2 = getNodePosition(edge.to);

        let angle = 0;
        let ex: number;
        let ey: number;

        ctx.beginPath();
        
        const bezierPathFromNode = (node: Node, x2: number, y2: number, angleOverride?: number, computeControlPoints?: (x1: number, x2: number) => { cx: number, cy: number }) => {
            let p = getNodePosition(node);
            let { x: x1, y: y1 } = getPosAroundNode(p.x, p.y, 0);
            let cx = (x1+x2)/2;
            let cy = y2;
            let angle = 0;

            for (let i = 0; i < 3; i++) {
                cx = (x1+x2)/2;
                cy = y2;

                if (computeControlPoints) ({ cx, cy } = computeControlPoints(x1, x2));

                angle = angleOverride ?? Math.atan2(
                    quadraticBezierDerivative(y1, cy, y2, 0),
                    quadraticBezierDerivative(x1, cx, x2, 0)
                );
                ({ x: x1, y: y1 } = getPosAroundNode(p.x, p.y, angle));
            }

            //ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cx, cy, x2, y2);

            return {
                x: x1,
                y: y1,
                startAngle: Math.atan2(
                    quadraticBezierDerivative(y1, cy, y2, 0),
                    quadraticBezierDerivative(x1, cx, x2, 0)
                ),
                endAngle: Math.atan2(
                    quadraticBezierDerivative(y1, cy, y2, 1),
                    quadraticBezierDerivative(x1, cx, x2, 1)
                )
            };
        };

        let { x: x1, y: y1 } = getPosAroundNode(p1.x, p1.y, 0);
        let { x: x2, y: y2 } = getPosAroundNode(p2.x, p2.y, Math.PI);

        //ctx.beginPath();
        //ctx.moveTo(x1, y1);
        //ctx.bezierCurveTo(x1+100, y1, x2-100, y2, x2 - 7, y2);

        angle = Math.atan2(y2-y1, x2-x1);

        ({ x: x2, y: y2 } = getPosAroundNode(p2.x, p2.y, Math.PI + angle));

        let bruh: any;
        if (edge.to.layer - edge.from.layer > 1) {
            let highwayHeight = Math.max(...nodes.filter(x => edge.from.layer < x.layer && x.layer < edge.to.layer).map(x => x.x)) + 1.25;
            bruh = (x1, x2) => ({ cx: (x1+x2)/2, cy: 150 * highwayHeight });
        }

        let res = bezierPathFromNode(edge.from, x2, y2, undefined, bruh);

        ex = x2;
        ey = y2;
        angle = res.endAngle;

        //let angle = Math.atan2(y2-y1, x2-x1);

        
        //ctx.lineTo(x2 - 7*Math.cos(angle), y2 - 7*Math.sin(angle));

        ctx.lineWidth = 2;
        ctx.strokeStyle = `hsl(${100 + 50 * n}, 60%, 60%)`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(-7, -5);
        ctx.lineTo(0, 0);
        ctx.lineTo(-7, 5);
        ctx.stroke();

        ctx.restore();
    };
</script>

<svelte:head>
    <title>REScala Inspector</title>
</svelte:head>

<svelte:window
    bind:innerWidth
    bind:innerHeight
    on:keydown={(e) => e.code === 'Space' && (spacePressed = true)}
    on:keyup={(e) => e.code === 'Space' && (spacePressed = false)}
    on:mousedown={() => mouseHeld = true}
    on:mouseup={() => mouseHeld = false}
    on:keydown={e => e.code === 'KeyI' && iterateNewNew()}
    on:keyup={e => e.code === 'KeyI' && (doIterate = false)}
/>

<canvas
    class="w-full h-full"
    class:cursor-grab={spacePressed}
    class:cursor-grabbing={spacePressed && mouseHeld}
    bind:this={canvas}
    width={innerWidth * window.devicePixelRatio}
    height={innerHeight * window.devicePixelRatio}
    on:mousemove={onMouseMove}
/>
<button class="absolute top-0 left-0 bg-[#292a2d] px-2 py-1 rounded-md shadow m-3 text-sm">Do the Harlem Shake</button>