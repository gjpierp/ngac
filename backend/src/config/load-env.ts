import fs from "fs";
import path from "path";
import dotenv from "dotenv";

let envLoaded = false;

export function loadEnv() {
  if (envLoaded) {
    return;
  }

  dotenv.config();

  if (process.env.NODE_ENV !== "production") {
    const localEnvPath = path.resolve(process.cwd(), ".env.local");

    if (fs.existsSync(localEnvPath)) {
      dotenv.config({ path: localEnvPath, override: true });
    }
  }

  envLoaded = true;
}
