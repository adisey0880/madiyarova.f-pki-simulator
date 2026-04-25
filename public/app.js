/**
 * PKI Simulator — Frontend Application
 * 
 * Основной JavaScript файл приложения.
 * Использует Web Crypto API для генерации RSA-ключей,
 * создания и проверки цифровых подписей.
 */

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let currentPublicKey = null;   // Текущий открытый ключ (CryptoKey)
let currentPrivateKey = null;  // Текущий закрытый ключ (CryptoKey)
let currentPublicKeyPEM = '';  // PEM-представление открытого ключа
let currentPrivateKeyPEM = ''; // PEM-представление закрытого ключа

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 PKI Simulator — Инициализация');
  initTabs();
  initForms();
  loadUsers();
  loadCertificates();
});

// ===== НАВИГАЦИЯ (TABS) =====

/**
 * Инициализация навигации по вкладкам
 */
function initTabs() {
  const tabs = document.querySelectorAll('.tabs__btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Убираем активный класс со всех вкладок
      tabs.forEach(t => t.classList.remove('tabs__btn--active'));
      // Скрываем все секции
      document.querySelectorAll('.section').forEach(s => s.classList.remove('section--active'));
      // Активируем выбранную вкладку и секцию
      tab.classList.add('tabs__btn--active');
      const sectionId = tab.dataset.section;
      document.getElementById(sectionId).classList.add('section--active');
      console.log(`📌 Переключение на секцию: ${sectionId}`);
    });
  });
}

// ===== ФОРМЫ =====

/**
 * Инициализация обработчиков форм
 */
function initForms() {
  // Форма регистрации
  document.getElementById('form-register').addEventListener('submit', handleRegister);
  
  // Генерация ключей
  document.getElementById('btn-generate-keys').addEventListener('click', handleGenerateKeys);
  
  // Создание сертификата
  document.getElementById('form-certificate').addEventListener('submit', handleCreateCertificate);
  
  // Вставка публичного ключа в форму сертификата
  document.getElementById('btn-paste-pubkey').addEventListener('click', () => {
    if (currentPublicKeyPEM) {
      document.getElementById('cert-pubkey').value = currentPublicKeyPEM;
      showToast('Открытый ключ вставлен', 'success');
    } else {
      showToast('Сначала сгенерируйте ключи', 'error');
    }
  });
  
  // Вставка приватного ключа в форму подписи
  document.getElementById('btn-paste-privkey').addEventListener('click', () => {
    if (currentPrivateKeyPEM) {
      document.getElementById('sign-privkey').value = currentPrivateKeyPEM;
      showToast('Закрытый ключ вставлен', 'success');
    } else {
      showToast('Сначала сгенерируйте ключи', 'error');
    }
  });
  
  // Вставка публичного ключа в форму проверки
  document.getElementById('btn-paste-pubkey-verify').addEventListener('click', () => {
    if (currentPublicKeyPEM) {
      document.getElementById('verify-pubkey').value = currentPublicKeyPEM;
      showToast('Открытый ключ вставлен', 'success');
    } else {
      showToast('Сначала сгенерируйте ключи', 'error');
    }
  });
  
  // Подпись сообщения
  document.getElementById('form-sign').addEventListener('submit', handleSign);
  
  // Проверка подписи
  document.getElementById('form-verify').addEventListener('submit', handleVerify);
  
  // Загрузка сертификатов
  document.getElementById('btn-load-certs').addEventListener('click', loadCertificates);
  
  // Проверка сертификата
  document.getElementById('form-check-cert').addEventListener('submit', handleCheckCertificate);
}

// ===== 1. РЕГИСТРАЦИЯ (RA) =====

