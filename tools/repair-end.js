const fs = require("fs");

const file = process.argv[2] || "index.js";

let code = fs.readFileSync(file, "utf8");

console.log("🛠 Repairing file...");

// ================= FIX 1: Missing IIFE end =================

const openIIFE = (code.match(/\(async\s*\(\)\s*=>\s*\{/g) || []).length;
const closeIIFE = (code.match(/\}\)\s*\(\)/g) || []).length;

if(openIIFE > closeIIFE){
  console.log("⚠️ Fixing missing IIFE closure...");
  code += "\n})();\n";
}

// ================= FIX 2: Missing app.listen safety =================

if(!code.includes("app.listen")){
  console.log("⚠️ WARNING: No app.listen found!");
}

// ================= FIX 3: Ensure file ends clean =================

code = code.trimEnd();

// if file ends inside function → close safely
const openBraces = (code.match(/\{/g) || []).length;
const closeBraces = (code.match(/\}/g) || []).length;

if(openBraces > closeBraces){
  const diff = openBraces - closeBraces;

  console.log(`⚠️ Adding ${diff} missing }`);

  for(let i=0;i<diff;i++){
    code += "\n}";
  }
}

// ================= SAVE =================

fs.writeFileSync(file, code, "utf8");

console.log("✅ Repair finished");