import fs from "fs-extra";
import path from "path";

import { introspect } from ".";
import { option } from "./option";

async function run(): Promise<void> {
  const dbSchema = await introspect(option);
  await fs.writeJson(path.resolve(process.cwd(), "schema.json"), dbSchema, {
    spaces: 2,
  });
}

run();