/**
 * Обработчик регистрации пользователя
 */
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  
  if (!name || !email) {
    showResult('result-register', 'Заполните все поля', 'error');
    return;
  }
  
  console.log(`📝 Регистрация пользователя: ${name} (${email})`);
  
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Пользователь зарегистрирован:', data.user);
      showResult('result-register', `✅ Пользователь "${data.user.name}" успешно зарегистрирован!<br>ID: <code>${data.user.id}</code>`, 'success');
      showToast('Пользователь зарегистрирован!', 'success');
      document.getElementById('form-register').reset();
      loadUsers(); // Обновляем список пользователей
    } else {
      showResult('result-register', `❌ Ошибка: ${data.error}`, 'error');
    }
  } catch (err) {
    console.error('❌ Ошибка регистрации:', err);
    showResult('result-register', `❌ Ошибка сети: ${err.message}`, 'error');
  }
}

/**
 * Загрузка списка пользователей
 */
async function loadUsers() {
  console.log('📋 Загрузка списка пользователей...');
  try {
    const response = await fetch('/api/register');
    const data = await response.json();
    
    const container = document.getElementById('users-list');
    const select = document.getElementById('cert-user');
    
    if (data.users && data.users.length > 0) {
      // Отображаем пользователей в списке
      container.innerHTML = data.users.map(user => `
        <div class="user-card">
          <div class="user-card__info">
            <span class="user-card__name">👤 ${escapeHtml(user.name)}</span>
            <span class="user-card__email">${escapeHtml(user.email)}</span>
            <span class="user-card__id">ID: ${user.id}</span>
          </div>
        </div>
      `).join('');
      
      // Обновляем выпадающий список для сертификатов
      select.innerHTML = '<option value="">— Выберите пользователя —</option>' +
        data.users.map(user => `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.email)})</option>`).join('');
      
      console.log(`✅ Загружено пользователей: ${data.users.length}`);
    } else {
      container.innerHTML = '<p class="list-empty">Нет зарегистрированных пользователей</p>';
      select.innerHTML = '<option value="">— Нет пользователей —</option>';
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки пользователей:', err);
  }
}

// ===== 2. ГЕНЕРАЦИЯ КЛЮЧЕЙ (Web Crypto API) =====

/**
 * Генерация RSA-ключей
 * Алгоритм: RSASSA-PKCS1-v1_5, 2048 бит, SHA-256
 */
async function handleGenerateKeys() {
  console.log('🔑 Генерация RSA-ключей (2048 бит)...');
  showResult('result-keys', '⏳ Генерация ключей...', 'info');
  document.getElementById('result-keys').style.display = 'block';
  
  try {
    // Генерируем пару ключей RSA через Web Crypto API
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256'
      },
      true,       // extractable — можно экспортировать
      ['sign', 'verify']  // использование: подпись и проверка
    );
    
    // Сохраняем ключи
    currentPublicKey = keyPair.publicKey;
    currentPrivateKey = keyPair.privateKey;
    
    // Экспортируем в PEM-формат
    currentPublicKeyPEM = await exportKeyToPEM(keyPair.publicKey, 'public');
    currentPrivateKeyPEM = await exportKeyToPEM(keyPair.privateKey, 'private');
    
    // Отображаем ключи
    document.getElementById('public-key-display').value = currentPublicKeyPEM;
    document.getElementById('private-key-display').value = currentPrivateKeyPEM;
    document.getElementById('keys-display').style.display = 'block';
    
    showResult('result-keys', '✅ RSA-ключи (2048 бит) успешно сгенерированы!', 'success');
    showToast('Ключи RSA сгенерированы!', 'success');
    console.log('✅ Ключи RSA сгенерированы');
  } catch (err) {
    console.error('❌ Ошибка генерации ключей:', err);
    showResult('result-keys', `❌ Ошибка: ${err.message}`, 'error');
  }
}

/**
 * Экспорт CryptoKey в PEM-формат
 * @param {CryptoKey} key - ключ для экспорта
 * @param {string} type - 'public' или 'private'
 * @returns {string} PEM-строка
 */
