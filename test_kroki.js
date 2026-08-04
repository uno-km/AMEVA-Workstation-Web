const https = require('https');
const fs = require('fs');

const code = `graph TD
A-->B`;

// mermaid.ink uses base64 encoded string directly, or pako. 
// Actually, kroki.io is much better and easier!
// https://kroki.io/mermaid/svg/<base64URL>

const zlib = require('zlib');
const buffer = Buffer.from(code, 'utf8');
const deflated = zlib.deflateSync(buffer);
const encoded = deflated.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const url = `https://kroki.io/mermaid/png/${encoded}`;
console.log(url);

https.get(url, (res) => {
  const chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
    fs.writeFileSync('test.png', Buffer.concat(chunks));
    console.log('Saved test.png');
  });
});
