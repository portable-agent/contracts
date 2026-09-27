# Внешние подключения

Контракт `openapi/connection-api.yaml` добавлен в bundle 2.7.0 без изменения существующих запросов.
Это описание будущего API: текущий каркас Connection Service ещё не реализует эти endpoints.

| Метод и путь                              | Вход                             | Результат                       |
| ----------------------------------------- | -------------------------------- | ------------------------------- |
| POST /api/v1/connections/start            | provider и пользовательский JWT  | URL авторизации и срок ссылки   |
| GET /api/v1/connections/callback          | state и ровно один из code/error | Статическая страница результата |
| GET /api/v1/connections                   | Пользовательский JWT             | Метаданные своих подключений    |
| DELETE /api/v1/connections/{connectionId} | ID и пользовательский JWT        | Отключение своего аккаунта      |
| POST /internal/v1/tokens                  | actorId, provider и service JWT  | Временный access token          |

## Владение и секреты

Публичный API берёт tenant и actor из проверенного JWT. Клиент не задаёт владельца, scope или
redirect URI. Callback не требует пользовательского JWT: владельца определяет сохранённый
одноразовый state, связанный с PKCE. Проверка code XOR error и атомарность state — требования
реализации, которые нельзя выразить только схемой query parameters OpenAPI.

Внутренний API требует audience `connection-service`, scope `connection:token` и разрешённую
сервисную identity. Tenant берётся из JWT; actor передаётся из доверенного контекста действия.
Refresh token не возвращается ни одним endpoint. Ответ с access token и ссылка авторизации имеют
`Cache-Control: no-store`. Query callback и тела ответов с секретами не логируются.

Если подключения нет или нужна повторная авторизация, token endpoint возвращает 409 с problem type
`https://portable-agent.dev/problems/connection_required`. Если подходят несколько аккаунтов —
`https://portable-agent.dev/problems/connection_ambiguous`. Сервис не выбирает аккаунт скрытно.

Первый provider — `google-calendar`. Новые провайдеры добавляются отдельными контрактными изменениями
и адаптерами; произвольные URL и scopes в запросах не поддерживаются.

## Следующие шаги

1. Сгенерировать Java DTO и интерфейсы из опубликованного bundle.
2. Реализовать state/PKCE и зашифрованное хранилище с PostgreSQL-тестами.
3. Проверить callback, refresh и отключение на OAuth stub.
4. Подключить Calendar MCP и сквозной тест, затем реальный Google sandbox.
