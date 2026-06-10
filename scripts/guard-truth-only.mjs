import fs from "fs";
import path from "path";

const clientArg = process.argv.find((a) => a.startsWith("--client="));
const client = clientArg ? clientArg.split("=")[1] : null;

if (!client) {
  console.error("Missing --client=<slug>");
  process.exit(1);
}

const truthPath = path.resolve(`data/${client}/truth.json`);
if (!fs.existsSync(truthPath)) {
  console.error(`Missing truth file: ${truthPath}`);
  process.exit(2);
}

let truth;
try {
  truth = JSON.parse(fs.readFileSync(truthPath, "utf8"));
} catch (err) {
  console.error(`Invalid JSON in ${truthPath}: ${err.message}`);
  process.exit(3);
}

const required = [
  ["entity", "name"],
  ["entity", "phone"],
  ["entity", "naics"],
  ["location", "street"],
  ["location", "city"],
  ["location", "zip"],
];

for (const [obj, key] of required) {
  if (!truth?.[obj]?.[key]) {
    console.error(`Missing required truth field: ${obj}.${key}`);
    process.exit(4);
  }
}

const textBlob = [
  truth?.entity?.name,
  truth?.entity?.legalName,
  truth?.portfolio?.map((p) => `${p.title ?? ""} ${p.description ?? ""}`).join(" "),
]
  .filter(Boolean)
  .join(" ")
  .toLowerCase();

const banned = ["lorem ipsum", "as an ai", "chatgpt", "placeholder"];
for (const token of banned) {
  if (textBlob.includes(token)) {
    console.error(`Blocked filler token found: "${token}"`);
    process.exit(5);
  }
}

console.log(`Truth guard passed for client: ${client}`);