async function exportKeyToPEM(key, type) {
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const exported = await window.crypto.subtle.exportKey(format, key);
  const base64 = arrayBufferToBase64(exported);
  // Форматируем в PEM с переносами строк каждые 64 символа
  const pemBody = base64.match(/.{1,64}/g).join('\n');
  const label = type === 'public' ? 'PUBLIC KEY' : 'PRIVATE KEY';
  return `-----BEGIN ${label}-----\n${pemBody}\n-----END ${label}-----`;
}

/**
 * Импорт PEM-ключа в CryptoKey
 * @param {string} pem - PEM-строка
 * @param {string} type - 'public' или 'private'
 * @returns {CryptoKey}
 */
async function importKeyFromPEM(pem, type) {
  // Удаляем заголовки PEM и пробелы
  const pemClean = pem
    .replace(/-----BEGIN [A-Z ]+-----/, '')
    .replace(/-----END [A-Z ]+-----/, '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemClean);
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const usage = type === 'public' ? ['verify'] : ['sign'];
  
  return await window.crypto.subtle.importKey(
    format,
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true,
    usage
  );
}

// ===== 3. СЕРТИФИКАТЫ (CA) =====

/**
 * Создание сертификата
 */
async function handleCreateCertificate(e) {
  e.preventDefault();
  
  const userId = document.getElementById('cert-user').value;
  const publicKey = document.getElementById('cert-pubkey').value.trim();
  const validityDays = parseInt(document.getElementById('cert-validity').value) || 365;
  
  if (!userId || !publicKey) {
    showResult('result-cert', '❌ Выберите пользователя и вставьте открытый ключ', 'error');
    return;
  }
  
  console.log(`📜 Создание сертификата для пользователя: ${userId}`);
  
  try {
    const response = await fetch('/api/createCertificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, publicKey, validityDays })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Сертификат создан:', data.certificate);
      showResult('result-cert',
        `✅ Сертификат выпущен!<br>
         ID: <code>${data.certificate.id}</code><br>
         Владелец: ${escapeHtml(data.certificate.name)}<br>
         Действителен до: ${new Date(data.certificate.expiresAt).toLocaleDateString('ru-RU')}`,
        'success'
      );
      showToast('Сертификат выпущен!', 'success');
      loadCertificates(); // Обновляем список
    } else {
      showResult('result-cert', `❌ Ошибка: ${data.error}`, 'error');
    }
  } catch (err) {
    console.error('❌ Ошибка создания сертификата:', err);
    showResult('result-cert', `❌ Ошибка: ${err.message}`, 'error');
  }
}

/**
 * Загрузка списка сертификатов
 */
async function loadCertificates() {
  console.log('📑 Загрузка сертификатов...');
  try {
    const response = await fetch('/api/createCertificate');
    const data = await response.json();
    
    const container = document.getElementById('certs-list');
    
    if (data.certificates && data.certificates.length > 0) {
      container.innerHTML = data.certificates.map(cert => {
        // Определяем статус сертификата
        let badge = '';
        const now = new Date();
        const expires = new Date(cert.expiresAt);
        
        if (cert.revoked) {
          badge = '<span class="cert-card__badge cert-card__badge--revoked">🚫 Отозван</span>';
        } else if (expires < now) {
          badge = '<span class="cert-card__badge cert-card__badge--expired">⚠️ Истёк</span>';
        } else {
          badge = '<span class="cert-card__badge cert-card__badge--valid">✅ Действителен</span>';
        }
        
        return `
          <div class="cert-card">
            <div class="cert-card__header">
              <div>
                <div class="cert-card__name">📜 ${escapeHtml(cert.name)}</div>
                <div class="cert-card__id">ID: ${cert.id}</div>
              </div>
              ${badge}
            </div>
            <div class="cert-card__details">
              <div class="cert-card__detail"><strong>Email:</strong> ${escapeHtml(cert.email)}</div>
              <div class="cert-card__detail"><strong>Выпущен:</strong> ${new Date(cert.issuedAt).toLocaleDateString('ru-RU')}</div>
              <div class="cert-card__detail"><strong>Истекает:</strong> ${new Date(cert.expiresAt).toLocaleDateString('ru-RU')}</div>
              <div class="cert-card__detail"><strong>Подпись CA:</strong> <code>${cert.caSignature ? cert.caSignature.substring(0, 16) + '...' : 'N/A'}</code></div>
            </div>
            <div class="cert-card__actions">
              ${!cert.revoked ? `<button class="btn btn--danger btn--sm" onclick="revokeCertificate('${cert.id}')">🚫 Отозвать</button>` : ''}
              <button class="btn btn--secondary btn--sm" onclick="checkCertificateById('${cert.id}')">🔍 Проверить</button>
            </div>
          </div>
        `;
      }).join('');
      
      console.log(`✅ Загружено сертификатов: ${data.certificates.length}`);
    } else {
      container.innerHTML = '<p class="list-empty">Нет выпущенных сертификатов</p>';
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки сертификатов:', err);
  }
}

/**
 * Отзыв сертификата (CRL)
 */
async function revokeCertificate(certId) {
  console.log(`🚫 Отзыв сертификата: ${certId}`);
  
  if (!confirm('Вы уверены, что хотите отозвать этот сертификат?')) return;
  
  try {
    const response = await fetch('/api/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificateId: certId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Сертификат отозван:', certId);
      showToast('Сертификат отозван!', 'info');
      loadCertificates(); // Обновляем список
    } else {
      showToast(`Ошибка: ${data.error}`, 'error');
    }
  } catch (err) {
    console.error('❌ Ошибка отзыва:', err);
    showToast(`Ошибка: ${err.message}`, 'error');
  }
}

