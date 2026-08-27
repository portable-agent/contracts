# Portable Agent Contracts

Версионируемые публичные контракты платформы Portable Agent. Репозиторий является источником истины
для HTTP API, событий и переносимых UI-виджетов; реализации сервисов не делят общую доменную библиотеку.

## Состав

- `openapi/` — синхронные HTTP API.
- `asyncapi/` — Kafka topics и события.
- `schemas/` — JSON Schema для event envelope и виджетов.
- `examples/` — примеры, которые проверяются в CI.

## Локальная проверка

```bash
corepack enable
pnpm install
pnpm lint
pnpm test
pnpm build
```

Breaking changes публикуются только новой major-версией контракта и сопровождаются migration guide.

## Лицензия

Apache License 2.0.
