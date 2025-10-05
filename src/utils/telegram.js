// Telegram Mini App Integration

export class TelegramWebApp {
  constructor() {
    this.webApp = window.Telegram?.WebApp;
    this.isInitialized = false;

    if (this.webApp) {
      this.init();
    }
  }

  init() {
    if (!this.webApp) return false;

    try {
      // Инициализация WebApp
      this.webApp.ready();
      this.webApp.expand();

      // Настройка темы
      this.setupTheme();

      // Настройка главной кнопки
      this.setupMainButton();

      // Настройка кнопки назад
      this.setupBackButton();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Telegram WebApp initialization failed:', error);
      return false;
    }
  }

  setupTheme() {
    if (!this.webApp) return;

    // Получаем цвета темы из Telegram
    const themeParams = this.webApp.themeParams;

    if (themeParams) {
      // Применяем цвета темы к CSS переменным
      document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
      document.documentElement.style.setProperty('--tg-hint-color', themeParams.hint_color || '#999999');
      document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#22c55e');
      document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
    }
  }

  setupMainButton() {
    if (!this.webApp?.MainButton) return;

    this.webApp.MainButton.setText('Действие');
    this.webApp.MainButton.color = '#22c55e';
    this.webApp.MainButton.textColor = '#ffffff';
    this.webApp.MainButton.hide();
  }

  setupBackButton() {
    if (!this.webApp?.BackButton) return;

    this.webApp.BackButton.onClick(() => {
      // Обработка кнопки "Назад"
      if (window.location.pathname !== '/') {
        window.history.back();
      } else {
        this.webApp.close();
      }
    });
  }

  // Получение данных пользователя
  getUser() {
    if (!this.webApp?.initDataUnsafe?.user) {
      console.log('[Telegram] No user data in initDataUnsafe');
      return null;
    }

    const user = this.webApp.initDataUnsafe.user;
    console.log('[Telegram] Raw user data:', user);

    const userData = {
      id: user.id,
      first_name: user.first_name,  // Сохраняем как first_name для совместимости
      last_name: user.last_name,
      username: user.username,
      language_code: user.language_code,
      is_premium: user.is_premium,
      photo_url: user.photo_url
    };

    console.log('[Telegram] Formatted user data:', userData);
    return userData;
  }

  // Получение данных инициализации
  getInitData() {
    return this.webApp?.initData || '';
  }

  // Показать главную кнопку
  showMainButton(text, callback) {
    if (!this.webApp?.MainButton) return;

    this.webApp.MainButton.setText(text);
    this.webApp.MainButton.show();
    this.webApp.MainButton.onClick(callback);
  }

  // Скрыть главную кнопку
  hideMainButton() {
    if (!this.webApp?.MainButton) return;
    this.webApp.MainButton.hide();
  }

  // Показать кнопку назад
  showBackButton() {
    if (!this.webApp?.BackButton) return;
    this.webApp.BackButton.show();
  }

  // Скрыть кнопку назад
  hideBackButton() {
    if (!this.webApp?.BackButton) return;
    this.webApp.BackButton.hide();
  }

  // Показать всплывающее сообщение
  showAlert(message) {
    if (!this.webApp) {
      alert(message);
      return;
    }
    this.webApp.showAlert(message);
  }

  // Показать подтверждение
  showConfirm(message, callback) {
    if (!this.webApp) {
      const result = confirm(message);
      callback(result);
      return;
    }
    this.webApp.showConfirm(message, callback);
  }

  // Показать всплывающее окно
  showPopup(params) {
    if (!this.webApp?.showPopup) {
      this.showAlert(params.message);
      return;
    }
    this.webApp.showPopup(params);
  }

  // Открыть ссылку
  openLink(url) {
    if (!this.webApp) {
      window.open(url, '_blank');
      return;
    }
    this.webApp.openLink(url);
  }

  // Закрыть приложение
  close() {
    if (!this.webApp) {
      window.close();
      return;
    }
    this.webApp.close();
  }

  // Отправить данные в бот
  sendData(data) {
    if (!this.webApp) return;
    this.webApp.sendData(JSON.stringify(data));
  }

  // Открыть чат с ботом
  openChat() {
    if (!this.webApp) return;
    // Получаем bot username из параметров или используем дефолтный
    const botUsername = this.webApp.initDataUnsafe?.bot?.username || 'MubarakWayApp_bot';
    this.openLink(`https://t.me/${botUsername}`);
  }

  // Отправить аудиофайл в чат с ботом через Deep Link
  async sendAudioToBot(nashid) {
    try {
      console.log('[sendAudioToBot] Начало отправки нашида:', nashid);

      // Получаем username бота
      const botUsername = this.webApp?.initDataUnsafe?.bot?.username || 'MubarakWayApp_bot';
      console.log('[sendAudioToBot] Bot username:', botUsername);

      // Формируем Deep Link с командой start и параметром
      const deepLink = `https://t.me/${botUsername}?start=download_${nashid.id}`;
      console.log('[sendAudioToBot] Deep link:', deepLink);

      // Показываем popup с подтверждением
      if (this.webApp) {
        console.log('[sendAudioToBot] Используем Telegram WebApp API');
        this.showConfirm(
          `Отправить нашид "${nashid.title}" в чат с ботом?`,
          (confirmed) => {
            console.log('[sendAudioToBot] User confirmed:', confirmed);
            if (confirmed) {
              this.vibrate();
              this.openLink(deepLink);
            }
          }
        );
      } else {
        // В браузере просто открываем ссылку
        console.log('[sendAudioToBot] Открываем в браузере');
        window.open(deepLink, '_blank');
      }

      return true;
    } catch (error) {
      console.error('[sendAudioToBot] Ошибка:', error);
      this.showAlert('Ошибка при отправке аудиофайла');
      return false;
    }
  }

  // Включить/выключить вибрацию
  vibrate() {
    if (!this.webApp) return;

    if (this.webApp.HapticFeedback) {
      this.webApp.HapticFeedback.impactOccurred('medium');
    } else if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }

  // Проверка, является ли приложение Mini App
  isMiniApp() {
    const result = !!this.webApp;
    console.log('[Telegram] isMiniApp check:', {
      webApp: !!this.webApp,
      result,
      windowTelegram: !!window.Telegram,
      windowTelegramWebApp: !!window.Telegram?.WebApp
    });
    return result;
  }

  // Получение версии API
  getVersion() {
    return this.webApp?.version || '6.0';
  }

  // Получение платформы
  getPlatform() {
    return this.webApp?.platform || 'unknown';
  }
}

// Глобальный экземпляр
export const telegram = new TelegramWebApp();