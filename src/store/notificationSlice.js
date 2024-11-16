// // store/notificationSlice.js
// import { createSlice } from '@reduxjs/toolkit';

// const notificationSlice = createSlice({
//   name: 'notifications',
//   initialState: [],
//   reducers: {
//     setNotifications: (state, action) => {
//       return action.payload; // Set notifications state with the payload (array of notifications)
//     },
//     markAsRead: (state, action) => {
//       const notificationId = action.payload;
//       const notification = state.find(notif => notif._id === notificationId);
//       if (notification) {
//         notification.read = true; // Mark notification as read
//       }
//     },
//   },
// });

// export const { setNotifications, addNotification, markAsRead } = notificationSlice.actions;
// export default notificationSlice.reducer;
