import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    subscription: 'free' // free, pro
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
    },
    updateSubscription: (state, action) => {
      state.subscription = action.payload;
    }
  }
});

export const { login, logout, updateSubscription } = authSlice.actions;
export default authSlice.reducer;