import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import prayerTimesService from '../../services/prayerTimesService';

// Async thunks
export const getCurrentLocation = createAsyncThunk(
  'qibla/getCurrentLocation',
  async (_, { rejectWithValue }) => {
    try {
      const location = await prayerTimesService.getCurrentLocation();
      return location;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const calculatePrayerTimes = createAsyncThunk(
  'qibla/calculatePrayerTimes',
  async ({ date, location, settings }, { rejectWithValue }) => {
    try {
      const prayerTimes = await prayerTimesService.getPrayerTimesWithOfflineSupport(date, location, settings);
      return prayerTimes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loadPrayerSettings = createAsyncThunk(
  'qibla/loadPrayerSettings',
  async () => {
    const settings = await prayerTimesService.loadSettings();
    return settings;
  }
);

export const savePrayerSettings = createAsyncThunk(
  'qibla/savePrayerSettings',
  async (settings) => {
    const savedSettings = await prayerTimesService.saveSettings(settings);
    return savedSettings;
  }
);

export const getPrayerTimesForWeek = createAsyncThunk(
  'qibla/getPrayerTimesForWeek',
  async ({ startDate, location, settings }, { rejectWithValue }) => {
    try {
      const weeklyTimes = await prayerTimesService.getPrayerTimesForDays(startDate, 7, location, settings);
      return weeklyTimes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const qiblaSlice = createSlice({
  name: 'qibla',
  initialState: {
    // Location data
    userLocation: null,
    locationLoading: false,
    locationError: null,

    // Prayer times
    prayerTimes: null,
    currentPrayer: null,
    nextPrayer: null,
    timeUntilNext: null,
    weeklyTimes: [],
    prayerTimesLoading: false,
    prayerTimesError: null,

    // Qibla direction
    qiblaDirection: null,

    // Settings
    settings: null,
    settingsLoading: false,

    // Hijri date
    hijriDate: null,

    // Notifications
    notificationsEnabled: false,

    // General loading and error states
    loading: false,
    error: null
  },
  reducers: {
    setUserLocation: (state, action) => {
      state.userLocation = action.payload;

      // Calculate Qibla direction using the service
      const direction = prayerTimesService.getQiblaDirection(action.payload);
      state.qiblaDirection = isNaN(direction) ? null : direction;
    },

    updateCurrentTime: (state) => {
      if (state.prayerTimes) {
        const currentPrayer = prayerTimesService.getCurrentPrayer(state.prayerTimes);
        const timeUntilNext = prayerTimesService.getTimeUntilNextPrayer(state.prayerTimes);

        state.currentPrayer = currentPrayer;
        state.nextPrayer = currentPrayer;
        state.timeUntilNext = timeUntilNext;
      }
    },

    setNotificationsEnabled: (state, action) => {
      state.notificationsEnabled = action.payload;
    },

    setHijriDate: (state, action) => {
      state.hijriDate = action.payload;
    },

    clearErrors: (state) => {
      state.error = null;
      state.locationError = null;
      state.prayerTimesError = null;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // getCurrentLocation
      .addCase(getCurrentLocation.pending, (state) => {
        state.locationLoading = true;
        state.locationError = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.locationLoading = false;
        state.userLocation = action.payload;

        // Calculate Qibla direction
        const direction = prayerTimesService.getQiblaDirection(action.payload);
        state.qiblaDirection = isNaN(direction) ? null : direction;
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.locationLoading = false;
        state.locationError = action.payload;
      })

      // calculatePrayerTimes
      .addCase(calculatePrayerTimes.pending, (state) => {
        state.prayerTimesLoading = true;
        state.prayerTimesError = null;
      })
      .addCase(calculatePrayerTimes.fulfilled, (state, action) => {
        state.prayerTimesLoading = false;
        state.prayerTimes = action.payload;

        // Update current prayer info
        const currentPrayer = prayerTimesService.getCurrentPrayer(action.payload);
        const timeUntilNext = prayerTimesService.getTimeUntilNextPrayer(action.payload);

        state.currentPrayer = currentPrayer;
        state.nextPrayer = currentPrayer;
        state.timeUntilNext = timeUntilNext;
      })
      .addCase(calculatePrayerTimes.rejected, (state, action) => {
        state.prayerTimesLoading = false;
        state.prayerTimesError = action.payload;
      })

      // loadPrayerSettings
      .addCase(loadPrayerSettings.pending, (state) => {
        state.settingsLoading = true;
      })
      .addCase(loadPrayerSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
      })
      .addCase(loadPrayerSettings.rejected, (state) => {
        state.settingsLoading = false;
      })

      // savePrayerSettings
      .addCase(savePrayerSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })

      // getPrayerTimesForWeek
      .addCase(getPrayerTimesForWeek.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPrayerTimesForWeek.fulfilled, (state, action) => {
        state.loading = false;
        state.weeklyTimes = action.payload;
      })
      .addCase(getPrayerTimesForWeek.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setUserLocation,
  updateCurrentTime,
  setNotificationsEnabled,
  setHijriDate,
  clearErrors,
  setLoading,
  setError
} = qiblaSlice.actions;

export default qiblaSlice.reducer;