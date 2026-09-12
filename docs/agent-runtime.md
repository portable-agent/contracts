# Agent Runtime API

`POST /api/v1/proposals` принимает текст и безопасный контекст канала. Сервис возвращает либо готовое
предложение календарного действия, либо вопрос для уточнения.

Идентификаторы tenant и пользователя не передаются в JSON. Agent Runtime получает их только из
проверенного JWT с audience `agent-runtime`. Это не позволяет каналу подменить пользователя обычным
полем запроса.

Поля запроса названы просто: `text`, `timeZone`, `locale` и `availableConnectors`. Payload готового
предложения использует тот же `CalendarCreateEventPayload`, что Action API.

Agent Runtime ничего не исполняет и не сохраняет. После показа пользователю Channel Gateway передаёт
подтверждённое предложение в Action Service.
