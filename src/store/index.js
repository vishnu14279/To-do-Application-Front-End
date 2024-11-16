// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import taskReducer from "./taskSlice";
import userReducer from './userSlice'; // Create this slice in Step 2
// import notificationReducer from "./notificationSlice"
const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    user: userReducer,
    // notifications: notificationReducer,

  },
});

export default store;
