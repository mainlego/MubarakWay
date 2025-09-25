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
    if (!this.webApp?.initDataUnsafe?.user) return null;

    const user = this.webApp.initDataUnsafe.user;
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
      isPremium: user.is_premium,
      photoUrl: user.photo_url
    };
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
    return !!this.webApp;
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