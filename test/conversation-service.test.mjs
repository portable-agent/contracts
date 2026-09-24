import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import YAML from "yaml";

const readApi = async () =>
  YAML.parse(await readFile("openapi/conversation-api.yaml", "utf8"));

test("Conversation Service exposes a protected message endpoint", async () => {
  const api = await readApi();
  const create = api.paths["/api/v1/messages"].post;

  assert.deepEqual(create.security, [{ bearerAuth: [] }]);
  assert.ok(create.responses["200"]);
  assert.ok(create.responses["401"]);
  assert.ok(create.responses["422"]);
  assert.ok(create.responses["502"]);
});

test("message request can continue an existing conversation", async () => {
  const api = await readApi();
  const request =
    api.paths["/api/v1/messages"].post.requestBody.content["application/json"]
      .schema;

  assert.equal(request.$ref, "#/components/schemas/MessageRequest");
  const message = api.components.schemas.MessageRequest;

  assert.deepEqual(message.required, ["requestKey", "text", "context"]);
  assert.equal(message.properties.conversationId.format, "uuid");
  assert.equal(
    message.properties.context.$ref,
    "#/components/schemas/MessageContext",
  );
  assert.equal(message.properties.userId, undefined);
  assert.equal(message.properties.tenantId, undefined);
  assert.equal(message.additionalProperties, false);
  assert.equal(
    api.components.schemas.MessageContext.$ref,
    "../schemas/message-context.schema.json",
  );
});

test("message response has ids and one typed reply", async () => {
  const api = await readApi();
  const response = api.components.schemas.MessageResponse;
  const reply = response.properties.reply;

  assert.deepEqual(response.required, ["messageId", "conversationId", "reply"]);
  assert.equal(response.additionalProperties, false);
  assert.deepEqual(reply.oneOf, [
    { $ref: "#/components/schemas/TextReply" },
    { $ref: "#/components/schemas/ConfirmationReply" },
  ]);
  assert.equal(reply.discriminator.propertyName, "type");
});

test("confirmation reply reuses the public widget schema", async () => {
  const api = await readApi();
  const reply = api.components.schemas.ConfirmationReply;

  assert.deepEqual(reply.required, ["type", "card"]);
  assert.equal(reply.properties.type.const, "confirmation");
  assert.equal(
    reply.properties.card.$ref,
    "../schemas/action-confirmation.schema.json",
  );
});

test("text reply contains no action state", async () => {
  const api = await readApi();
  const reply = api.components.schemas.TextReply;

  assert.deepEqual(reply.required, ["type", "text"]);
  assert.equal(reply.properties.type.const, "text");
  assert.equal(reply.properties.actionId, undefined);
  assert.equal(reply.additionalProperties, false);
});
