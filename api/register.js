/**
 * API: /api/register
 * 
 * POST — Регистрация нового пользователя (Registration Authority)
 * GET  — Получение списка всех пользователей
 * 
 * На Vercel данные хранятся в памяти (in-memory),
 * так как файловая система serverless функций read-only.
 * Для production используйте базу данных.
 */

const { readData, writeData } = require('./_storage');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET — список пользователей
  if (req.method === 'GET') {
    console.log('[RA] GET /api/register — Получение списка пользователей');
    const users = readData('users');
    return res.status(200).json({ success: true, users });
  }

  // POST — регистрация пользователя
  if (req.method === 'POST') {
    const { name, email } = req.body || {};

    // Валидация
    if (!name || !email) {
      console.log('[RA] Ошибка: пустые поля');
      return res.status(400).json({ success: false, error: 'Имя и email обязательны' });
    }

    const users = readData('users');

    // Проверка уникальности email
    const exists = users.find(u => u.email === email);
    if (exists) {
      console.log(`[RA] Ошибка: email ${email} уже зарегистрирован`);
      return res.status(400).json({ success: false, error: 'Пользователь с таким email уже существует' });
    }

    // Создаём нового пользователя
    const user = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      registeredAt: new Date().toISOString()
    };

    users.push(user);
    writeData('users', users);

    console.log(`[RA] ✅ Пользователь зарегистрирован: ${user.name} (${user.email})`);
    return res.status(201).json({ success: true, user });
  }

  // Метод не поддерживается
  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
