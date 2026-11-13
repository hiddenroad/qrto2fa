import { $ } from "bun";
import { mkdir } from "node:fs/promises";
import pkg from "../package.json";

const OUT = "dist/packages";

await $`bun scripts/build.ts`;
await mkdir(OUT, { recursive: true });
for (const target of ["chrome", "firefox"]) {
  await $`bunx web-ext build -s dist/${target} -a ${OUT} -n qrto2fa-${target}-${pkg.version}.zip -o`.quiet();
}
await $`tar -czf ${OUT}/qrto2fa-source-${pkg.version}.tar.gz --exclude=node_modules --exclude=dist --exclude=.env --exclude=.git .`;
console.log(`packed ${OUT}`);
