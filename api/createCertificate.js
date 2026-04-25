/**
 * API: /api/createCertificate
 * 
 * POST — Создание нового сертификата (Certificate Authority)
 * GET  — Получение списка всех сертификатов
 * 
 * Сертификат содержит:
 * - id
 * - имя и email владельца
 * - открытый ключ (public key)
 * - дата выпуска и срок действия
 * - подпись CA (имитация)
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

  // GET — список сертификатов
  if (req.method === 'GET') {
    console.log('[CA] GET /api/createCertificate — Получение сертификатов');
    const certificates = readData('certificates');
    const revoked = readData('revoked');
    
    // Добавляем информацию об отзыве к каждому сертификату
    const enriched = certificates.map(cert => ({
      ...cert,
      revoked: revoked.some(r => r.certificateId === cert.id)
    }));
    
    return res.status(200).json({ success: true, certificates: enriched });
  }

  // POST — создание сертификата
  if (req.method === 'POST') {
    const { userId, publicKey, validityDays = 365 } = req.body || {};

    // Валидация
    if (!userId || !publicKey) {
      console.log('[CA] Ошибка: не указан userId или publicKey');
      return res.status(400).json({ success: false, error: 'userId и publicKey обязательны' });
    }

    // Находим пользователя
    const users = readData('users');
    const user = users.find(u => u.id === userId);

    if (!user) {
      console.log(`[CA] Ошибка: пользователь ${userId} не найден`);
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }

    // Даты
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + validityDays * 24 * 60 * 60 * 1000);

    // Генерируем «подпись CA» (имитация — хеш данных сертификата)
    const certData = `${user.name}|${user.email}|${publicKey}|${issuedAt.toISOString()}|${expiresAt.toISOString()}`;
    const caSignature = crypto.createHash('sha256').update(certData).digest('hex');

    // Создаём сертификат
    const certificate = {
      id: crypto.randomUUID(),
      userId: user.id,
      name: user.name,
      email: user.email,
      publicKey: publicKey,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      validityDays: validityDays,
      caSignature: caSignature,
      issuer: 'PKI Simulator CA'
    };

    const certificates = readData('certificates');
    certificates.push(certificate);
    writeData('certificates', certificates);

    console.log(`[CA] ✅ Сертификат выпущен: ${certificate.id} для ${user.name}`);
    return res.status(201).json({ success: true, certificate });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
