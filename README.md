# PKI Simulator

Интерактивный симулятор **Инфраструктуры открытых ключей (PKI)**.

## Описание

Веб-приложение для изучения принципов работы PKI:
- **Регистрация пользователей** (Registration Authority)
- **Генерация RSA-ключей** (Web Crypto API, 2048 бит)
- **Создание сертификатов** (Certificate Authority)
- **Электронная подпись** (RSASSA-PKCS1-v1_5)
- **Проверка подписи**
- **Отзыв сертификатов** (CRL)
- **Проверка статуса сертификата**

## Технологии

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js Serverless Functions (Vercel)
- **Криптография:** Web Crypto API (RSA)

## Структура

```
/public        — Фронтенд (HTML, CSS, JS)
/api           — Serverless API endpoints
/data          — Файлы данных (для локальной разработки)
```

## Запуск локально

```bash
npm install
npx vercel dev
```

## Деплой на Vercel

```bash
npx vercel
```

## API Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST  | /api/register | Регистрация пользователя |
| GET   | /api/register | Список пользователей |
| POST  | /api/createCertificate | Создание сертификата |
| GET   | /api/createCertificate | Список сертификатов |
| POST  | /api/revoke | Отзыв сертификата |
| POST  | /api/checkCertificate | Проверка сертификата |
