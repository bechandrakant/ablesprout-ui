// Verifies every t("key") used in the code exists in messages/en.json and hi.json (namespaced by useTranslations/getTranslations).
import fs from "fs";
import path from "path";
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const hi = JSON.parse(fs.readFileSync("messages/hi.json", "utf8"));
const has = (obj, key) => key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj) !== undefined;
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  if (["node_modules", ".next", "e2e"].includes(e.name)) return;
  const p = path.join(d, e.name);
  e.isDirectory() ? walk(p) : /\.tsx?$/.test(e.name) && files.push(p);
});
["app", "components", "hooks", "lib"].forEach(walk);
let missing = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const vars = {};
  for (const m of src.matchAll(/const (\w+) = (?:await )?(?:useTranslations|getTranslations)\("([\w.]+)"\)/g)) vars[m[1]] = m[2];
  for (const m of src.matchAll(/\b(\w+)\(\s*"([\w.]+)"/g)) {
    const ns = vars[m[1]];
    if (!ns) continue;
    const key = `${ns}.${m[2]}`;
    for (const [name, cat] of [["en", en], ["hi", hi]]) if (!has(cat, key)) { console.log(`${name}: missing ${key} (${f})`); missing++; }
  }
}
console.log(missing ? `${missing} missing` : "all static keys present");
process.exit(missing ? 1 : 0);
