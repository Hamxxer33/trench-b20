import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "node_modules", "@privy-io", "react-auth", "dist");

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(mjs|js)$/.test(name)) {
      const src = readFileSync(p, "utf8");
      const next = src.replaceAll('"clip-path":', "clipPath:").replaceAll("'clip-path':", "clipPath:");
      if (next !== src) writeFileSync(p, next);
    }
  }
}

try {
  walk(root);
} catch {
  // Privy not installed yet
}
