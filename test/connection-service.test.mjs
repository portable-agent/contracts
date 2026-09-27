import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";

const readApi = async () =>
  YAML.parse(await readFile("openapi/connection-api.yaml", "utf8"));

test("public connection requests cannot choose an owner or redirect URL", async () => {
  const api = await readApi();
  const ajv = new Ajv2020();
  addFormats(ajv);
  const validate = ajv.compile(api.components.schemas.StartRequest);
  assert.equal(validate({ provider: "google-calendar" }), true);
  for (const field of [
    "actorId",
    "tenantId",
    "redirectUri",
    "scope",
    "clientSecret",
  ]) {
    assert.equal(
      validate({ provider: "google-calendar", [field]: "untrusted" }),
      false,
    );
  }
});

test("public connection response contains metadata only", async () => {
  const api = await readApi();
  const ajv = new Ajv2020();
  addFormats(ajv);
  const validate = ajv.compile(api.components.schemas.Connection);
  const example = JSON.parse(
    await readFile("examples/connection.valid.json", "utf8"),
  );
  assert.equal(validate(example), true, JSON.stringify(validate.errors));
  for (const field of ["accessToken", "refreshToken", "clientSecret"]) {
    assert.equal(validate({ ...example, [field]: "secret" }), false);
  }
});

test("callback is state protected and token exchange requires service auth", async () => {
  const api = await readApi();
  const callback = api.paths["/api/v1/connections/callback"].get;
  assert.deepEqual(callback.security, []);
  assert.ok(callback.parameters.some((p) => p.name === "state" && p.required));
  const token = api.paths["/internal/v1/tokens"].post;
  assert.deepEqual(token.security, [{ serviceAuth: [] }]);
  assert.ok(token.responses["403"]);
  assert.ok(token.responses["409"]);
  assert.ok(token.responses["200"].headers["Cache-Control"]);
  assert.equal(
    api.components.schemas.TokenResponse.properties.refreshToken,
    undefined,
  );
});
