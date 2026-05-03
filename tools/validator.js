const fs = require("fs");

const file = process.argv[2] || "index.js";

const code = fs.readFileSync(file, "utf8");

// ================= BASIC CHECKS =================

function count(char){
  return (code.match(new RegExp("\\" + char, "g")) || []).length;
}

const checks = [
  { name: "{ } Braces", open: "{", close: "}" },
  { name: "( ) Parens", open: "(", close: ")" },
  { name: "[ ] Brackets", open: "[", close: "]" }
];

console.log("\n🔥 INDEX.JS VALIDATOR\n");

let hasError = false;

for(const c of checks){

  const open = count(c.open);
  const close = count(c.close);

  if(open !== close){
    hasError = true;
    console.log(`❌ ${c.name} mismatch → open: ${open} | close: ${close}`);
  } else {
    console.log(`✅ ${c.name} OK`);
  }
}

// ================= STRUCTURE CHECK =================

const openFunctions = (code.match(/function\s+\w+\s*\(/g) || []).length;
const asyncFunctions = (code.match(/async\s+function/g) || []).length;
const arrowFunctions = (code.match(/=>\s*{/g) || []).length;

console.log("\n📊 FUNCTION ANALYSIS:");
console.log("Functions:", openFunctions);
console.log("Async Functions:", asyncFunctions);
console.log("Arrow Blocks:", arrowFunctions);

// ================= END CHECK =================

if(!code.trim().endsWith("}") && !code.trim().endsWith("});")){
  console.log("\n⚠️ FILE ENDS SUSPICIOUSLY (possible cut-off)");
  hasError = true;
}

// ================= RESULT =================

console.log("\n====================");

if(hasError){
  console.log("🔥 RESULT: ❌ ERRORS FOUND");
} else {
  console.log("🔥 RESULT: ✅ CLEAN STRUCTURE");
}

console.log("====================\n");