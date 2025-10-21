# Система контроля версий MubarakWay

## Обзор

Система автоматического контроля версий обеспечивает:
- ✅ Автоматическое обновление версии при каждом деплое
- ✅ Принудительное обновление кеша браузера
- ✅ Сохранение важных пользовательских данных
- ✅ Уникальные хеши для всех файлов сборки
- ✅ API endpoint для проверки версии

---

## Как это работает

### 1. **Управление версией (package.json)**

Frontend версия хранится в `mubarak-way/package.json`:

```json
{
  "version": "1.0.0"
}
```

**Типы обновлений:**
- `npm run version:patch` - 1.0.0 → 1.0.1 (багфиксы)
- `npm run version:minor` - 1.0.0 → 1.1.0 (новые функции)
- `npm run version:major` - 1.0.0 → 2.0.0 (breaking changes)

### 2. **Автоматическое обновление версии при сборке**

При выполнении `npm run build`:

1. Запускается скрипт `scripts/updateVersion.js`
2. Читает версию из `package.json`
3. Добавляет timestamp для уникальности
4. Обновляет `APP_VERSION` в `index.html`
5. Создается build с новой версией

**Пример:**
```javascript
// До сборки:
const APP_VERSION = 'v1.0.0';

// После сборки:
const APP_VERSION = 'v1.0.0.1738424573912';
```

### 3. **Cache Busting на стороне клиента**

При загрузке приложения (`index.html`):

```javascript
const APP_VERSION = 'v1.0.0.1738424573912';
const savedVersion = localStorage.getItem('app_version');

if (savedVersion !== APP_VERSION) {
  // 1. Очистить все кеши браузера
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });

  // 2. Очистить localStorage (кроме важных данных)
  // Сохраняются: bookFavorites, bookmarks, nashidFavorites,
  //              offlineNashids, userData, prayerSettings

  // 3. Перезагрузить страницу
  window.location.reload(true);
}
```

### 4. **Vite Cache Busting**

Каждый файл в сборке получает уникальный хеш:

```
dist/assets/index.a3f2d1e8.js
dist/assets/index.b7c4e9f2.css
dist/assets/logo.9d3a2f1b.svg
```

При изменении файла меняется его хеш → браузер загружает новую версию.

---

## Workflow деплоя

### Вариант 1: Быстрый деплой (без изменения версии)

Для мелких правок, где не нужна принудительная очистка кеша:

```bash
cd mubarak-way
npm run build
cd ..
git add .
git commit -m "fix: minor bugfix"
git push origin main
```

### Вариант 2: Деплой с обновлением версии (рекомендуется)

Для значимых изменений:

```bash
cd mubarak-way

# Обновить версию (выбрать один из вариантов):
npm run version:patch  # Багфикс
npm run version:minor  # Новая функция
npm run version:major  # Breaking change

# Собрать с новой версией
npm run build

cd ..

# Закоммитить и запушить
git add .
git commit -m "feat: add new feature (v1.1.0)"
git push origin main
```

**Что произойдет на клиенте:**
1. Пользователь откроет приложение
2. Обнаружится новая версия `v1.1.0.xxxxx`
3. Автоматически очистится кеш
4. Страница перезагрузится
5. Загрузится свежая версия

---

## API Endpoint

### GET /api/version

Получить текущую версию сервера:

```bash
curl https://mubarakway-backend.onrender.com/api/version
```

**Ответ:**
```json
{
  "success": true,
  "version": {
    "server": "1.0.0",
    "buildTime": "2025-01-31T12:30:00.000Z",
    "timestamp": 1738424573912
  }
}
```

**Использование на frontend:**
```javascript
const checkVersion = async () => {
  const response = await fetch('https://mubarakway-backend.onrender.com/api/version');
  const data = await response.json();
  console.log('Server version:', data.version.server);
};
```

---

## Важные файлы

### `mubarak-way/package.json`
- Хранит версию приложения
- Определяет скрипты для управления версией

### `mubarak-way/scripts/updateVersion.js`
- Автоматически обновляет версию в index.html
- Вызывается перед каждой сборкой

### `mubarak-way/index.html`
- Содержит логику проверки версии
- Очищает кеш при обнаружении новой версии
- Сохраняет важные пользовательские данные

### `mubarak-way/vite.config.js`
- Настраивает хеширование файлов
- Обеспечивает уникальные имена для assets

