const fs = require("fs");

const file = "index.js";

console.log("\n🛡 ULTRA SAFE CHECK START\n");

if (!fs.existsSync(file)) {
  console.error("❌ index.js fehlt!");
  process.exit(1);
}

let code = fs.readFileSync(file, "utf8");

// ================= BASIC VALIDATION =================

const open = (c, ch) => (c.match(new RegExp("\\" + ch, "g")) || []).length;

const issues = [];

if (open(code, "{") !== open(code, "}")) {
  issues.push("❌ Braces mismatch { }");
}

if (open(code, "(") !== open(code, ")")) {
  issues.push("❌ Parens mismatch ( )");
}

if (open(code, "[") !== open(code, "]")) {
  issues.push("❌ Brackets mismatch [ ]");
}

// ================= END CHECK =================

if (!code.trim().endsWith("}") && !code.trim().endsWith("});")) {
  issues.push("❌ File ends unexpectedly (cut-off detected)");
}

// ================= RESULT =================

if (issues.length > 0) {

  console.log("\n🔥 SAFE CHECK FAILED:\n");

  for (const i of issues) {
    console.log(i);
  }

  console.log("\n🚫 DEPLOY BLOCKED - FIX INDEX.JS FIRST\n");

  process.exit(1);

} else {

  console.log("\n✅ SAFE CHECK PASSED\n");
}