# Быстрый старт: Система подписок

## ✅ Что уже готово

### Backend
- ✅ Модели: `Subscription`, `User` (обновлена)
- ✅ API endpoints: CRUD для админа + публичные для фронта
- ✅ Динамические тарифы (можно создавать любые)
- ✅ Валидация и защита от удаления используемых тарифов

### Frontend
- ✅ Админ-панель: создание, редактирование, удаление подписок
- ✅ `subscriptionService`: проверка лимитов и прав доступа
- ✅ Кэширование настроек (5 мин)

### Database
- ✅ Создано 3 дефолтные подписки:
  - Muslim (Free)
  - Mutahsin (Pro)
  - Sahib (Premium)

## 🚀 Как использовать на фронтенде

### 1. Проверка перед скачиванием

```javascript
// В Library.jsx или где используется скачивание
import subscriptionService from '../services/subscriptionService';

const handleDownloadBook = async (book) => {
  const user = useSelector((state) => state.auth.user);

  // Проверяем лимит
  const check = await subscriptionService.canDownloadOffline(user, 'books');

  if (!check.allowed) {
    // Показываем сообщение
    alert(check.reason); // "Достигнут лимит офлайн книг (3)"

    // Или показываем модалку с предложением улучшить подписку
    showUpgradeModal();
    return;
  }

  // Скачиваем...
  downloadBook(book);
};
```

### 2. Проверка добавления в избранное

```javascript
const handleAddToFavorites = async (nashid) => {
  const user = useSelector((state) => state.auth.user);
  const check = await subscriptionService.canAddToFavorites(user, 'nashids');

  if (!check.allowed) {
    alert(`${check.reason}. Осталось ${check.limit - check.current} из ${check.limit}`);
    return;
  }

  // Добавляем в избранное
  dispatch(addToFavorites(nashid));
};
```

### 3. Проверка доступа к контенту

```javascript
// В BookReader или при открытии книги
const BookReader = ({ book }) => {
  const user = useSelector((state) => state.auth.user);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [book]);

  const checkAccess = async () => {
    // book.accessLevel = 'free' | 'pro' | 'premium'
    const check = await subscriptionService.canAccessContent(user, book.accessLevel);
    setHasAccess(check.allowed);

    if (!check.allowed) {
      // Показываем paywall
      setShowPaywall(true);
    }
  };

  if (!hasAccess) {
    return <Paywall message="Требуется Premium подписка" />;
  }

  return <BookContent book={book} />;
};
```

### 4. Отображение лимитов в профиле

```javascript
// В Profile.jsx
const SubscriptionInfo = () => {
  const user = useSelector((state) => state.auth.user);
  const [limits, setLimits] = useState(null);

  useEffect(() => {
    loadLimits();
  }, [user]);

  const loadLimits = async () => {
    const summary = await subscriptionService.getLimitsSummary(user);
    setLimits(summary);
  };

  if (!limits) return <Loader />;

  return (
    <div>
      <h2>{limits.name}</h2>

      <div>
        📚 Книги офлайн: {
          limits.limits.booksOffline.unlimited
            ? '∞'
            : `${limits.limits.booksOffline.current} / ${limits.limits.booksOffline.limit}`
        }
      </div>

      <div>
        🎵 Нашиды офлайн: {
          limits.limits.nashidsOffline.unlimited
            ? '∞'
            : `${limits.limits.nashidsOffline.current} / ${limits.limits.nashidsOffline.limit}`
        }
      </div>

      {limits.features.adFree && <Badge>Без рекламы</Badge>}
      {limits.features.offlineMode && <Badge>Офлайн режим</Badge>}
    </div>
  );
};
```

## 🎯 Куда интегрировать

### Приоритет 1 (Критично):
1. **Library** - проверка перед скачиванием книг
2. **Nashids** - проверка перед скачиванием нашидов
3. **BookReader** - проверка доступа к платному контенту

### Приоритет 2 (Важно):
4. **Profile** - отображение текущей подписки и лимитов
5. **Favorites** - проверка перед добавлением в избранное

### Приоритет 3 (Желательно):
6. **Settings** - кнопка "Улучшить подписку"
7. **Paywall** - модалка с предложением купить подписку

## 📊 Управление через админку

### Доступ
https://mubarak-way.onrender.com/admin/subscriptions

### Что можно делать:
- ✅ Создавать новые тарифы (кнопка "Создать подписку")
- ✅ Редактировать лимиты (кнопка с карандашом)
- ✅ Удалять тарифы (кнопка с корзиной)
- ✅ Настраивать доступ к контенту
- ✅ Включать/выключать функции

### Пример создания нового тарифа:

1. Нажмите "Создать подписку"
2. Заполните:
   - Tier ID: `family` (только lowercase!)
   - Название: `Family (Семейная)`
   - Описание: `Подписка для всей семьи`
   - Цена: `999 RUB / monthly`
   - Лимиты:
     - Книги офлайн: `50`
     - Избранные книги: `100`
     - Нашиды офлайн: `-1` (безлимит)
     - Избранные нашиды: `-1` (безлимит)
   - Доступ: все галочки
   - Возможности: все галочки
3. Нажмите "Создать подписку"

Готово! Новый тариф сразу доступен для назначения пользователям.

## 🔄 После изменения подписки пользователя

```javascript
// После апгрейда подписки
const upgradeSubscription = async (newTier) => {
  // 1. Обновляем на сервере
  await api.updateUserSubscription(newTier);

  // 2. Очищаем кэш
  subscriptionService.clearCache();

  // 3. Перезагружаем профиль
  dispatch(fetchUserProfile());

  // 4. Показываем успех
  toast.success('Подписка успешно обновлена!');
};
```

## 📝 API Endpoints

### Публичные (для фронтенда):
- `GET /api/subscriptions` - все активные подписки
- `GET /api/subscriptions/:tier` - конкретная подписка

### Админские:
- `GET /api/admin/subscriptions` - все подписки
- `POST /api/admin/subscriptions` - создать
- `PUT /api/admin/subscriptions/:tier` - обновить
- `DELETE /api/admin/subscriptions/:tier` - удалить

## ⚡ Производительность

- **Кэш**: настройки подписки кэшируются на 5 минут
- **Оптимизация**: один запрос для всех проверок
- **Очистка**: автоматическая очистка кэша при изменении подписки

## 🐛 Отладка

```javascript
// Проверить что загружено
const check = await subscriptionService.canDownloadOffline(user, 'books');
console.log('Check result:', check);
// { allowed: false, reason: "...", current: 3, limit: 3 }

// Посмотреть полную сводку
const summary = await subscriptionService.getLimitsSummary(user);
console.log('Limits summary:', summary);

// Очистить кэш вручную
subscriptionService.clearCache();
```

## ✨ Готово!

Система полностью настроена и готова к использованию. Просто добавьте проверки в нужные компоненты по примерам выше.
