/**
 * Общий модуль хранилища данных (in-memory)
 * 
 * На Vercel serverless функции не имеют доступа к файловой системе
 * для записи, поэтому данные хранятся в памяти.
 * 
 * ВАЖНО: Данные сбрасываются при холодном старте функции.
 * Для production используйте базу данных (MongoDB, PostgreSQL и т.д.).
 * 
 * Для локальной разработки используется файловая система.
 */

const fs = require('fs');
const path = require('path');

// Определяем, работаем ли на Vercel
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;

// In-memory хранилище для Vercel
const memoryStore = {
  users: [],
  certificates: [],
  revoked: []
};

// Путь к данным для локальной разработки
const dataDir = path.join(process.cwd(), 'data');

/**
 * Чтение данных
 * @param {string} collection - 'users', 'certificates', или 'revoked'
 * @returns {Array} массив объектов
 */
function readData(collection) {
  if (isVercel) {
    // На Vercel — из памяти
    return memoryStore[collection] || [];
  }

  // Локально — из файлов
  try {
    const filePath = path.join(dataDir, `${collection}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`[Storage] Ошибка чтения ${collection}:`, err.message);
  }
  return [];
}

/**
 * Запись данных
 * @param {string} collection - 'users', 'certificates', или 'revoked'
 * @param {Array} data - массив объектов
 */
function writeData(collection, data) {
  if (isVercel) {
    // На Vercel — в память
    memoryStore[collection] = data;
    return;
  }

  // Локально — в файлы
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, `${collection}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[Storage] Данные сохранены: ${collection} (${data.length} записей)`);
  } catch (err) {
    console.error(`[Storage] Ошибка записи ${collection}:`, err.message);
  }
}

module.exports = { readData, writeData };
