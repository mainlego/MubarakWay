# Использование системы подписок на фронтенде

## Импорт сервиса

```javascript
import subscriptionService from '../services/subscriptionService';
import { useSelector } from 'react-redux';
```

## Получение данных пользователя

```javascript
const user = useSelector((state) => state.auth.user);
```

## Примеры использования

### 1. Проверка возможности скачивания офлайн

```javascript
// Перед скачиванием книги
const handleDownloadBook = async (book) => {
  const check = await subscriptionService.canDownloadOffline(user, 'books');

  if (!check.allowed) {
    alert(check.reason); // "Достигнут лимит офлайн книг (3)"
    return;
  }

  // Продолжаем скачивание...
  console.log(`Доступно: ${check.limit - check.current} из ${check.limit}`);
};
```

### 2. Проверка добавления в избранное

```javascript
const handleAddToFavorites = async (nashid) => {
  const check = await subscriptionService.canAddToFavorites(user, 'nashids');

  if (!check.allowed) {
    // Показать предложение обновить подписку
    showUpgradeModal(check.reason);
    return;
  }

  // Добавляем в избранное
  dispatch(addToFavorites(nashid.id));
};
```

### 3. Проверка доступа к контенту

```javascript
const handleOpenBook = async (book) => {
  // Проверяем уровень доступа к книге
  const check = await subscriptionService.canAccessContent(user, book.accessLevel);

  if (!check.allowed) {
    // book.accessLevel = 'premium'
    // check.reason = "Требуется подписка для доступа к Premium контенту"
    showPaywall(check.reason);
    return;
  }

  // Открываем книгу
  navigate(`/books/${book.id}`);
};
```

### 4. Проверка наличия функции

```javascript
const OfflineButton = () => {
  const [hasOffline, setHasOffline] = useState(false);

  useEffect(() => {
    checkOfflineAccess();
  }, [user]);

  const checkOfflineAccess = async () => {
    const check = await subscriptionService.hasFeature(user, 'offlineMode');
    setHasOffline(check.allowed);
  };

  if (!hasOffline) {
    return (
      <button onClick={() => showUpgradeModal('Офлайн режим доступен в Pro подписке')}>
        🔒 Получить офлайн доступ
      </button>
    );
  }

  return (
    <button onClick={downloadOffline}>
      ⬇️ Скачать офлайн
    </button>
  );
};
```

### 5. Отображение лимитов пользователя

```javascript
const SubscriptionInfo = () => {
  const [limits, setLimits] = useState(null);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    loadLimits();
  }, [user]);

  const loadLimits = async () => {
    const summary = await subscriptionService.getLimitsSummary(user);
    setLimits(summary);
  };

  if (!limits) return <div>Загрузка...</div>;

  return (
    <div className="subscription-info">
      <h3>{limits.name}</h3>

      <div className="limits">
        <h4>Ваши лимиты:</h4>

        <div>
          📚 Книги офлайн: {
            limits.limits.booksOffline.unlimited
              ? '∞ Безлимит'
              : `${limits.limits.booksOffline.current} / ${limits.limits.booksOffline.limit}`
          }
        </div>

        <div>
          ⭐ Избранные книги: {
            limits.limits.booksFavorites.unlimited
              ? '∞ Безлимит'
              : `${limits.limits.booksFavorites.current} / ${limits.limits.booksFavorites.limit}`
          }
        </div>

        <div>
          🎵 Нашиды офлайн: {
            limits.limits.nashidsOffline.unlimited
              ? '∞ Безлимит'
              : `${limits.limits.nashidsOffline.current} / ${limits.limits.nashidsOffline.limit}`
          }
        </div>
      </div>

      <div className="features">
        <h4>Возможности:</h4>
        {limits.features.offlineMode && <span>✅ Офлайн режим</span>}
        {limits.features.adFree && <span>✅ Без рекламы</span>}
        {limits.features.prioritySupport && <span>✅ Приоритетная поддержка</span>}
        {limits.features.earlyAccess && <span>✅ Ранний доступ</span>}
      </div>
    </div>
  );
};
```

### 6. Условное отображение элементов

