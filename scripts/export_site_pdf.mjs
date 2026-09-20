#!/usr/bin/env node
/**
 * Print every public page of the site into one letter-size PDF.
 * Requires the dev (or start) server to be running.
 *
 *   npm run pdf
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "mapping-access-under-occupation.pdf");
const TMP = join(ROOT, "tmp", "pdf-export");
const BASE = process.env.BASE_URL || "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";

const PAPER = { format: "Letter", printBackground: true, preferCSSPageSize: true };

const PAGES = [
  { path: "/one-pager", file: "01-one-pager.pdf" },
  { path: "/method", file: "02-method.pdf" },
  { path: "/paper", file: "03-paper.pdf" },
  { path: "/briefing", file: "04-briefing.pdf" },
  { path: "/teach", file: "05-teach.pdf" },
  { path: "/outreach", file: "06-outreach.pdf" },
  { path: "/data", file: "07-data.pdf" },
];

const ATLAS = [
  {
    query: "period=occupation&export=1",
    file: "atlas-occupation.png",
    title: "Occupation, still at home",
    date: "April-June 1944",
    caption:
      "Jews still live across the city. Destinations are municipal market halls and city hospitals. Access is already a timetable.",
  },
  {
    query: "period=yellow-star&export=1",
    file: "atlas-yellow-star.png",
    title: "Yellow-star houses",
    date: "24 June 1944",
    caption:
      "1,944 designated buildings. Leave-home window: three hours. The map of homes has changed; the map of destinations has not.",
  },
  {
    query: "period=sealed&export=1",
    file: "atlas-sealed.png",
    title: "Pest ghetto sealed",
    date: "10 December 1944",
    caption:
      "Kitchens inside the wall, hospitals just outside it. Walking-time bands to food go up. Occupation-adjusted scores collapse.",
  },
  {
    query: "period=sealed&compare=1&export=1",
    file: "atlas-compare.png",
    title: "June vs sealed",
    date: "Gold remaining / grey emptied",
    caption:
      "Gold houses are still legal Jewish residences on 10 December. Grey houses are yellow-star buildings emptied into the two ghettos.",
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HIDE_DEV = `
  nextjs-portal, [data-nextjs-toast] { display: none !important; }
`;

async function printCover(page) {
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: letter; margin: 0.7in; }
  body {
    font-family: "Source Serif 4", Georgia, serif;
    color: #1c1814;
    margin: 0;
  }
  .kicker {
    font-family: system-ui, sans-serif;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-size: 10px;
    color: #8a6a14;
    margin: 0 0 1.2rem;
  }
  h1 {
    font-family: Fraunces, Georgia, serif;
    font-weight: 550;
    font-size: 34px;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin: 0 0 0.4rem;
  }
  .sub { font-size: 16px; color: #5c5348; margin: 0 0 2.2rem; }
  p { font-size: 12.5px; line-height: 1.5; max-width: 36rem; }
  ol { padding-left: 1.2rem; }
  li { font-size: 12.5px; line-height: 1.55; margin: 0.25rem 0; }
  .foot {
    position: fixed;
    bottom: 0;
    left: 0; right: 0;
    font-family: system-ui, sans-serif;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #5c5348;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>
  <p class="kicker">Site dossier · Mapping Access Under Occupation</p>
  <h1>Mapping Access Under Occupation</h1>
  <p class="sub">An accessibility analysis of the Budapest ghetto, 1944–45</p>
  <p>
    This PDF is a print of the project website: atlas plates from the interactive map,
    the completed-research one-pager, the method note, working paper, CAGR briefing,
    teaching module, outreach letters, and data provenance. It is one city, eight months,
    not a GIS of “the Holocaust.”
  </p>
  <p><strong>Contents</strong></p>
  <ol>
    <li>Atlas plates — occupation, yellow-star houses, sealed ghetto, June vs sealed</li>
    <li>One-pager — completed research brief</li>
    <li>Method — occupation-adapted LUPTAI</li>
    <li>Working paper</li>
    <li>CAGR briefing</li>
    <li>Teaching module</li>
    <li>Outreach emails</li>
    <li>Data provenance and HGIS ingest</li>
  </ol>
  <div class="foot">
    <span>Budapest, March 1944–January 1945</span>
    <span>Printed from the project site</span>
  </div>
</body>
</html>`;
  await page.setContent(html, { waitUntil: "load" });
  const dest = join(TMP, "00-cover.pdf");
  await page.pdf({ ...PAPER, path: dest, margin: { top: "0.7in", bottom: "0.7in", left: "0.7in", right: "0.7in" } });
  return dest;
}

async function captureAtlas(page, plate) {
  await page.goto(`${BASE}/?${plate.query}`, {
    waitUntil: "load",
    timeout: 120000,
  });
  await page.addStyleTag({ content: HIDE_DEV });
  await page.waitForSelector(".maplibregl-canvas", { timeout: 90000 });
  await page.waitForSelector(".filmstrip button", { timeout: 90000 });
  await page.waitForSelector("[data-export-ready='1']", { timeout: 90000 });
  await sleep(1500);
  const shell = await page.$(".map-shell");
  const dest = join(TMP, plate.file);
  if (shell) await shell.screenshot({ path: dest, type: "png" });
  else await page.screenshot({ path: dest, type: "png" });
  return dest;
}

async function printRoute(page, route) {
  await page.goto(`${BASE}${route.path}`, {
    waitUntil: "load",
    timeout: 120000,
  });
  await page.addStyleTag({ content: HIDE_DEV });
  await sleep(400);
  const dest = join(TMP, route.file);
  await page.pdf({ ...PAPER, path: dest });
  return dest;
}

async function platesToPdf(pngs) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const ink = rgb(0.11, 0.09, 0.08);
  const muted = rgb(0.36, 0.33, 0.28);
  const gold = rgb(0.54, 0.23, 0.07);

  for (const plate of ATLAS) {
    const page = doc.addPage([792, 612]);
    const png = await doc.embedPng(await (await import("node:fs/promises")).readFile(pngs[plate.file]));
    const maxW = 752;
    const maxH = 500;
    const scale = Math.min(maxW / png.width, maxH / png.height);
    const w = png.width * scale;
    const h = png.height * scale;
    const x = (792 - w) / 2;
    const y = 612 - 36 - h;
    page.drawImage(png, { x, y, width: w, height: h });
    page.drawText("ATLAS", {
      x: 24,
      y: 592,
      size: 8,
      font: bold,
      color: gold,
    });
    page.drawText(`${plate.title}  /  ${plate.date}`, {
      x: 70,
      y: 591,
      size: 11,
      font: bold,
      color: ink,
    });
    page.drawText(plate.caption, {
      x: 24,
      y: 18,
      size: 9,
      font,
      color: muted,
    });
  }
  const bytes = await doc.save();
  const dest = join(TMP, "00b-atlas.pdf");
  await writeFile(dest, bytes);
  return dest;
}

async function merge(files, dest) {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await (await import("node:fs/promises")).readFile(file));
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const p of pages) out.addPage(p);
  }
  await writeFile(dest, await out.save());
}

async function main() {
  await mkdir(TMP, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
    defaultViewport: { width: 1600, height: 980, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  const cover = await printCover(page);

  const pngs = {};
  for (const plate of ATLAS) {
    pngs[plate.file] = await captureAtlas(page, plate);
    console.log("captured", plate.file);
  }
  const atlasPdf = await platesToPdf(pngs);

  const printed = [];
  for (const route of PAGES) {
    printed.push(await printRoute(page, route));
    console.log("printed", route.path);
  }

  await browser.close();

  await merge([cover, atlasPdf, ...printed], OUT);
  console.log("wrote", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
