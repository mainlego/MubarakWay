import { configureStore } from '@reduxjs/toolkit';
import booksReducer from './slices/booksSlice';
import nashidsReducer from './slices/nashidsSlice';
import authReducer from './slices/authSlice';
import qiblaReducer from './slices/qiblaSlice';

export const store = configureStore({
  reducer: {
    books: booksReducer,
    nashids: nashidsReducer,
    auth: authReducer,
    qibla: qiblaReducer,
  },
});