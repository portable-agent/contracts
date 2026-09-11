# MCP Gateway API

`POST /api/v1/calls` — внутренний API между durable workflow и MCP Gateway. Он не предназначен для
прямого вызова из Telegram, Web или Widget SDK.

## Безопасная граница

- клиент передаёт имя `connector`, но не URL;
- gateway разрешает только tools из своей конфигурации;
- identity приходит из проверенного Bearer token, а не из `input`;
- `requestKey` передаётся конечному MCP-сервису для защиты от дублей;
- gateway не делает автоматический retry изменяющего tool.

Первый маршрут — `fake-calendar` и tool `create_event`. Это значение не закреплено enum в общем
контракте: новый MCP-сервис подключается конфигурацией без выпуска новой версии API. Конкретные
разрешения остаются в policy и конфигурации окружения.

## Результат

Если MCP tool возвращает structured content, gateway помещает объект в `data`. Обычные MCP content
blocks доступны в `content`. Ответ провайдера и детали токена не должны попадать в публичную ошибку.
