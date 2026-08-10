const fs = require('fs');
const file = 'packages/core/src/renderer/utils/markdownUtils.ts';
let content = fs.readFileSync(file, 'utf8');

const target1 = `        routeType: copy.props?.routeType || 'none',
        routingEngine: copy.props?.routingEngine || 'osrm'`;
const replace1 = `        routeType: copy.props?.routeType || 'none',
        routingEngine: copy.props?.routingEngine || 'osrm',
        mapMode: copy.props?.mapMode || 'pin',
        useUserLocation: copy.props?.useUserLocation || 'false',
        pins: copy.props?.pins || '[]',
        routes: copy.props?.routes || '[]'`;

const target2 = `            routeType: parsed.routeType || 'none',
            routingEngine: parsed.routingEngine || 'osrm'`;
const replace2 = `            routeType: parsed.routeType || 'none',
            routingEngine: parsed.routingEngine || 'osrm',
            mapMode: parsed.mapMode || 'pin',
            useUserLocation: parsed.useUserLocation || 'false',
            pins: parsed.pins || '[]',
            routes: parsed.routes || '[]'`;

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);
fs.writeFileSync(file, content);
console.log('Done!');
