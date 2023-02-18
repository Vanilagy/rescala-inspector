<script lang="ts">
    import { onMount } from "svelte";

    const NODE_WIDTH = 150;
    const NODE_HEIGHT = 70;
    const DUMMY_NODE_HEIGHT_FACTOR = 1/3;

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    let innerWidth = window.innerWidth;
    let innerHeight = window.innerHeight;
    let spacePressed = false;
    let mouseHeld = false;
    let scale = 1;
    let originX = 200;
    let originY = 100;
    let doIterate = false;
    let showNodeBoundingBoxes = false;

    const reScalaEvents =[
        {"type":"Create","resource":{"idCounter":1,"description":"","enclosing":"todo.TodoAppUI#inputFieldHandler handler","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":109}},
{"type":"Create","resource":{"idCounter":2,"description":"","enclosing":"todo.TodoAppUI#inputFieldHandler handlerEvent","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":119},"inputs":[{"idCounter":1,"description":"","enclosing":"todo.TodoAppUI#inputFieldHandler handler","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":109}]},
{"type":"Discover","source":{"idCounter":1,"description":"","enclosing":"todo.TodoAppUI#inputFieldHandler handler","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":109},"sink":{"idCounter":2,"description":"","enclosing":"todo.TodoAppUI#inputFieldHandler handlerEvent","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":119}},
{"type":"Create","resource":{"idCounter":3,"description":"","enclosing":"todo.TodoAppUI#getContents removeAll","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":39}},
{"type":"Create","resource":{"idCounter":4,"description":"","enclosing":"todo.TodoAppUI#getContents toggleAll","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":43}},
{"type":"Create","resource":{"idCounter":5,"description":"","enclosing":"todo.TodoAppUI#getContents deltaEvt","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":48}},
{"type":"Create","resource":{"idCounter":6,"description":"","enclosing":"todo.TodoAppUI#getContents tasksRDT","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":59},"inputs":[{"idCounter":2,"description":"","enclosing":"todo.TodoAppUI#inputFieldHandler handlerEvent","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":119},{"idCounter":3,"description":"","enclosing":"todo.TodoAppUI#getContents removeAll","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":39},{"idCounter":5,"description":"","enclosing":"todo.TodoAppUI#getContents deltaEvt","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":48}]},
{"type":"Discover","source":{"idCounter":2,"description":"","enclosing":"todo.TodoAppUI#inputFieldHandler handlerEvent","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":119},"sink":{"idCounter":6,"description":"","enclosing":"todo.TodoAppUI#getContents tasksRDT","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":59}},
{"type":"Discover","source":{"idCounter":3,"description":"","enclosing":"todo.TodoAppUI#getContents removeAll","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":39},"sink":{"idCounter":6,"description":"","enclosing":"todo.TodoAppUI#getContents tasksRDT","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":59}},
{"type":"Discover","source":{"idCounter":5,"description":"","enclosing":"todo.TodoAppUI#getContents deltaEvt","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":48},"sink":{"idCounter":6,"description":"","enclosing":"todo.TodoAppUI#getContents tasksRDT","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":59}},
{"type":"Create","resource":{"idCounter":7,"description":"","enclosing":"todo.Storing.storedAs","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/Storing.scala","line":34},"inputs":[{"idCounter":6,"description":"","enclosing":"todo.TodoAppUI#getContents tasksRDT","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":59}]},
{"type":"Discover","source":{"idCounter":6,"description":"","enclosing":"todo.TodoAppUI#getContents tasksRDT","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":59},"sink":{"idCounter":7,"description":"","enclosing":"todo.Storing.storedAs","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/Storing.scala","line":34}},
{"type":"Create","resource":{"idCounter":8,"description":"","enclosing":"todo.TodoAppUI#getContents tasksList","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":64},"inputs":[{"idCounter":6,"description":"","enclosing":"todo.TodoAppUI#getContents tasksRDT","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":59}]},
{"type":"Discover","source":{"idCounter":6,"description":"","enclosing":"todo.TodoAppUI#getContents tasksRDT","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":59},"sink":{"idCounter":8,"description":"","enclosing":"todo.TodoAppUI#getContents tasksList","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":64}},
{"type":"Value","source":{"idCounter":8,"description":"","enclosing":"todo.TodoAppUI#getContents tasksList","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":64},"value":"<some html>"},
{"type":"Create","resource":{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66},"inputs":[{"idCounter":8,"description":"","enclosing":"todo.TodoAppUI#getContents tasksList","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":64}]},
{"type":"Discover","source":{"idCounter":8,"description":"","enclosing":"todo.TodoAppUI#getContents tasksList","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":64},"sink":{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66}},
{"type":"Value","source":{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66},"value":"<some html>"},
{"type":"Create","resource":{"idCounter":10,"description":"","enclosing":"todo.TodoAppUI#getContents taskTags","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":67},"inputs":[{"idCounter":8,"description":"","enclosing":"todo.TodoAppUI#getContents tasksList","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":64}]},
{"type":"Discover","source":{"idCounter":8,"description":"","enclosing":"todo.TodoAppUI#getContents tasksList","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":64},"sink":{"idCounter":10,"description":"","enclosing":"todo.TodoAppUI#getContents taskTags","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":67}},
{"type":"Value","source":{"idCounter":10,"description":"","enclosing":"todo.TodoAppUI#getContents taskTags","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":67},"value":"<some html>"},
{"type":"Create","resource":{"idCounter":11,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":80},"inputs":[{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66}]},
{"type":"Discover","source":{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66},"sink":{"idCounter":11,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":80}},
{"type":"Value","source":{"idCounter":11,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":80},"value":"<some html>"},
{"type":"Create","resource":{"idCounter":12,"description":"","enclosing":"rescala.extra.Tags#SignalTagListToScalatags#asModifierL","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":57},"inputs":[{"idCounter":10,"description":"","enclosing":"todo.TodoAppUI#getContents taskTags","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":67}]},
{"type":"Discover","source":{"idCounter":10,"description":"","enclosing":"todo.TodoAppUI#getContents taskTags","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":67},"sink":{"idCounter":12,"description":"","enclosing":"rescala.extra.Tags#SignalTagListToScalatags#asModifierL","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":57}},
{"type":"Value","source":{"idCounter":12,"description":"","enclosing":"rescala.extra.Tags#SignalTagListToScalatags#asModifierL","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":57},"value":"<some html>"},
{"type":"Create","resource":{"idCounter":13,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":90},"inputs":[{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66}]},
{"type":"Discover","source":{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66},"sink":{"idCounter":13,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":90}},
{"type":"Value","source":{"idCounter":13,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":90},"value":"<some html>"},
{"type":"Create","resource":{"idCounter":14,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":100},"inputs":[{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66}]},
{"type":"Discover","source":{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66},"sink":{"idCounter":14,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":100}},
{"type":"Value","source":{"idCounter":14,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":100},"value":"Value(<span class=\"todo-count\"><strong>0</strong><span> items left</span></span>)"},
{"type":"Create","resource":{"idCounter":15,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":103},"inputs":[{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66}]},
{"type":"Discover","source":{"idCounter":9,"description":"","enclosing":"todo.TodoAppUI#getContents tasksData","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":66},"sink":{"idCounter":15,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":103}},
{"type":"Value","source":{"idCounter":15,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":103},"value":"Value(<button class=\"clear-completed hidden\">remove all done todos</button>)"},
{"type":"Create","resource":{"idCounter":16,"description":"","enclosing":"rescala.extra.Tags#genericReactiveAttrValue $anon#apply","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":159},"inputs":[{"idCounter":11,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":80}]},
{"type":"Discover","source":{"idCounter":11,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":80},"sink":{"idCounter":16,"description":"","enclosing":"rescala.extra.Tags#genericReactiveAttrValue $anon#apply","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":159}},
{"type":"Create","resource":{"idCounter":17,"description":"","enclosing":"rescala.extra.Tags#RETagListModifier#applyTo","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":142},"inputs":[{"idCounter":12,"description":"","enclosing":"rescala.extra.Tags#SignalTagListToScalatags#asModifierL","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":57}]},
{"type":"Discover","source":{"idCounter":12,"description":"","enclosing":"rescala.extra.Tags#SignalTagListToScalatags#asModifierL","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":57},"sink":{"idCounter":17,"description":"","enclosing":"rescala.extra.Tags#RETagListModifier#applyTo","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":142}},
{"type":"Create","resource":{"idCounter":18,"description":"","enclosing":"rescala.extra.Tags#genericReactiveAttrValue $anon#apply","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":159},"inputs":[{"idCounter":13,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":90}]},
{"type":"Discover","source":{"idCounter":13,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":90},"sink":{"idCounter":18,"description":"","enclosing":"rescala.extra.Tags#genericReactiveAttrValue $anon#apply","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":159}},
{"type":"Create","resource":{"idCounter":20,"description":"","enclosing":"rescala.extra.Tags#REFragModifier#applyTo","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":85},"inputs":[{"idCounter":14,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":100}]},
{"type":"Discover","source":{"idCounter":14,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":100},"sink":{"idCounter":20,"description":"","enclosing":"rescala.extra.Tags#REFragModifier#applyTo","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":85}},
{"type":"Create","resource":{"idCounter":22,"description":"","enclosing":"rescala.extra.Tags#REFragModifier#applyTo","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":85},"inputs":[{"idCounter":15,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":103}]},
{"type":"Discover","source":{"idCounter":15,"description":"","enclosing":"todo.TodoAppUI#getContents","file":"/Users/davidpayr/git/private/REScala/Modules/Example Todolist/src/main/scala/todo/TodoAppUI.scala","line":103},"sink":{"idCounter":22,"description":"","enclosing":"rescala.extra.Tags#REFragModifier#applyTo","file":"/Users/davidpayr/git/private/REScala/Modules/Reactives/js/src/main/scala/rescala/extra/Tags.scala","line":85}},

];
    
    onMount(() => {
        ctx = canvas.getContext('2d', { desynchronized: true });
        render();
    });

    const onMouseMove = (e: MouseEvent) => {
        if (!spacePressed || !mouseHeld) return;

        originX += e.movementX; 
        originY += e.movementY;
    };

    const onWheel = (e: WheelEvent) => {
        e.preventDefault();

        let scaleChange = Math.pow(1.002, -e.deltaY);

        originX = (originX - e.clientX) * scaleChange + e.clientX;
        originY = (originY - e.clientY) * scaleChange + e.clientY;
        scale *= scaleChange;
    };

    interface Node {
        id?: number,
        label: string,
        value: string,
        layer?: number,
        x?: number,
        a?: number,
        in?: Node[],
        out?: Node[],
        neighbor?: Node,
        dummy?: boolean,
        component?: number
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
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    for (let event of reScalaEvents) {
        if (event.type === 'Create') {
            let newNode: Node = {
                id: event.resource.idCounter,
                label: event.resource.enclosing.split('#').at(-1).split(':')[0].split(' ').at(-1).split('.').at(-1),
                value: null
            };
            nodes.push(newNode);

            if (!event.inputs) continue;

            for (let input of event.inputs) {
                let node = nodes.find(x => x.id === input.idCounter);
                if (node) edges.push({ from: node, to: newNode });
            }
        } else if (event.type === 'Discover') {
            let n1 = nodes.find(x => x.id === event.source.idCounter);
            let n2 = nodes.find(x => x.id === event.sink.idCounter);
            if (n1 && n2 && !edges.some(x => x.from === n1 && x.to === n2)) {
                edges.push({ from: n1, to: n2 });
            }
        } else if (event.type === 'Value') {
            let n = nodes.find(x => x.id === event.source.idCounter);
            n.value = event.value;
        }
    }

    /*
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
    */

    if (localStorage.getItem('storedGraph')) {
        console.log("Loaded stored graph");
        let data = JSON.parse(localStorage.getItem('storedGraph'));
        nodes = data.nodes;
        edges = data.edges.map(x => ({ from: nodes[x.from], to: nodes[x.to] }));
    }

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
    for (let node of nodes) node.layer = longestOutgoingPath(node);

    // See if long edges can be shortened
    let done = new Set<Edge>();
    while (true) {
        let nextEdge = edges.filter(x => x.from.layer - x.to.layer >= 2).sort((a, b) => b.to.layer - a.to.layer).find(x => !done.has(x))
        if (!nextEdge) break;

        let node = nextEdge.to;
        let parents = edges.filter(x => x.to === node).map(x => x.from);

        const computeConnectedEdgeLength = () => {
            return edges
                .filter(x => x.from === node || parents.includes(x.from) || parents.includes(x.to))
                .reduce((a, b) => {
                    // If the two layers match (difference = 0), return Infinity, because we never want that to happen
                    return a + ((b.from.layer - b.to.layer) || Infinity);
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

    // Assign each node its connected component
    const computeComponent = (node: Node, i: number) => {
        if (node.component !== undefined) return;
        node.component = i;
        for (let child of node.out) computeComponent(child, i);
        for (let parent of node.in) computeComponent(parent, i);
    };
    for (let [i, node] of nodes.filter(x => x.in.length === 0).entries()) computeComponent(node, i);

    for (let node of nodes) node.x = Infinity;
    
    let highestLayer = Math.max(...nodes.map(x => x.layer));
    for (let layer = 0; layer <= highestLayer; layer++) {
        let deezNodes = nodes.filter(x => x.layer === layer);
        deezNodes.forEach((x, i) => x.x = i);
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

        if (noCollision) return;

        for (let node of nodes) {
            if (!node.neighbor) continue

            // Spring force between nodes of the same layer
            let dist = node.neighbor.x - (node.x + nodeHeight(node));
            let wanted = 1;
            let delta = Math.max(wanted - dist, 0);

            let force = 0.5 * delta;
            node.a -= force;
            node.neighbor.a += force;
        }

        for (let node of nodes) {
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

        for (let i = 0; i < 1; i++) {
            let x = nodes.map(n => n.x);
            computeForces(noCollision);
            nodes.forEach(n => n.x += h * n.a);

            let highestDx = Math.max(...nodes.map((n, i) => Math.abs(x[i] - n.x)));
            //if (highestDx < 0.001 || noCollision) break;
        }
    };

    const getNodePosition = (node: Node, center = false) => {
        let x = 350 * (highestLayer - node.layer);
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
        ctx.translate(originX, originY);
        ctx.scale(scale, scale);

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
        let label = node.label;
        let value = node.value;

        if (!node.dummy) {
            roundedRect(x, y, NODE_WIDTH, NODE_HEIGHT, 6);

            ctx.strokeStyle = '#474a52';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#292a2d';
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.font = '14px Inter';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(label, x+NODE_WIDTH/2, y+NODE_HEIGHT/2);

            if (node.value !== null) {
                ctx.font = '10px Inter';
                ctx.fillText(value, x+NODE_WIDTH/2, y+60);
            }
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

    const getPosAroundNode = (node: Node, angle: number) => {
        let { x: centerX, y: centerY } = getNodePosition(node, true);

        let margin = 7;
        let extendedWidth = NODE_WIDTH/2 + margin;
        let extendedHeight = NODE_HEIGHT/2 * nodeHeight(node) + margin;

        let x = Math.cos(angle) * extendedWidth;
        let y = Math.sin(angle) * extendedHeight;

        if (Math.abs(Math.tan(angle)) < 1) { // Math.abs(Math.cos(angle)) < Math.abs(Math.tan(angle))
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

    const quadraticBezierDerivative = (p0: number, p1: number, p2: number, t: number) => {
        return 2*(1-t)*(p1-p0) + 2*t*(p2-p1);
    };

    const drawEdge = (edge: Edge, n = 0) => {
        if (edge.from.dummy) return;

        if (!edge.to.dummy) {
            ctx.beginPath();
            
            let c1 = getNodePosition(edge.from, true);
            let c2 = getNodePosition(edge.to, true);
            let angle = Math.atan2(c2.y-c1.y, c2.x-c1.x);
            const dampeningThreshold = Math.PI/6;
            if (Math.abs(angle) >= dampeningThreshold) {
                // Dampen the angle a bit
                angle = Math.sign(angle) * (dampeningThreshold + 0.5*(Math.abs(angle) - dampeningThreshold))
            }

            let { x: x1, y: y1 } = getPosAroundNode(edge.from, angle);
            let { x: x2, y: y2 } = getPosAroundNode(edge.to, Math.PI + angle);

            let cpx = (x1+x2)/2;
            let cpy = 0.2*y1 + 0.8*y2;
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cpx, cpy, x2, y2);

            let endAngle = Math.atan2(
                quadraticBezierDerivative(y1, cpy, y2, 1),
                quadraticBezierDerivative(x1, cpx, x2, 1)
            );

            drawArrow(n, x2, y2, endAngle);
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

                if (!from.dummy) p1 = getPosAroundNode(from, angle);
                if (!to.dummy) p2 = getPosAroundNode(to, Math.PI + angle);

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
            let deezNodes = nodes.filter(x => x.layer === layer).sort((a, b) => a.x-b.x).sort((a, b) => a.component - b.component);
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
    on:wheel={onWheel}
/>
<button class="absolute top-0 left-0 bg-[#292a2d] px-2 py-1 rounded-md shadow m-3 text-sm">Do the Harlem Shake</button>