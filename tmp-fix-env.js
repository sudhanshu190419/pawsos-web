const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, ".env.local");
let content = fs.readFileSync(filePath, "utf8");

console.log("BEFORE:", content.match(/SHIPROCKET_PASSWORD=.*/)?.[0]);

// Replace the password line — escape $ with \$ to prevent dotenv-expand from expanding them
const lines = content.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("SHIPROCKET_PASSWORD=")) {
    const value = lines[i].slice("SHIPROCKET_PASSWORD=".length);
    // Replace $ with \$ in the password value only (not in the env var name)
    const escaped = value.replace(/\$/g, "\\$");
    lines[i] = "SHIPROCKET_PASSWORD=" + escaped;
    break;
  }
}
content = lines.join("\r\n");
fs.writeFileSync(filePath, content, "utf8");

console.log("AFTER:", content.match(/SHIPROCKET_PASSWORD=.*/)?.[0]);
