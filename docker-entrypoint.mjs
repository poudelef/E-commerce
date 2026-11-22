import { execSync, spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

async function waitForDatabase() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
      return;
    } catch {
      console.log(`Waiting for MySQL (${attempt}/30)...`);
      await delay(2000);
    }
  }
  console.error("MySQL did not become ready.");
  process.exit(1);
}

await waitForDatabase();
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

const server = spawn("npx", ["next", "start", "-H", "0.0.0.0", "-p", "3000"], { stdio: "inherit" });
server.on("exit", (code) => process.exit(code ?? 0));
