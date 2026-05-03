const fs = require("fs");

const FILE = "index.js";
const BACKUP = "index.backup.js";

console.log("🧠 SELF-HEAL CHECK START");

// ================= LOAD =================

if (!fs.existsSync(FILE)) {
  console.log("❌ index.js fehlt");
  process.exit(1);
}

let code = fs.readFileSync(FILE, "utf8");

// ================= BACKUP =================

fs.writeFileSync(BACKUP, code);
console.log("💾 Backup erstellt");

// ================= BASIC CHECK =================

const open = (c, ch) => (c.match(new RegExp("\\" + ch, "g")) || []).length;

let fixed = false;

// ================= FIX BRACES =================

if (open(code, "{") > open(code, "}")) {
  console.log("⚠️ Fix: missing }");
  code += "\n}";
  fixed = true;
}

// ================= FIX PARENS =================

if (open(code, "(") > open(code, ")")) {
  console.log("⚠️ Fix: missing )");
  code += "\n)";
  fixed = true;
}

// ================= FIX BRACKETS =================

if (open(code, "[") > open(code, "]")) {
  console.log("⚠️ Fix: missing ]");
  code += "\n]";
  fixed = true;
}

// ================= END FIX =================

if (!code.trim().endsWith("}") && !code.trim().endsWith("});")) {
  console.log("⚠️ Fix: file cut-off detected");
  code += "\n}";
  fixed = true;
}

// ================= SAVE =================

fs.writeFileSync(FILE, code, "utf8");

if (fixed) {
  console.log("🛠 Repairs applied");
} else {
  console.log("✅ No issues found");
}

console.log("🧠 SELF-HEAL DONE");