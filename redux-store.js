import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';

// Import reducers
import authReducer from './slices/authSlice';
import coursesReducer from './slices/coursesSlice';
import enrollmentsReducer from './slices/enrollmentsSlice';
import analyticsReducer from './slices/analyticsSlice';
import gamificationReducer from './slices/gamificationSlice';
import webinarReducer from './slices/webinarSlice';
import learningPathReducer from './slices/learningPathSlice';
import contentReducer from './slices/contentSlice';
import notificationReducer from './slices/notificationSlice';
import userReducer from './slices/userSlice';
import uiReducer from './slices/uiSlice';

// Configuration for redux-persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only auth and UI preferences are persisted
  blacklist: ['enrollments', 'courses', 'analytics', 'content', 'notifications']
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  courses: coursesReducer,
  enrollments: enrollmentsReducer,
  analytics: analyticsReducer,
  gamification: gamificationReducer,
  webinars: webinarReducer,
  learningPaths: learningPathReducer,
  content: contentReducer,
  notifications: notificationReducer,
  users: userReducer,
  ui: uiReducer
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific paths
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['notifications']
      }
    }).concat(thunk),
  devTools: process.env.NODE_ENV !== 'production'
});

// Create persisted store
const persistor = persistStore(store);

// Setup hot module replacement for reducers in development
if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./slices/authSlice', () => {
    store.replaceReducer(persistedReducer);
  });
}

export { store, persistor };
