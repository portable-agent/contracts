import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";
import {
  checkBreakingPolicy,
  contractPath,
  readVersion,
} from "../scripts/check-breaking-policy.mjs";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("breaking policy reads the real OpenAPI version", async () => {
  const source = await readFile("openapi/action-api.yaml", "utf8");
  assert.equal(readVersion(source), "3.1.0");
});

test("compatibility workflow skips policy when oasdiff finds no breaking changes", async () => {
  const workflow = await readFile(".github/workflows/ci.yml", "utf8");

  assert.match(
    workflow,
    /if: steps\.base-file\.outputs\.exists == 'true' && steps\.compatibility\.outputs\.breaking != 'No breaking changes'/,
  );
});

test("compatibility workflow checks the contract from the matrix", async () => {
  const workflow = await readFile(".github/workflows/ci.yml", "utf8");

  assert.match(
    workflow,
    /check-breaking-policy\.mjs "origin\/\$\{\{ github\.base_ref \}\}" "\$\{\{ matrix\.contract \}\}"/,
  );
});

test("breaking policy accepts only a safe contract name", () => {
  assert.equal(
    contractPath("agent-runtime-api"),
    "openapi/agent-runtime-api.yaml",
  );
  assert.throws(() => contractPath("../package"), /Некорректное имя/);
});

test("breaking change needs approval, new major and migration guide", () => {
  assert.throws(
    () =>
      checkBreakingPolicy({
        baseVersion: "1.2.0",
        nextVersion: "2.0.0",
        approved: false,
        migrationExists: true,
      }),
    /breaking-change-approved/,
  );
  assert.throws(
    () =>
      checkBreakingPolicy({
        baseVersion: "1.2.0",
        nextVersion: "1.3.0",
        approved: true,
        migrationExists: true,
      }),
    /major/,
  );
  assert.doesNotThrow(() =>
    checkBreakingPolicy({
      baseVersion: "1.2.0",
      nextVersion: "2.0.0",
      approved: true,
      migrationExists: true,
    }),
  );
});

test("all contract files use the package version", async () => {
  const packageData = await readJson("package.json");
  const openApi = YAML.parse(await readFile("openapi/action-api.yaml", "utf8"));
  const gatewayApi = YAML.parse(
    await readFile("openapi/mcp-gateway-api.yaml", "utf8"),
  );
  const agentApi = YAML.parse(
    await readFile("openapi/agent-runtime-api.yaml", "utf8"),
  );
  const channelApi = YAML.parse(
    await readFile("openapi/channel-gateway-api.yaml", "utf8"),
  );
  const conversationApi = YAML.parse(
    await readFile("openapi/conversation-api.yaml", "utf8"),
  );
  const asyncApi = YAML.parse(
    await readFile("asyncapi/action-events.yaml", "utf8"),
  );

  assert.equal(openApi.info.version, packageData.version);
  assert.equal(gatewayApi.info.version, packageData.version);
  assert.equal(agentApi.info.version, packageData.version);
  assert.equal(channelApi.info.version, packageData.version);
  assert.equal(conversationApi.info.version, packageData.version);
  const connectionApi = YAML.parse(
    await readFile("openapi/connection-api.yaml", "utf8"),
  );
  assert.equal(connectionApi.info.version, packageData.version);
  assert.equal(asyncApi.info.version, packageData.version);
});

test("action response contains the stored payload", async () => {
  const source = await readFile("openapi/action-api.yaml", "utf8");
  const api = YAML.parse(source);
  const response = api.components.schemas.ActionResponse;

  assert.ok(response.required.includes("payload"));
  assert.equal(
    response.properties.payload.$ref,
    "#/components/schemas/CalendarCreateEventPayload",
  );
});

test("successful calendar action exposes a stable event id", async () => {
  const source = await readFile("openapi/action-api.yaml", "utf8");
  const api = YAML.parse(source);
  const asyncApi = YAML.parse(
    await readFile("asyncapi/action-events.yaml", "utf8"),
  );
  const response = api.components.schemas.ActionResponse;
  const result = api.components.schemas.CalendarActionResult;
  const eventResult =
    asyncApi.components.schemas.ActionEvent.properties.payload.properties
      .result;

  assert.equal(response.required.includes("result"), false);
  assert.equal(
    response.properties.result.$ref,
    "#/components/schemas/CalendarActionResult",
  );
  assert.deepEqual(result.required, ["eventId"]);
  assert.equal(result.additionalProperties, false);
  assert.equal(result.properties.eventId.type, "string");
  assert.equal(result.properties.eventId.minLength, 1);
  assert.equal(eventResult.$ref, "#/components/schemas/CalendarActionResult");
});

