# Контракты Portable Agent

Здесь лежат общие форматы, по которым сервисы Portable Agent общаются друг с другом.

Репозиторий отвечает только за описания API, событий и общих JSON-форматов. Здесь нет кода сервисов и
правил бизнеса.

## Состав

- `openapi/` — HTTP API.
- `asyncapi/` — события.
- `schemas/` — JSON-форматы.
- `examples/` — примеры, которые проверяются в CI.
- `docs/` — устройство репозитория и правила работы.

## Локальная проверка

```bash
corepack enable
pnpm install
pnpm lint
pnpm test
pnpm build
```

Breaking changes публикуются только новой major-версией контракта, сопровождаются migration guide и
меткой `breaking-change-approved`, которую ставит maintainer. `oasdiff` автоматически сравнивает
OpenAPI в pull request с `main` и блокирует нарушение этих правил.

## Версии и release

Текущая версия — `2.1.0`. Переход с `1.x` описан в
[migration guide](docs/migrations/2.0.0.md).

Версия в `package.json`, OpenAPI и AsyncAPI должна совпадать. Тег `vX.Y.Z` запускает release workflow.
Он проверяет репозиторий и прикладывает к GitHub Release bundle `portable-agent-contracts-X.Y.Z.tgz`.
Bundle получает SHA-256 и GitHub artifact attestation. Сервисы используют закреплённую версию bundle
и не загружают `main` во время сборки.

## Документация

- [Архитектура](docs/architecture.md)
- [Контракт создания встречи](docs/calendar-event.md)
- [Контракт MCP Gateway](docs/mcp-gateway.md)
- [Контракт Agent Runtime](docs/agent-runtime.md)
- [Разработка](docs/development.md)
- [Диагностика](docs/runbook.md)
- [Правила для AI-агентов](AGENTS.md)

## Лицензия

Apache License 2.0.
