import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

export const readVersion = (source) => {
  const lines = source.split(/\r?\n/);
  const infoStart = lines.findIndex((line) => line === "info:");
  if (infoStart < 0) {
    throw new Error("Не найден раздел info в OpenAPI.");
  }

  for (const line of lines.slice(infoStart + 1)) {
    if (line && !line.startsWith(" ")) {
      break;
    }
    const version = line.match(/^  version:\s*["']?([^\s"']+)["']?\s*$/)?.[1];
    if (version && /^\d+\.\d+\.\d+$/.test(version)) {
      return version;
    }
  }
  throw new Error("Не найдена SemVer-версия OpenAPI.");
};

export const checkBreakingPolicy = ({
  baseVersion,
  nextVersion,
  approved,
  migrationExists,
}) => {
  const baseMajor = Number(baseVersion.split(".")[0]);
  const nextMajor = Number(nextVersion.split(".")[0]);

  if (!approved) {
    throw new Error(
      "Для breaking change нужна метка breaking-change-approved.",
    );
  }
  if (nextMajor <= baseMajor) {
    throw new Error("Для breaking change нужно увеличить major-версию.");
  }
  if (!migrationExists) {
    throw new Error(`Добавьте docs/migrations/${nextVersion}.md.`);
  }
};

export const run = (baseRef, approved) => {
  const base = spawnSync(
    "git",
    ["show", `${baseRef}:openapi/action-api.yaml`],
    {
      encoding: "utf8",
    },
  );
  if (base.status !== 0) {
    throw new Error(base.stderr || "Не удалось прочитать базовый OpenAPI.");
  }

  const baseVersion = readVersion(base.stdout);
  const nextVersion = readVersion(
    readFileSync("openapi/action-api.yaml", "utf8"),
  );
  checkBreakingPolicy({
    baseVersion,
    nextVersion,
    approved,
    migrationExists: existsSync(`docs/migrations/${nextVersion}.md`),
  });
};

if (process.argv[1]?.endsWith("check-breaking-policy.mjs")) {
  run(process.argv[2], process.env.BREAKING_APPROVED === "true");
}