```javascript
const BookCard = ({ book }) => {
  const [canAccess, setCanAccess] = useState(false);
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    checkAccess();
  }, [book, user]);

  const checkAccess = async () => {
    const check = await subscriptionService.canAccessContent(user, book.accessLevel);
    setCanAccess(check.allowed);
  };

  return (
    <div className="book-card">
      <img src={book.cover} alt={book.title} />
      <h3>{book.title}</h3>

      {canAccess ? (
        <button onClick={() => openBook(book)}>
          Читать
        </button>
      ) : (
        <div className="locked">
          <span>🔒 {book.accessLevel === 'pro' ? 'Pro' : 'Premium'}</span>
          <button onClick={() => showUpgrade()}>
            Получить доступ
          </button>
        </div>
      )}
    </div>
  );
};
```

### 7. Очистка кэша при изменении подписки

```javascript
// После обновления подписки пользователя
const handleSubscriptionUpdate = async (newTier) => {
  // Обновляем подписку на сервере
  await updateUserSubscription(newTier);

  // Очищаем кэш, чтобы загрузить новые настройки
  subscriptionService.clearCache();

  // Перезагружаем данные пользователя
  dispatch(fetchUserProfile());
};
```

## Интеграция в существующие компоненты

### Library (Библиотека)

```javascript
// src/pages/Library.jsx
import subscriptionService from '../services/subscriptionService';

const handleDownloadBook = async (book) => {
  const check = await subscriptionService.canDownloadOffline(user, 'books');

  if (!check.allowed) {
    setError(check.reason);
    setShowUpgradePrompt(true);
    return;
  }

  // Скачиваем книгу...
};

const handleAddToFavorites = async (book) => {
  const check = await subscriptionService.canAddToFavorites(user, 'books');

  if (!check.allowed) {
    setError(check.reason);
    return;
  }

  // Добавляем в избранное...
};
```

### Nashids (Нашиды)

```javascript
// src/pages/Nashids.jsx
import subscriptionService from '../services/subscriptionService';

const handleDownloadNashid = async (nashid) => {
  const check = await subscriptionService.canDownloadOffline(user, 'nashids');

  if (!check.allowed) {
    showLimitReachedModal(check.current, check.limit);
    return;
  }

  // Скачиваем нашид...
};
```

### Book Reader (Чтение книги)

```javascript
// src/components/EnhancedBookReader.jsx
useEffect(() => {
  checkBookAccess();
}, [book]);

const checkBookAccess = async () => {
  if (!book) return;

  const check = await subscriptionService.canAccessContent(user, book.accessLevel);

  if (!check.allowed) {
    // Показываем paywall
    setShowPaywall(true);
    setPaywallMessage(check.reason);
  }
};
```

## Обработка ошибок

```javascript
try {
  const check = await subscriptionService.canDownloadOffline(user, 'books');

  if (!check.allowed) {
    // Пользователь достиг лимита
    handleLimitReached(check);
  }
} catch (error) {
  console.error('Subscription check failed:', error);
  // Fallback: разрешаем действие или показываем общую ошибку
}
```

## Best Practices

1. **Проверяйте перед действием**: Всегда проверяйте лимиты ДО выполнения действия
2. **Кэшируйте результаты**: Сервис уже кэширует настройки на 5 минут
3. **Обрабатывайте ошибки**: Всегда оборачивайте вызовы в try-catch
4. **Очищайте кэш**: После изменения подписки вызывайте `clearCache()`
5. **UX**: Показывайте пользователю понятные сообщения об ограничениях
6. **Upgrade prompts**: При достижении лимита показывайте предложение улучшить подписку

## Типы возвращаемых значений

### canDownloadOffline / canAddToFavorites
```typescript
{
  allowed: boolean,
  reason: string,
  current: number,  // Текущее использование
  limit: number     // Лимит (-1 = безлимит)
}
```

### canAccessContent / hasFeature
```typescript
{
  allowed: boolean,
  reason: string
}
```

### getLimitsSummary
```typescript
{
  tier: string,
  name: string,
  limits: {
    booksOffline: { limit: number, current: number, unlimited: boolean },
    booksFavorites: { limit: number, current: number, unlimited: boolean },
    nashidsOffline: { limit: number, current: number, unlimited: boolean },
    nashidsFavorites: { limit: number, current: number, unlimited: boolean }
  },
  access: {
    freeContent: boolean,
    proContent: boolean,
    premiumContent: boolean
  },
  features: {
    offlineMode: boolean,
    adFree: boolean,
    prioritySupport: boolean,
    earlyAccess: boolean
  }
}
```