### `server/routes/version.js`
- API endpoint для проверки версии сервера
- Возвращает информацию о сборке

---

## Что сохраняется при обновлении

При обновлении версии **НЕ удаляются** следующие данные:

```javascript
const importantKeys = [
  'bookFavorites',      // Избранные книги
  'bookmarks',          // Закладки в книгах
  'nashidFavorites',    // Избранные нашиды
  'offlineNashids',     // Офлайн нашиды
  'userData',           // Данные пользователя
  'prayerSettings'      // Настройки времени молитв
];
```

Все остальные данные в localStorage очищаются.

---

## Тестирование локально

### 1. Тест обновления версии

```bash
cd mubarak-way

# Изменить версию
npm run version:patch

# Проверить новую версию
cat package.json | grep version

# Собрать
npm run build

# Проверить что версия обновилась в index.html
cat index.html | grep APP_VERSION
```

### 2. Тест очистки кеша

1. Открыть приложение в браузере
2. Открыть DevTools → Console
3. Проверить текущую версию:
   ```javascript
   localStorage.getItem('app_version')
   ```
4. Вручную изменить версию в localStorage:
   ```javascript
   localStorage.setItem('app_version', 'v0.0.1')
   ```
5. Перезагрузить страницу
6. Должна произойти очистка кеша и reload

---

## Monitoring версий

### Console логи

При загрузке приложения в консоли появятся логи:

```
[Version] Checking version: { current: 'v1.0.0.1738424573912', saved: 'v1.0.0.1738424560000' }
[Version] New version detected! Clearing cache and reloading...
[Version] Old: v1.0.0.1738424560000 → New: v1.0.0.1738424573912
[Cache] Clearing 3 cache(s)
[Cache] Preserving: bookFavorites
[Cache] Preserving: nashidFavorites
[Version] Reloading application...
```

### Production логи

После деплоя на Render.com можно проверить:

1. **Версию сервера:**
   ```bash
   curl https://mubarakway-backend.onrender.com/api/version
   ```

2. **Логи Render.com:**
   - Зайти на dashboard.render.com
   - Выбрать сервис
   - Проверить логи деплоя

---

## Troubleshooting

### Проблема: Пользователи не видят обновления

**Решение:**
1. Проверить что версия обновилась:
   ```bash
   cat mubarak-way/package.json | grep version
   ```
2. Проверить что сборка прошла успешно:
   ```bash
   cat mubarak-way/dist/index.html | grep APP_VERSION
   ```
3. Убедиться что изменения запушены:
   ```bash
   git log -1
   ```

### Проблема: Кеш не очищается

**Решение:**
1. Проверить логи в браузере (Console)
2. Убедиться что `APP_VERSION` изменился в index.html
3. Вручную очистить кеш: DevTools → Application → Clear storage

### Проблема: Потеряны пользовательские данные

**Решение:**
- Проверить массив `importantKeys` в index.html
- Добавить нужные ключи в список сохранения
- Пересобрать и задеплоить

---

## Best Practices

### 1. Semantic Versioning

Следуйте правилам semantic versioning:
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

### 2. Commit Messages

Используйте префиксы:
```
feat: add new feature (v1.1.0)
fix: correct bug (v1.0.1)
refactor: improve code (v1.0.2)
docs: update documentation
```

### 3. Testing

Перед деплоем:
- ✅ Тестировать локально
- ✅ Проверить что важные данные сохраняются
- ✅ Проверить работу в Telegram Mini App

### 4. Деплой в production

```bash
# 1. Обновить версию
cd mubarak-way
npm run version:minor

# 2. Собрать
npm run build

# 3. Проверить сборку
ls dist/

# 4. Коммит
cd ..
git add .
git commit -m "feat: new feature (v$(cat mubarak-way/package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d ' '))"

# 5. Пуш
git push origin main

# 6. Проверить деплой на Render.com
```

---

## Резюме

✅ **Автоматическое управление версией** - script обновляет версию при сборке
✅ **Cache busting** - хеши в именах файлов + проверка версии
✅ **Безопасность данных** - важные данные сохраняются
✅ **API мониторинга** - /api/version для проверки версии
✅ **Простой workflow** - npm run version:patch → build → push

При каждом деплое пользователи автоматически получат свежую версию! 🚀
