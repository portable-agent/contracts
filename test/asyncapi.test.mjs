import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Parser } from "@asyncapi/parser";

test("action events is a valid AsyncAPI document", async () => {
  const source = await readFile("asyncapi/action-events.yaml", "utf8");
  const parser = new Parser();

  const { document, diagnostics } = await parser.parse(source);

  assert.ok(document, JSON.stringify(diagnostics, null, 2));
  assert.equal(
    diagnostics.filter(({ severity }) => severity === 0).length,
    0,
    JSON.stringify(diagnostics, null, 2),
  );
});
