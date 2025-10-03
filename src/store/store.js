import { configureStore } from '@reduxjs/toolkit';
import booksReducer from './slices/booksSlice';
import nashidsReducer from './slices/nashidsSlice';
import authReducer from './slices/authSlice';
import qiblaReducer from './slices/qiblaSlice';
import subscriptionReducer from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    books: booksReducer,
    nashids: nashidsReducer,
    auth: authReducer,
    qibla: qiblaReducer,
    subscription: subscriptionReducer,
  },
});