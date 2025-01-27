type GraphNode =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K';
type Graph = Record<GraphNode, GraphNode[]>;

type StrategyResult<R> =
  | { success: false }
  | {
      success: true;
      result: R;
    };
type Strategy<R> = (
  parentNode: GraphNode,
  currentNode: GraphNode,
  to: GraphNode
) => StrategyResult<R>;

const graph: Graph = {} as Graph;
graph['A'] = ['B', 'C'];
graph['B'] = ['D', 'E'];
graph['C'] = ['D', 'F'];
graph['D'] = ['H', 'I'];
graph['E'] = ['G', 'H'];
graph['F'] = ['I'];
graph['G'] = ['J'];
graph['H'] = [];
graph['I'] = ['K'];
graph['J'] = ['K'];
graph['K'] = [];

const getGraph = (node: GraphNode) => graph[node];
const getAsyncGraph = (node: GraphNode) => Promise.resolve(graph[node]);

const pathExistsStrategy: Strategy<boolean> = (
  _: GraphNode,
  currentNode: GraphNode,
  to: GraphNode
) => {
  const exists = currentNode === to;

  if (!exists) {
    return { success: false };
  }

  return {
    success: exists,
    result: exists,
  };
};

const createShortestRouteStrategy = (): Strategy<GraphNode[]> => {
  const nodeConnections: Record<GraphNode, GraphNode> = {} as Record<
    GraphNode,
    GraphNode
  >;

  return (parentNode: GraphNode, currentNode: GraphNode, to: GraphNode) => {
    nodeConnections[currentNode] = parentNode;

    if (currentNode !== to) {
      return { success: false };
    }

    const route: GraphNode[] = [];
    let routeNode = currentNode;
    while (routeNode) {
      route.push(routeNode);

      routeNode = nodeConnections[routeNode] ?? undefined;
    }

    return {
      success: true,
      result: route.reverse(),
    };
  };
};

function syncBfs<R>(from: GraphNode, to: GraphNode, strategy: Strategy<R>) {
  const queue = [from];
  const visited = new Set<GraphNode>();

  while (queue.length !== 0) {
    const node = queue.shift();

    if (!node) continue;
    if (visited.has(node)) continue;
    visited.add(node);

    const childs = getGraph(node);

    for (let childNode of childs) {
      const r = strategy(node, childNode, to);

      if (r.success) return r.result;

      queue.push(childNode);
    }
  }

  return false;
}

async function asyncBfs<R>(
  from: GraphNode,
  to: GraphNode,
  strategy: Strategy<R>
) {
  const queue = [from];
  const visited = new Set<GraphNode>();

  while (queue.length !== 0) {
    const node = queue.shift();

    if (!node) continue;
    if (visited.has(node)) continue;
    visited.add(node);

    const childs = await getAsyncGraph(node);

    for (let childNode of childs) {
      const r = strategy(node, childNode, to);

      if (r.success) return r.result;

      queue.push(childNode);
    }
  }

  return false;
}

function promisedBfs<R>(from: GraphNode, to: GraphNode, strategy: Strategy<R>) {
  return new Promise((resolve, reject) => {
    let queuedPromises = 0;
    const queue = [from];
    const visited = new Set<GraphNode>();

    const run = () => {
      if (queue.length === 0 && queuedPromises === 0) {
        resolve(false);
        return;
      }

      while (queue.length !== 0) {
        const node = queue.shift();

        if (!node) continue;

        if (visited.has(node)) {
          run();
          continue;
        }

        visited.add(node);

        queuedPromises += 1;

        getAsyncGraph(node).then(childs => {
          queuedPromises -= 1;

          for (let childNode of childs) {
            const r = strategy(node, childNode, to);

            if (r.success) {
              resolve(r.result);
              return;
            }

            queue.push(childNode);
          }

          run();
        });
      }
    };

    run();
  });
}

// console.log(syncBfs('A', 'K', createShortestRouteStrategy()));
// console.log(syncBfs('A', 'H', createShortestRouteStrategy()));
// console.log(syncBfs('B', 'A', createShortestRouteStrategy()));

// asyncBfs('A', 'K', createShortestRouteStrategy()).then(r => console.log(r));
// asyncBfs('A', 'H', createShortestRouteStrategy()).then(r => console.log(r));
// asyncBfs('B', 'A', createShortestRouteStrategy()).then(r => console.log(r));

promisedBfs('A', 'K', createShortestRouteStrategy()).then(r => console.log(r));
promisedBfs('A', 'H', createShortestRouteStrategy()).then(r => console.log(r));
promisedBfs('B', 'A', createShortestRouteStrategy()).then(r => console.log(r));
