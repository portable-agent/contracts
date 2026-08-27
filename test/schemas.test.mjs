import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("action confirmation example matches its public schema", async () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schema = await readJson("schemas/action-confirmation.schema.json");
  const example = await readJson("examples/action-confirmation.valid.json");

  const valid = ajv.validate(schema, example);

  assert.equal(valid, true, JSON.stringify(ajv.errors));
});

test("confirmation widget rejects an altered payload hash", async () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schema = await readJson("schemas/action-confirmation.schema.json");
  const example = await readJson("examples/action-confirmation.valid.json");

  const valid = ajv.validate(schema, { ...example, payloadHash: "unsafe" });

  assert.equal(valid, false);
});
