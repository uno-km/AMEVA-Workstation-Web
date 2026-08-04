const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function test() {
  const filePath = 'C:/Users/GAME/Downloads/test-2.adc';
  if (!fs.existsSync(filePath)) {
    console.log('File not found at:', filePath);
    return;
  }
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  
  console.log('--- ZIP File List ---');
  zip.forEach((relativePath, file) => {
    console.log(relativePath);
  });
  
  console.log('\n--- document.md Contents ---');
  const docFile = zip.file('document.md');
  if (docFile) {
    const text = await docFile.async('text');
    console.log(text);
  } else {
    console.log('document.md NOT FOUND');
  }
}

test().catch(err => console.error(err));