test("action request uses the service request key", async () => {
  const source = await readFile("openapi/action-api.yaml", "utf8");
  const api = YAML.parse(source);
  const request = api.components.schemas.ProposeActionRequest;

  assert.ok(request.required.includes("requestKey"));
  assert.equal(request.properties.requestKey.type, "string");
  assert.equal(request.properties.idempotencyKey, undefined);
  assert.deepEqual(request.properties.kind.enum, ["calendar.create_event"]);
  assert.deepEqual(request.properties.connector.enum, [
    "fake-calendar",
    "google-calendar",
  ]);
  assert.equal(
    request.properties.payload.$ref,
    "#/components/schemas/CalendarCreateEventPayload",
  );
  assert.ok(api.paths["/api/v1/actions"].post.responses["409"]);
});

test("agent can choose fake or Google calendar", async () => {
  const source = await readFile("openapi/agent-runtime-api.yaml", "utf8");
  const api = YAML.parse(source);
  const requestConnectors =
    api.components.schemas.UserContext.properties.availableConnectors.items;
  const planConnector = api.components.schemas.ActionPlan.properties.connector;

  assert.deepEqual(requestConnectors.enum, [
    "fake-calendar",
    "google-calendar",
  ]);
  assert.deepEqual(planConnector.enum, ["fake-calendar", "google-calendar"]);
});

test("action API uses the shared calendar payload shape", async () => {
  const source = await readFile("openapi/action-api.yaml", "utf8");
  const api = YAML.parse(source);
  const schema = await readJson("schemas/calendar-create-event.schema.json");
  const { $schema: _draft, $id: _id, title: _title, ...shape } = schema;

  assert.deepEqual(api.components.schemas.CalendarCreateEventPayload, shape);
  assert.equal(
    api.components.schemas.ActionResponse.properties.payload.$ref,
    "#/components/schemas/CalendarCreateEventPayload",
  );
});

test("action confirmation example matches its public schema", async () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schema = await readJson("schemas/action-confirmation.schema.json");
  const example = await readJson("examples/action-confirmation.valid.json");

  const valid = ajv.validate(schema, example);

  assert.equal(valid, true, JSON.stringify(ajv.errors));
});

test("connection widget example matches its public schema", async () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schema = await readJson("schemas/connection-widget.schema.json");
  const example = await readJson("examples/connection-widget.valid.json");

  const valid = ajv.validate(schema, example);

  assert.equal(valid, true, JSON.stringify(ajv.errors));
});

test("connection widget accepts only an HTTPS authorization URL", async () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schema = await readJson("schemas/connection-widget.schema.json");
  const example = await readJson("examples/connection-widget.valid.json");

  assert.equal(
    ajv.validate(schema, {
      ...example,
      button: { ...example.button, url: "http://example.com/oauth" },
    }),
    false,
  );
  assert.equal(
    ajv.validate(schema, { ...example, state: "must-not-leak" }),
    false,
  );
});

test("confirmation widget rejects an altered payload hash", async () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schema = await readJson("schemas/action-confirmation.schema.json");
  const example = await readJson("examples/action-confirmation.valid.json");

  const valid = ajv.validate(schema, { ...example, payloadHash: "unsafe" });

  assert.equal(valid, false);
});

test("calendar create event example matches its public schema", async () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schema = await readJson("schemas/calendar-create-event.schema.json");
  const example = await readJson("examples/calendar-create-event.valid.json");

  const valid = ajv.validate(schema, example);

  assert.equal(valid, true, JSON.stringify(ajv.errors));
  assert.ok(Date.parse(example.endAt) > Date.parse(example.startAt));
});

test("calendar create event rejects missing time zone", async () => {
  const ajv = new Ajv2020({ allErrors: true });
  addFormats(ajv);
  const schema = await readJson("schemas/calendar-create-event.schema.json");
  const example = await readJson("examples/calendar-create-event.valid.json");
  const { timeZone: _timeZone, ...withoutTimeZone } = example;

  const valid = ajv.validate(schema, withoutTimeZone);

  assert.equal(valid, false);
});
