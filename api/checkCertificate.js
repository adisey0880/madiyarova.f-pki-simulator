/**
 * API: /api/checkCertificate
 * 
 * POST — Проверка статуса сертификата
 * 
 * Проверяет:
 * 1. Существует ли сертификат
 * 2. Не истёк ли срок действия
 * 3. Не отозван ли сертификат (CRL)
 */

const { readData } = require('./_storage');

module.exports = async function handler(req, res) {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST — проверка сертификата
  if (req.method === 'POST') {
    const { certificateId } = req.body || {};

    // Валидация
    if (!certificateId) {
      console.log('[Check] Ошибка: не указан certificateId');
      return res.status(400).json({ success: false, error: 'certificateId обязателен' });
    }

    // Ищем сертификат
    const certificates = readData('certificates');
    const cert = certificates.find(c => c.id === certificateId);

    if (!cert) {
      console.log(`[Check] Сертификат ${certificateId} не найден`);
      return res.status(404).json({ success: false, error: 'Сертификат не найден' });
    }

    // Проверяем срок действия
    const now = new Date();
    const expiresAt = new Date(cert.expiresAt);
    const isExpired = expiresAt < now;

    // Проверяем отзыв (CRL)
    const revoked = readData('revoked');
    const isRevoked = revoked.some(r => r.certificateId === certificateId);

    // Определяем статус
    let status = 'valid';
    if (isRevoked) {
      status = 'revoked';
    } else if (isExpired) {
      status = 'expired';
    }

    console.log(`[Check] Сертификат ${certificateId}: статус = ${status}`);

    return res.status(200).json({
      success: true,
      status: status,
      certificate: {
        id: cert.id,
        name: cert.name,
        email: cert.email,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        issuer: cert.issuer,
        isExpired,
        isRevoked
      }
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
