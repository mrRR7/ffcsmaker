// Runs src/**/*.test.ts with Node's built-in test runner. esbuild (already a
// devDependency for the bookmarklet build) bundles each test first so the
// @/ path alias and extensionless imports resolve; no test framework needed.
import { build } from "esbuild";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const entryPoints = readdirSync("src", { recursive: true })
  .filter((file) => file.endsWith(".test.ts"))
  .map((file) => join("src", file));

const { metafile } = await build({
  entryPoints,
  // Outside the repo, and not under node_modules (node --test skips that).
  outdir: join(tmpdir(), "ffcs-unit-tests"),
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  format: "esm",
  metafile: true,
  logLevel: "warning"
});

const result = spawnSync(process.execPath, ["--test", ...Object.keys(metafile.outputs)], {
  stdio: "inherit"
});
process.exit(result.status ?? 1);