/**
 * Проверка сертификата по ID
 */
async function checkCertificateById(certId) {
  document.getElementById('check-cert-id').value = certId;
  handleCheckCertificateAPI(certId);
}

/**
 * Обработчик формы проверки сертификата
 */
async function handleCheckCertificate(e) {
  e.preventDefault();
  const certId = document.getElementById('check-cert-id').value.trim();
  if (!certId) {
    showResult('result-check-cert', '❌ Введите ID сертификата', 'error');
    return;
  }
  handleCheckCertificateAPI(certId);
}

/**
 * API-запрос проверки сертификата
 */
async function handleCheckCertificateAPI(certId) {
  console.log(`🔍 Проверка сертификата: ${certId}`);
  
  try {
    const response = await fetch('/api/checkCertificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ certificateId: certId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const { status, certificate } = data;
      let type = 'success';
      let icon = '✅';
      
      if (status === 'revoked') {
        type = 'error';
        icon = '🚫';
      } else if (status === 'expired') {
        type = 'warning';
        icon = '⚠️';
      }
      
      showResult('result-check-cert',
        `${icon} <strong>Статус:</strong> ${status.toUpperCase()}<br>
         <strong>Владелец:</strong> ${escapeHtml(certificate.name)}<br>
         <strong>Email:</strong> ${escapeHtml(certificate.email)}<br>
         <strong>Выпущен:</strong> ${new Date(certificate.issuedAt).toLocaleDateString('ru-RU')}<br>
         <strong>Истекает:</strong> ${new Date(certificate.expiresAt).toLocaleDateString('ru-RU')}`,
        type
      );
    } else {
      showResult('result-check-cert', `❌ ${data.error}`, 'error');
    }
  } catch (err) {
    console.error('❌ Ошибка проверки:', err);
    showResult('result-check-cert', `❌ Ошибка: ${err.message}`, 'error');
  }
}

// ===== 4. ПОДПИСЬ СООБЩЕНИЯ =====

/**
 * Подпись сообщения с помощью закрытого ключа
 */
