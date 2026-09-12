import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("Agent Runtime exposes one protected proposal endpoint", async () => {
  const api = YAML.parse(
    await readFile("openapi/agent-runtime-api.yaml", "utf8"),
  );
  const create = api.paths["/api/v1/proposals"].post;

  assert.deepEqual(create.security, [{ bearerAuth: [] }]);
  assert.ok(create.responses["200"]);
  assert.ok(create.responses["401"]);
  assert.ok(create.responses["422"]);
});

test("proposal request uses simple names and does not accept identity", async () => {
  const api = YAML.parse(
    await readFile("openapi/agent-runtime-api.yaml", "utf8"),
  );
  const request = api.components.schemas.ProposalRequest;
  const context = api.components.schemas.UserContext;
  const example = await readJson("examples/agent-proposal.valid.json");
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);

  const requestForTest = structuredClone(request);
  requestForTest.properties.context = context;
  assert.equal(
    ajv.validate(requestForTest, example),
    true,
    JSON.stringify(ajv.errors),
  );
  assert.deepEqual(request.required, ["text", "context"]);
  assert.equal(request.properties.utterance, undefined);
  assert.equal(context.properties.tenant_id, undefined);
  assert.equal(context.properties.actor_id, undefined);
  assert.equal(context.additionalProperties, false);
});

test("proposal response reuses the calendar payload", async () => {
  const api = YAML.parse(
    await readFile("openapi/agent-runtime-api.yaml", "utf8"),
  );
  const calendarSchema = await readJson(
    "schemas/calendar-create-event.schema.json",
  );
  const { $schema: _draft, $id: _id, title: _title, ...shape } = calendarSchema;

  assert.deepEqual(api.components.schemas.CalendarCreateEventPayload, shape);
  assert.equal(
    api.components.schemas.ActionPlan.properties.payload.$ref,
    "#/components/schemas/CalendarCreateEventPayload",
  );
});

test("compatibility workflow checks every OpenAPI contract", async () => {
  const workflow = await readFile(".github/workflows/ci.yml", "utf8");

  assert.match(workflow, /action-api/);
  assert.match(workflow, /mcp-gateway-api/);
  assert.match(workflow, /agent-runtime-api/);
  assert.match(workflow, /git cat-file -e/);
});
