/**
 * 构建卡面刻印网页字体：微软雅黑 Bold → 按常用 3500 字 + ASCII 子集化
 * → woff2（约 480KB）。产物 public/fonts/msyh-bold-engrave.woff2，
 * 由模型观察页的刻印输入框经 FontFace 懒加载，保证各平台刻印字体一致。
 *
 * 用法：bun scripts/build-engrave-font.ts
 * 依赖：python + fonttools + brotli（pip install fonttools brotli）。
 * 字表：.scratch/common3500.txt（wy-luke/All-Chinese-Character-Set 3500+symbols）。
 * 注意：子集化产物是微软版权字形，仅自用站点分发需自担。
 */
import { readFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const SOURCE = "C:/Windows/Fonts/msyhbd.ttc";
const CHARS_FILE = ".scratch/common3500.txt";
const OUT = "public/fonts/msyh-bold-engrave.woff2";

await mkdir("public/fonts", { recursive: true });
const proc = spawnSync(
  "python",
  [
    "-m", "fontTools.subset", SOURCE,
    "--font-number=0",
    `--text-file=${CHARS_FILE}`,
    "--unicodes=U+0020,U+0021,U+007C,U+002D,U+0030-0039,U+0041-005A,U+0061-007A",
    "--flavor=woff2",
    `--output-file=${OUT}`,
    "--layout-features=*",
    "--no-hinting",
  ],
  { stdio: "inherit" },
);
if (proc.status !== 0) throw new Error(`fontTools.subset exited ${proc.status}`);
const out = await readFile(OUT);
console.log(`written ${OUT}: ${(out.byteLength / 1024).toFixed(0)} KB`);
