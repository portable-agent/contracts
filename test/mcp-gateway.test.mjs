import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("MCP Gateway exposes one protected call endpoint", async () => {
  const api = YAML.parse(
    await readFile("openapi/mcp-gateway-api.yaml", "utf8"),
  );
  const call = api.paths["/api/v1/calls"].post;

  assert.deepEqual(call.security, [{ bearerAuth: [] }]);
  assert.ok(call.responses["200"]);
  assert.ok(call.responses["400"]);
  assert.ok(call.responses["401"]);
  assert.ok(call.responses["403"]);
  assert.ok(call.responses["502"]);
});

test("MCP call example matches the request schema", async () => {
  const api = YAML.parse(
    await readFile("openapi/mcp-gateway-api.yaml", "utf8"),
  );
  const example = await readJson("examples/mcp-call.valid.json");
  const schema = api.components.schemas.McpCallRequest;
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);

  assert.equal(ajv.validate(schema, example), true, JSON.stringify(ajv.errors));
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes("requestKey"));
  assert.equal(schema.properties.url, undefined);
});

test("all MCP route values are names instead of network addresses", async () => {
  const example = await readJson("examples/mcp-call.valid.json");

  assert.equal(example.connector, "fake-calendar");
  assert.equal(example.tool, "create_event");
  assert.equal("url" in example, false);
});
