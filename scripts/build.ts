import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { renderIcon } from "./icons";
import { ICON_SIZES, manifestFor, type Target } from "./manifest";

const TARGETS: Target[] = ["chrome", "firefox"];
const dev = Bun.argv.includes("--dev");

async function bundle(outdir: string): Promise<void> {
  const result = await Bun.build({
    entrypoints: ["src/background.ts", "src/content.ts", "src/panel/panel.ts"],
    outdir,
    target: "browser",
    format: "iife",
    minify: !dev,
    sourcemap: dev ? "external" : "none",
    naming: "[name].[ext]",
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
}

async function writeIcons(outdir: string): Promise<void> {
  await mkdir(`${outdir}/icons`, { recursive: true });
  await Promise.all(ICON_SIZES.map((size) => writeFile(`${outdir}/icons/${size}.png`, renderIcon(size))));
}

async function writeNotices(outdir: string): Promise<void> {
  await mkdir(`${outdir}/licenses`, { recursive: true });
  await copyFile("LICENSE", `${outdir}/LICENSE`);
  await copyFile("THIRD_PARTY_NOTICES.md", `${outdir}/THIRD_PARTY_NOTICES.md`);
  await copyFile("licenses/jsQR-Apache-2.0.txt", `${outdir}/licenses/jsQR-Apache-2.0.txt`);
}

async function buildTarget(target: Target): Promise<void> {
  const outdir = `dist/${target}`;
  await bundle(outdir);
  await writeIcons(outdir);
  await writeNotices(outdir);
  await copyFile("src/panel/panel.html", `${outdir}/panel.html`);
  await copyFile("src/panel/panel.css", `${outdir}/panel.css`);
  await writeFile(`${outdir}/manifest.json`, `${JSON.stringify(manifestFor(target), null, 2)}\n`);
  console.log(`built ${outdir}`);
}

await rm("dist", { recursive: true, force: true });
for (const target of TARGETS) await buildTarget(target);
