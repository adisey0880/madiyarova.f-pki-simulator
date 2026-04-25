/**
 * API: /api/revoke
 * 
 * POST — Отзыв сертификата (Certificate Revocation List - CRL)
 * GET  — Получение списка отозванных сертификатов
 * 
 * При отзыве сертификат добавляется в CRL (revoked list).
 */

const { readData, writeData } = require('./_storage');

module.exports = async function handler(req, res) {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET — список отозванных сертификатов
  if (req.method === 'GET') {
    console.log('[CRL] GET /api/revoke — Получение CRL');
    const revoked = readData('revoked');
    return res.status(200).json({ success: true, revoked });
  }

  // POST — отзыв сертификата
  if (req.method === 'POST') {
    const { certificateId } = req.body || {};

    // Валидация
    if (!certificateId) {
      console.log('[CRL] Ошибка: не указан certificateId');
      return res.status(400).json({ success: false, error: 'certificateId обязателен' });
    }

    // Проверяем, существует ли сертификат
    const certificates = readData('certificates');
    const cert = certificates.find(c => c.id === certificateId);

    if (!cert) {
      console.log(`[CRL] Ошибка: сертификат ${certificateId} не найден`);
      return res.status(404).json({ success: false, error: 'Сертификат не найден' });
    }

    // Проверяем, не отозван ли уже
    const revoked = readData('revoked');
    const alreadyRevoked = revoked.find(r => r.certificateId === certificateId);

    if (alreadyRevoked) {
      console.log(`[CRL] Сертификат ${certificateId} уже отозван`);
      return res.status(400).json({ success: false, error: 'Сертификат уже отозван' });
    }

    // Добавляем в CRL
    const revocationEntry = {
      certificateId: certificateId,
      revokedAt: new Date().toISOString(),
      reason: 'Отозван пользователем'
    };

    revoked.push(revocationEntry);
    writeData('revoked', revoked);

    console.log(`[CRL] 🚫 Сертификат отозван: ${certificateId}`);
    return res.status(200).json({ success: true, revocation: revocationEntry });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
