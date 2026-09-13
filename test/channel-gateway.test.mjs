import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import YAML from "yaml";

const readApi = async () =>
  YAML.parse(await readFile("openapi/channel-gateway-api.yaml", "utf8"));

test("Channel Gateway exposes one protected message endpoint", async () => {
  const api = await readApi();
  const create = api.paths["/api/v1/messages"].post;

  assert.deepEqual(create.security, [{ bearerAuth: [] }]);
  assert.ok(create.responses["200"]);
  assert.ok(create.responses["401"]);
  assert.ok(create.responses["422"]);
  assert.ok(create.responses["502"]);
});

test("message request is channel-neutral and contains no identity", async () => {
  const api = await readApi();
  const request = api.components.schemas.MessageRequest;
  const context = api.components.schemas.MessageContext;
  const example = JSON.parse(
    await readFile("examples/channel-message.valid.json", "utf8"),
  );
  const schema = structuredClone(request);
  schema.properties.context = context;
  const ajv = new Ajv2020({ allErrors: true });

  assert.equal(ajv.validate(schema, example), true, JSON.stringify(ajv.errors));
  assert.deepEqual(request.required, ["requestKey", "text", "context"]);
  assert.equal(request.properties.channel, undefined);
  assert.equal(request.properties.userId, undefined);
  assert.equal(request.properties.tenantId, undefined);
  assert.equal(context.properties.availableConnectors, undefined);
  assert.equal(request.additionalProperties, false);
  assert.equal(context.additionalProperties, false);
});

test("message response reuses Agent Runtime proposal response", async () => {
  const api = await readApi();
  const response =
    api.paths["/api/v1/messages"].post.responses["200"].content[
      "application/json"
    ].schema;

  assert.equal(
    response.$ref,
    "./agent-runtime-api.yaml#/components/schemas/ProposalResponse",
  );
});

test("compatibility workflow checks Channel Gateway contract", async () => {
  const workflow = await readFile(".github/workflows/ci.yml", "utf8");

  assert.match(workflow, /channel-gateway-api/);
});
