const s = `{"timeline":"[{\\\"time\\\":\\\"01:00\\\"}]"}`;
console.log(s);
try {
  JSON.parse(s);
  console.log("Success");
} catch(e) {
  console.error(e);
}
