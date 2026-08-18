// Virtual Document Storage Manager
export function saveMockDoc(title, content) {
  let docs = JSON.parse(localStorage.getItem('promo-mock-docs') || '[]');
  const existIdx = docs.findIndex(d => d.title === title);
  const docObj = { title, content, updated: new Date().toISOString() };
  
  if (existIdx >= 0) {
    docs[existIdx] = docObj;
  } else {
    docs.push(docObj);
  }
  localStorage.setItem('promo-mock-docs', JSON.stringify(docs));
}

export function loadMockDocs() {
  return JSON.parse(localStorage.getItem('promo-mock-docs') || '[]');
}
