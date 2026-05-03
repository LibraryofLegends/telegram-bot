const fs = require("fs");

const file = process.argv[2] || "index.js";
const code = fs.readFileSync(file, "utf8");

function count(char){
  return (code.match(new RegExp("\\" + char, "g")) || []).length;
}

console.log("\n🔥 INDEX.JS VALIDATOR\n");

const checks = [
  { name: "{ }", open: "{", close: "}" },
  { name: "( )", open: "(", close: ")" },
  { name: "[ ]", open: "[", close: "]" }
];

let error = false;

for (const c of checks) {
  const o = count(c.open);
  const cl = count(c.close);

  if (o !== cl) {
    error = true;
    console.log(`❌ ${c.name}: ${o}/${cl}`);
  } else {
    console.log(`✅ ${c.name}`);
  }
}

if (!code.trim().endsWith("}") && !code.trim().endsWith("});")) {
  console.log("\n⚠️ FILE MAY BE CUT OFF");
  error = true;
}

console.log("\n====================");

console.log(error ? "❌ ERRORS FOUND" : "✅ CLEAN");

console.log("====================\n");