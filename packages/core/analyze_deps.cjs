const fs = require('fs');

let raw = fs.readFileSync('dep_graph.json');
if (raw[0] === 0xff && raw[1] === 0xfe) {
    raw = raw.toString('utf16le');
} else {
    raw = raw.toString('utf8');
}
raw = raw.replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

// Build reverse graph
const revData = {};
for (const file in data) {
    if (!revData[file]) revData[file] = [];
    data[file].forEach(dep => {
        if (!revData[dep]) revData[dep] = [];
        if (!revData[dep].includes(file)) {
            revData[dep].push(file);
        }
    });
}

// Find entry points (files not imported by anyone)
const entryPoints = [];
for (const file in data) {
    if (!revData[file] || revData[file].length === 0) {
        entryPoints.push(file);
    }
}

// Find leaf nodes (files that don't import anything)
const leafNodes = [];
for (const file in data) {
    if (data[file].length === 0) {
        leafNodes.push(file);
    }
}

// 1. Circular Dependencies (DFS)
const visited = new Set();
const recStack = new Set();
const circularPaths = [];

function detectCycle(node, path) {
    if (!visited.has(node)) {
        visited.add(node);
        recStack.add(node);
        
        const deps = data[node] || [];
        for (const dep of deps) {
            if (!visited.has(dep) && detectCycle(dep, [...path, dep])) {
                return true;
            } else if (recStack.has(dep)) {
                circularPaths.push([...path, dep]);
            }
        }
    }
    recStack.delete(node);
    return false;
}

for (const node in data) {
    detectCycle(node, [node]);
}

// 2. Orphan Codes
// Orphan code is defined as something with 0 incoming edges, BUT it's not an intentional entry point.
// Let's assume index.ts, main.tsx, App.tsx, test files are intentional.
const intentionalEntries = ['main.tsx', 'index.ts', 'index.tsx', 'App.tsx'];
const orphans = entryPoints.filter(f => !intentionalEntries.some(e => f.endsWith(e)) && !f.includes('.test.') && !f.includes('test-out'));

// 3. Top-Down Traces (12 paths)
const topDownPaths = [];
let tdCount = 0;

function dfsTopDown(node, currentPath) {
    if (tdCount >= 12) return;
    const deps = data[node] || [];
    if (deps.length === 0) {
        topDownPaths.push([...currentPath]);
        tdCount++;
        return;
    }
    for (const dep of deps) {
        if (!currentPath.includes(dep)) {
            dfsTopDown(dep, [...currentPath, dep]);
        }
        if (tdCount >= 12) return;
    }
}

// start from main entry if exists, else first entry point
const mainEntry = entryPoints.find(e => e.includes('main.') || e.includes('index.')) || entryPoints[0];
if (mainEntry) dfsTopDown(mainEntry, [mainEntry]);

// 4. Bottom-Up Traces (30 paths)
const bottomUpPaths = [];
let buCount = 0;

function dfsBottomUp(node, currentPath) {
    if (buCount >= 30) return;
    const parents = revData[node] || [];
    if (parents.length === 0) {
        bottomUpPaths.push([...currentPath]);
        buCount++;
        return;
    }
    for (const parent of parents) {
        if (!currentPath.includes(parent)) {
            dfsBottomUp(parent, [...currentPath, parent]);
        }
        if (buCount >= 30) return;
    }
}

// Shuffle or pick from various leaf nodes to get 30 diverse paths
for (const leaf of leafNodes) {
    if (buCount >= 30) break;
    dfsBottomUp(leaf, [leaf]);
}

const report = {
    totalFiles: Object.keys(data).length,
    entryPoints,
    leafNodes: leafNodes.length,
    circularCount: circularPaths.length,
    circularSample: circularPaths.slice(0, 3),
    orphans,
    topDownPaths: topDownPaths.slice(0, 12),
    bottomUpPaths: bottomUpPaths.slice(0, 30)
};

fs.writeFileSync('analysis_result.json', JSON.stringify(report, null, 2));
console.log('Analysis Complete');
