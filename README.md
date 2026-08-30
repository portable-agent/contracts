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

Breaking changes публикуются только новой major-версией контракта и сопровождаются migration guide.

## Документация

- [Архитектура](docs/architecture.md)
- [Контракт создания встречи](docs/calendar-event.md)
- [Разработка](docs/development.md)
- [Диагностика](docs/runbook.md)
- [Правила для AI-агентов](AGENTS.md)

## Лицензия

Apache License 2.0.
