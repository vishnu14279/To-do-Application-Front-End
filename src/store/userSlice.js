import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  allUsers: [],
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAllUsers: (state, action) => {
      state.allUsers = action.payload;
    },
  },
});

export const { setAllUsers } = userSlice.actions;

export const selectAllUsers = (state) => state.user.allUsers;

export default userSlice.reducer;
