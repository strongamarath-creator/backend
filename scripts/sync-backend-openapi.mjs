import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");

function parseArgs(argv) {
  const out = { target: "all" };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target") {
      out.target = argv[i + 1] ?? "all";
      i += 1;
    }
  }
  return out;
}

const args = parseArgs(process.argv);
const openApiUrl =
  process.env.OPENAPI_URL ?? "http://localhost:3001/api/docs-json";

const outputsByTarget = {
  client: path.join(ROOT_DIR, "client", "src", "lib", "backend", "openapi.ts"),
  admin: path.join(ROOT_DIR, "admin", "src", "lib", "backend", "openapi.ts"),
  mobile: path.join(ROOT_DIR, "mobile", "src", "lib", "backend", "openapi.ts"),
};

const targets =
  args.target === "all"
    ? /** @type {Array<keyof typeof outputsByTarget>} */ (
        Object.keys(outputsByTarget)
      )
    : [args.target];

async function waitForOpenApi(url, maxSeconds = 60) {
  const startedAt = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore
    }

    if (Date.now() - startedAt > maxSeconds * 1000) {
      throw new Error(
        `OpenAPI endpoint not ready after ${maxSeconds}s: ${url}`,
      );
    }

    await delay(1000);
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function generateTypes(url, outputFile) {
  ensureDir(outputFile);

  const result = spawnSync(
    "npx",
    ["--yes", "openapi-typescript@7.10.1", url, "-o", outputFile],
    {
      stdio: "inherit",
      cwd: ROOT_DIR,
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `openapi-typescript failed for ${outputFile} (exit ${result.status})`,
    );
  }
}

function startBackend() {
  // We spawn backend as its own process group, so we can kill it reliably.
  const child = spawn("npm", ["run", "start:dev"], {
    cwd: BACKEND_DIR,
    stdio: "inherit",
    detached: true,
  });

  if (!child.pid) {
    throw new Error("Failed to start backend process");
  }

  return child;
}

function stopBackend(child) {
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    // ignore
  }
}

async function main() {
  console.log(`[sync-openapi] targets: ${targets.join(", ")}`);
  console.log(`[sync-openapi] url: ${openApiUrl}`);

  const backend = startBackend();

  try {
    await waitForOpenApi(openApiUrl, 90);

    for (const target of targets) {
      const outFile = outputsByTarget[target];
      console.log(`[sync-openapi] generating: ${target} -> ${outFile}`);
      generateTypes(openApiUrl, outFile);
    }
  } finally {
    stopBackend(backend);
  }
}

await main();
