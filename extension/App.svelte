<script lang="ts">
    import { onMount } from "svelte";

    const NODE_WIDTH = 100;
    const NODE_HEIGHT = 70;
    const DUMMY_NODE_HEIGHT_FACTOR = 1/3;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    let innerWidth = window.innerWidth;
    let innerHeight = window.innerHeight;
    let spacePressed = false;
    let mouseHeld = false;
    let scale = 0.5;
    let originX = 200 / scale;
    let originY = 100 / scale;
    let doIterate = false;
    let showNodeBoundingBoxes = false;
    
    onMount(() => {
        ctx = canvas.getContext('2d', { desynchronized: true });
        render();
    });

    const onMouseMove = (e: MouseEvent) => {
        if (!spacePressed || !mouseHeld) return;

        originX += e.movementX / scale; 
        originY += e.movementY / scale;
    };

    interface Node {
        label: string,
        value: string,
        layer?: number,
        x?: number,
        a?: number,
        in?: Node[],
        out?: Node[],
        neighbor?: Node,
        dummy?: boolean
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
    let n10: Node = { label: 'username', value: '"10"' };
    let nodes = [n1, n2, n3, n4, n5, n6, n7, n8, n9, n10];
    let edges: Edge[] = [];

    function shuffle<T>(a: T[]) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    nodes = Array(20).fill(0).map((x, i): Node => ({ label: 'username', value: i.toString() }));
    edges = [];
    for (let [i, node] of nodes.entries()) {
        let availableNodes = shuffle(nodes.slice(i + 1));
        let connections = Math.floor(Math.random() * 3 * (1 ?? availableNodes.length/nodes.length));
        for (let to of availableNodes.slice(0, connections)) edges.push({ from: node, to: to });
    }

    // Remove unconnected nodes
    nodes = nodes.filter(x => edges.some(y => y.from === x || y.to === x));

    /*
    nodes = [n1, n2, n3];
    edges = [];
    
    n1.a = -1;
    n2.a = 0;
    n3.a = -5;
    */

    
    
    /*
    nodes = [n1,n2,n3,n4,n5,n6,n7,n8,n9,n10];
    edges = [
        { from: n1, to: n2 },
        { from: n2, to: n3 },
        { from: n3, to: n4 },
        { from: n3, to: n5 },
        { from: n6, to: n5 },
        { from: n7, to: n8 },
        { from: n8, to: n9 },
        { from: n10, to: n9 },
    ];
    */
    
    

    if (localStorage.getItem('storedGraph')) {
        console.log("Loaded stored graph");
        let data = JSON.parse(localStorage.getItem('storedGraph'));
        nodes = data.nodes;
        edges = data.edges.map(x => ({ from: nodes[x.from], to: nodes[x.to] }));
    }

    for (let node of nodes) node.layer = 0;
    let q: Node[] = nodes.filter(x => !edges.some(y => y.to === x));
    while (q.length > 0) {
        let rn = q.shift();
        let children = edges.filter(x => x.from === rn).map(x => x.to);
        for (let child of children) {
            child.layer = rn.layer-1;
        }
        q.push(...children);
    }
    let lowestLayer = Math.min(...nodes.map(x => x.layer));
    nodes.forEach(x => x.layer -= lowestLayer);

    q = nodes.filter(x => !edges.some(y => y.from === x));
    for (let node of nodes) node.layer = 0;
    while (q.length > 0) {
        let rn = q.shift();
        let parents = edges.filter(x => x.to === rn).map(x => x.from);
        for (let parent of parents) {
            parent.layer = rn.layer+1;
        }
        q.push(...parents);
    }

    let rawNodes = [...nodes];
    let rawEdges = [...edges];

    // Add dummy nodes for long edges
    for (let j = 0; j < edges.length; j++) {
        let edge = edges[j];

        if (edge.from.layer - edge.to.layer > 1) {
            edges.splice(j--, 1);

            let prevNode = edge.from;
            for (let i = edge.from.layer; i > edge.to.layer; i--) {
                let nextNode: Node = (i === edge.to.layer + 1) ?
                    edge.to :
                    { dummy: true, label: '', value: 'dummy', layer: i - 1 };

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

    for (let node of nodes) node.x = Infinity;
    
    let highestLayer = Math.max(...nodes.map(x => x.layer));
    for (let layer = 0; layer <= highestLayer; layer++) {
        let deezNodes = nodes.filter(x => x.layer === layer);
        if (true || layer === 0) {
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

    const nodeHeight = (n: Node) => {
        return n.dummy ? DUMMY_NODE_HEIGHT_FACTOR : 1;
    };

    const computeNeighbors = () => {
        let sortedNodes = [...nodes].sort((a, b) => a.x - b.x).sort((a, b) => a.layer - b.layer);
        for (let node of nodes) {
            node.neighbor = sortedNodes.find((x, i) => x.layer === node.layer && i > sortedNodes.indexOf(node)) ?? null;
        }
        return sortedNodes;
    };
    computeNeighbors();

    const computeForces = (noCollision: boolean) => {
        let did = new Set<Node>();

        for (let node of nodes) node.a = 0;
        for (let edge of edges) {
            let force = (edge.from.x + nodeHeight(edge.from)/2) - (edge.to.x + nodeHeight(edge.to)/2);
            if (noCollision) force = edge.from.x - edge.to.x;

            edge.to.a += force / 2;
            edge.from.a -= force / 2;
        }

        if (!noCollision) for (let node of nodes) {
            if (!node.neighbor) continue;
            if (did.has(node)) continue;

            let connected = [node];
            while (
                connected.at(-1).neighbor &&
                connected.at(-1).neighbor.x - (connected.at(-1).x + nodeHeight(connected.at(-1)) + 1e-6) <= 0
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

            
            /*
            let avg = connected.reduce((a, b) => a + b.a, 0) / connected.length;
            for (let n of connected) {
                n.a = avg;
            }
            */
            

            for (let n of connected.slice(0, -1)) {
                let force = 0.25 * Math.min(n.neighbor.x - (n.x + nodeHeight(n)), 0);

                for (let m of connected) {
                    let sign = connected.indexOf(m) <= connected.indexOf(n) ? 1 : -1;
                    m.a += sign * force;
                }
            }
        }
    };

    const iterate = (noCollision = false) => {
        let h = 0.25;

        console.time()
        
        for (let i = 0; i < 1; i++) {
            let x = nodes.map(n => n.x);
            computeForces(noCollision);

            
            //debugger;
            nodes.forEach(n => n.x += h * n.a);


            let highestDx = Math.max(...nodes.map((n, i) => Math.abs(x[i] - n.x)));
            //if (highestDx < 0.001 || noCollision) break;
        }
        
        console.timeEnd()
    };

    const getNodePosition = (node: Node, center = false) => {
        let x = 300 * (highestLayer - node.layer);
        let y = 100 * node.x;

        if (center) {
            x += NODE_WIDTH/2;
            if (!node.dummy) y += NODE_HEIGHT/2 * nodeHeight(node);
        }

        return { x, y };
    };

    const render = () => {
        if (doIterate) iterate();

        ctx.resetTransform();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.scale(scale, scale);
        ctx.translate(originX, originY);

        for (let edge of edges) {
            drawEdge(edge, edges.indexOf(edge));
        }

        for (let [index, node] of nodes.entries()) {
            drawNode(node, index);
        }

        requestAnimationFrame(render);
    };

    const drawNode = (node: Node, n: number) => {
        let { x, y } = getNodePosition(node);
        let value = node.value ?? node.label; // temp
        let label = `${node.x.toFixed(2)} ${node.a?.toFixed(2)}` ?? node.value;

        if (!node.dummy) {
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
        }

        if (showNodeBoundingBoxes) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = `hsl(${100 + 50 * n}, 60%, 60%)`;
            roundedRect(x, y, NODE_WIDTH, 100 * nodeHeight(node), 6);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
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

    const drawEdge = (edge: Edge, n = 0) => {
        if (edge.from.dummy) return;

        if (!edge.to.dummy) {
            let p1 = getNodePosition(edge.from);
            let p2 = getNodePosition(edge.to);

            ctx.beginPath();
            
            let c1 = getNodePosition(edge.from, true);
            let c2 = getNodePosition(edge.to, true);
            let angle = Math.atan2(c2.y-c1.y, c2.x-c1.x) * 0.8; // Dampen the angle a bit

            let { x: x1, y: y1 } = getPosAroundNode(p1.x, p1.y, angle);
            let { x: x2, y: y2 } = getPosAroundNode(p2.x, p2.y, Math.PI + angle);

            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo((x1+x2)/2, y2, x2, y2);

            drawArrow(n, x2, y2, 0);
        } else {
            let path = [edge.from, edge.to];
            while (path.at(-1).dummy) path.push(path.at(-1).out[0]);

            const catmullRom = (t: number, p0: number, p1: number, p2: number, p3: number) => {
                let point = t*t*t*((-1) * p0 + 3 * p1 - 3 * p2 + p3) / 2;
                point += t*t*(2*p0 - 5 * p1+ 4 * p2 - p3) / 2;
                point += t*((-1) * p0 + p2) / 2;
                point += p1;

                return point;
            };

            let points: { x: number, y: number }[] = [];

            for (let i = 0; i < path.length-1; i++) {
                let from = path[i];
                let to = path[i+1];

                let p1 = getNodePosition(from, true);
                let p2 = getNodePosition(to, true);
                let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);

                if (!from.dummy) p1 = getPosAroundNode(getNodePosition(from).x, getNodePosition(from).y, angle);
                if (!to.dummy) p2 = getPosAroundNode(getNodePosition(to).x, getNodePosition(to).y, Math.PI + angle);

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

            drawArrow(n, points.at(-2).x, points.at(-2).y, angle);
        }
    };

    const drawArrow = (n: number, endX: number, endY: number, endAngle: number) => {
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
    };

    const store = () => {
        localStorage.setItem('storedGraph', JSON.stringify({
            nodes: rawNodes.map(x => ({ label: x.label, value: x.value })),
            edges: rawEdges.map(x => ({ from: nodes.indexOf(x.from), to: nodes.indexOf(x.to) }))
        }));
        console.log("Stored");
    };

    const spreadOut = () => {
        let highestLayer = Math.max(...nodes.map(x => x.layer));
        for (let layer = 0; layer <= highestLayer; layer++) {
            let deezNodes = nodes.filter(x => x.layer === layer).sort((a, b) => a.x-b.x);
            deezNodes.forEach((x, i) => x.x = i);
        }
    };

    const arrangeChildrenFromParents = () => {
        let sorted = [...nodes].sort((a, b) => a.x - b.x);
        for (let node of sorted) node.x = Infinity;
        
        let highestLayer = Math.max(...sorted.map(x => x.layer));
        for (let layer = highestLayer; layer >= 0; layer--) {
            let deezNodes = sorted.filter(x => x.layer === layer);
            if (layer === highestLayer) {
                deezNodes.forEach((x, i) => x.x = i);
            } else {
                deezNodes.forEach(x => x.x /= x.in.length);
                deezNodes.sort((a, b) => a.x - b.x);
                deezNodes.forEach((x, i) => x.x = i);
            }

            for (let edge of edges) {
                if (edge.from.layer !== layer) continue;
                if (!isFinite(edge.to.x)) edge.to.x = 0;
                edge.to.x += edge.from.x;
            }
        }

        computeNeighbors();
    };

    const decross = () => {
        let last: Node[] = null;

        let j: number;
        for (j = 0; j < 100; j++) {
            for (let i = 0; i < 50; i++) iterate(true);
            let sortedNodes = computeNeighbors();
            //badName();
            spreadOut();

            if (last && last.every((n, i) => n === sortedNodes[i])) {
                break;
            }
            last = sortedNodes;
        }

        console.log("j", j);
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
    on:keydown={e => e.code === 'KeyI' && !e.altKey && iterate(e.shiftKey)}
    on:keydown={e => e.code === 'KeyI' && e.altKey && (doIterate = true)}
    on:keydown={e => e.code === 'KeyO'}
    on:keydown={e => e.code === 'KeyP' && spreadOut()}
    on:keydown={e => e.code === 'KeyD' && decross()}
    on:keydown={e => e.code === 'KeyB' && (showNodeBoundingBoxes = !showNodeBoundingBoxes)}
    on:keydown={e => e.code === 'KeyS' && !e.shiftKey && store()}
    on:keydown={e => e.code === 'KeyS' && e.shiftKey && localStorage.removeItem('storedGraph')}
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