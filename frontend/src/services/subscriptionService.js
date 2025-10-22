import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

/**
 * Subscription service for checking user limits and permissions
 */
class SubscriptionService {
  constructor() {
    this.subscriptionSettings = null;
    this.lastFetch = null;
    this.cacheTime = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Fetch subscription settings from API
   */
  async fetchSubscriptionSettings(tier) {
    try {
      const API_URL = getApiUrl();
      const response = await axios.get(`${API_URL}/subscriptions/${tier}`);

      if (response.data.success) {
        this.subscriptionSettings = response.data.subscription;
        this.lastFetch = Date.now();
        return this.subscriptionSettings;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch subscription settings:', error);
      return null;
    }
  }

  /**
   * Get subscription settings (with cache)
   */
  async getSubscriptionSettings(tier) {
    // Check cache
    if (this.subscriptionSettings &&
        this.subscriptionSettings.tier === tier &&
        this.lastFetch &&
        (Date.now() - this.lastFetch) < this.cacheTime) {
      return this.subscriptionSettings;
    }

    // Fetch new data
    return await this.fetchSubscriptionSettings(tier);
  }

  /**
   * Check if user can download content offline
   * @param {Object} user - User object with subscription and usage data
   * @param {string} contentType - 'books' or 'nashids'
   * @returns {Promise<{allowed: boolean, reason: string, current: number, limit: number}>}
   */
  async canDownloadOffline(user, contentType) {
    if (!user || !user.subscription) {
      return { allowed: false, reason: 'Пользователь не авторизован', current: 0, limit: 0 };
    }

    const settings = await this.getSubscriptionSettings(user.subscription.tier);
    if (!settings) {
      return { allowed: false, reason: 'Настройки подписки не найдены', current: 0, limit: 0 };
    }

    const limitKey = `${contentType}Offline`;
    const limit = settings.limits[limitKey];
    const current = user.usage?.[limitKey] || 0;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, reason: 'Безлимитный доступ', current, limit: -1 };
    }

    // Check if user has reached limit
    if (current >= limit) {
      return {
        allowed: false,
        reason: `Достигнут лимит офлайн ${contentType === 'books' ? 'книг' : 'нашидов'} (${limit})`,
        current,
        limit
      };
    }

    return {
      allowed: true,
      reason: 'OK',
      current,
      limit
    };
  }

  /**
   * Check if user can add to favorites
   * @param {Object} user - User object
   * @param {string} contentType - 'books' or 'nashids'
   * @returns {Promise<{allowed: boolean, reason: string, current: number, limit: number}>}
   */
  async canAddToFavorites(user, contentType) {
    if (!user || !user.subscription) {
      return { allowed: false, reason: 'Пользователь не авторизован', current: 0, limit: 0 };
    }

    const settings = await this.getSubscriptionSettings(user.subscription.tier);
    if (!settings) {
      return { allowed: false, reason: 'Настройки подписки не найдены', current: 0, limit: 0 };
    }

    const limitKey = `${contentType}Favorites`;
    const limit = settings.limits[limitKey];
    const current = user.usage?.[limitKey] || 0;

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, reason: 'Безлимитный доступ', current, limit: -1 };
    }

    // Check if user has reached limit
    if (current >= limit) {
      return {
        allowed: false,
        reason: `Достигнут лимит избранных ${contentType === 'books' ? 'книг' : 'нашидов'} (${limit})`,
        current,
        limit
      };
    }

    return {
      allowed: true,
      reason: 'OK',
      current,
      limit
    };
  }

  /**
   * Check if user can access content by access level
   * @param {Object} user - User object
   * @param {string} accessLevel - 'free', 'pro', or 'premium'
   * @returns {Promise<{allowed: boolean, reason: string}>}
   */
  async canAccessContent(user, accessLevel) {
    if (!user || !user.subscription) {
      return { allowed: false, reason: 'Пользователь не авторизован' };
    }

    const settings = await this.getSubscriptionSettings(user.subscription.tier);
    if (!settings) {
      return { allowed: false, reason: 'Настройки подписки не найдены' };
    }

    // Map access levels to settings
    const accessMap = {
      'free': 'freeContent',
      'pro': 'proContent',
      'premium': 'premiumContent'
    };

    const settingKey = accessMap[accessLevel];
    if (!settingKey) {
      return { allowed: true, reason: 'OK' }; // Unknown level = allow
    }

    const hasAccess = settings.access[settingKey];
    if (!hasAccess) {
      const levelNames = {
        'free': 'бесплатному',
        'pro': 'Pro',
        'premium': 'Premium'
      };
      return {
        allowed: false,
        reason: `Требуется подписка для доступа к ${levelNames[accessLevel]} контенту`
      };
    }

    return { allowed: true, reason: 'OK' };
  }

  /**
   * Check if user has specific feature
   * @param {Object} user - User object
   * @param {string} feature - Feature name (offlineMode, adFree, prioritySupport, earlyAccess)
   * @returns {Promise<{allowed: boolean, reason: string}>}
   */
  async hasFeature(user, feature) {
    if (!user || !user.subscription) {
      return { allowed: false, reason: 'Пользователь не авторизован' };
    }

    const settings = await this.getSubscriptionSettings(user.subscription.tier);
    if (!settings) {
      return { allowed: false, reason: 'Настройки подписки не найдены' };
    }

    const hasFeature = settings.features[feature];
    if (!hasFeature) {
      const featureNames = {
        offlineMode: 'офлайн режима',
        adFree: 'режима без рекламы',
        prioritySupport: 'приоритетной поддержки',
        earlyAccess: 'раннего доступа'
      };
      return {
        allowed: false,
        reason: `Требуется подписка для ${featureNames[feature] || feature}`
      };
    }

    return { allowed: true, reason: 'OK' };
  }

  /**
   * Get limits summary for user
   * @param {Object} user - User object
   * @returns {Promise<Object>} Summary with all limits and usage
   */
  async getLimitsSummary(user) {
    if (!user || !user.subscription) {
      return null;
    }

    const settings = await this.getSubscriptionSettings(user.subscription.tier);
    if (!settings) {
      return null;
    }

    return {
      tier: settings.tier,
      name: settings.name,
      limits: {
        booksOffline: {
          limit: settings.limits.booksOffline,
          current: user.usage?.booksOffline || 0,
          unlimited: settings.limits.booksOffline === -1
        },
        booksFavorites: {
          limit: settings.limits.booksFavorites,
          current: user.usage?.booksFavorites || 0,
          unlimited: settings.limits.booksFavorites === -1
        },
        nashidsOffline: {
          limit: settings.limits.nashidsOffline,
          current: user.usage?.nashidsOffline || 0,
          unlimited: settings.limits.nashidsOffline === -1
        },
        nashidsFavorites: {
          limit: settings.limits.nashidsFavorites,
          current: user.usage?.nashidsFavorites || 0,
          unlimited: settings.limits.nashidsFavorites === -1
        }
      },
      access: settings.access,
      features: settings.features
    };
  }

  /**
   * Clear cache (useful when user subscription changes)
   */
  clearCache() {
    this.subscriptionSettings = null;
    this.lastFetch = null;
  }
}

// Export singleton instance
export default new SubscriptionService();
