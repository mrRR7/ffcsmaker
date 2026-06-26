import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
mkdirSync(distDir, { recursive: true });

for (const file of ["manifest.json", "popup.html"]) {
  copyFileSync(join(process.cwd(), file), join(distDir, file));
}