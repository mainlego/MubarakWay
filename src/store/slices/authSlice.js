import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (telegramUser, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(telegramUser);
      return response.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchUserData = createAsyncThunk(
  'auth/fetchUser',
  async (telegramId, { rejectWithValue }) => {
    try {
      const response = await authAPI.getUser(telegramId);
      return response.user;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  'auth/completeOnboarding',
  async (telegramId, { rejectWithValue }) => {
    try {
      await authAPI.completeOnboarding(telegramId);
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    subscription: 'free' // for backwards compatibility
  },
  reducers: {
    login: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.subscription = 'free';
      state.error = null;
    },
    updateSubscription: (state, action) => {
      state.subscription = action.payload;
      if (state.user) {
        state.user.subscription = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserSubscription: (state, action) => {
      if (state.user) {
        state.user.subscription = action.payload;
      }
    },
    updateUserUsage: (state, action) => {
      if (state.user) {
        state.user.usage = { ...state.user.usage, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      // Fetch user
      .addCase(fetchUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch user data';
      })
      // Complete onboarding
      .addCase(completeOnboarding.fulfilled, (state) => {
        if (state.user) {
          state.user.onboardingCompleted = true;
        }
      });
  }
});

export const { login, logout, updateSubscription, clearError, updateUserSubscription, updateUserUsage } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;