async function handleSign(e) {
  e.preventDefault();
  
  const message = document.getElementById('sign-message').value.trim();
  const privKeyPEM = document.getElementById('sign-privkey').value.trim();
  
  if (!message || !privKeyPEM) {
    showResult('result-sign', '❌ Заполните все поля', 'error');
    return;
  }
  
  console.log('✍️ Подпись сообщения...');
  showResult('result-sign', '⏳ Создание подписи...', 'info');
  document.getElementById('result-sign').style.display = 'block';
  
  try {
    // Импортируем закрытый ключ из PEM
    const privateKey = await importKeyFromPEM(privKeyPEM, 'private');
    
    // Кодируем сообщение
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Создаём подпись
    const signature = await window.crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      data
    );
    
    // Конвертируем в Base64
    const signatureBase64 = arrayBufferToBase64(signature);
    
    // Отображаем результат
    document.getElementById('signature-output').value = signatureBase64;
    document.getElementById('signature-display').style.display = 'block';
    
    showResult('result-sign', '✅ Сообщение успешно подписано!', 'success');
    showToast('Подпись создана!', 'success');
    console.log('✅ Подпись создана');
  } catch (err) {
    console.error('❌ Ошибка подписи:', err);
    showResult('result-sign', `❌ Ошибка: ${err.message}`, 'error');
  }
}

// ===== 5. ПРОВЕРКА ПОДПИСИ =====

/**
 * Проверка цифровой подписи
 */
async function handleVerify(e) {
  e.preventDefault();
  
  const message = document.getElementById('verify-message').value.trim();
  const signatureBase64 = document.getElementById('verify-signature').value.trim();
  const pubKeyPEM = document.getElementById('verify-pubkey').value.trim();
  
  if (!message || !signatureBase64 || !pubKeyPEM) {
    showResult('result-verify', '❌ Заполните все поля', 'error');
    return;
  }
  
  console.log('🔍 Проверка подписи...');
  showResult('result-verify', '⏳ Проверка подписи...', 'info');
  document.getElementById('result-verify').style.display = 'block';
  
  try {
    // Импортируем открытый ключ
    const publicKey = await importKeyFromPEM(pubKeyPEM, 'public');
    
    // Кодируем сообщение
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // Декодируем подпись из Base64
    const signature = base64ToArrayBuffer(signatureBase64);
    
    // Проверяем подпись
    const isValid = await window.crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signature,
      data
    );
    
    if (isValid) {
      showResult('result-verify', '✅ <strong>Подпись ВАЛИДНА!</strong><br>Сообщение подлинное и не было изменено.', 'success');
      showToast('Подпись валидна! ✅', 'success');
      console.log('✅ Подпись валидна');
    } else {
      showResult('result-verify', '❌ <strong>Подпись НЕВАЛИДНА!</strong><br>Сообщение могло быть изменено или подпись не соответствует ключу.', 'error');
      showToast('Подпись невалидна! ❌', 'error');
      console.log('❌ Подпись невалидна');
    }
  } catch (err) {
    console.error('❌ Ошибка проверки подписи:', err);
    showResult('result-verify', `❌ Ошибка: ${err.message}`, 'error');
  }
}

// ===== УТИЛИТЫ =====

/**
 * Показать результат в блоке
 * @param {string} elementId - ID элемента result
 * @param {string} html - HTML содержимое
 * @param {string} type - 'success', 'error', 'info', 'warning'
 */
function showResult(elementId, html, type) {
  const el = document.getElementById(elementId);
  el.style.display = 'block';
  el.className = `result result--${type}`;
  el.innerHTML = html;
}

/**
 * Показать toast-уведомление
 * @param {string} message - текст
 * @param {string} type - 'success', 'error', 'info'
 */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast--${type}`;
  toast.style.display = 'block';
  toast.style.animation = 'toastIn 0.35s ease';
  
  // Убираем через 3 секунды
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.animation = 'toastOut 0.35s ease forwards';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 350);
  }, 3000);
}

/**
 * Копирование текста из textarea в буфер обмена
 */
function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  el.select();
  navigator.clipboard.writeText(el.value).then(() => {
    showToast('Скопировано в буфер обмена!', 'success');
  }).catch(() => {
    // Fallback
    document.execCommand('copy');
    showToast('Скопировано!', 'success');
  });
}

/**
 * Конвертация ArrayBuffer в Base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Конвертация Base64 в ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Экранирование HTML для безопасного отображения
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
