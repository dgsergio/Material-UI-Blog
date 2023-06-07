import {
  createSlice,
  configureStore,
  PayloadAction,
  Dispatch,
} from '@reduxjs/toolkit';

const initialState: PostsState = {
  posts: [],
  searchedPosts: undefined,
  status: { loading: false, error: '' },
};

const postsSlice = createSlice({
  name: 'postsState',
  initialState,
  reducers: {
    populate(state, action: PayloadAction<PostType[]>) {
      state.posts = action.payload;
    },
    addPost(state, action: PayloadAction<PostType>) {
      const postExist = state.posts.find(
        (post) => post.id === action.payload.id
      );
      if (postExist)
        state.posts = state.posts.map((post) =>
          post.id === action.payload.id ? action.payload : post
        );
      else state.posts.push(action.payload);
    },
    delPost(state, action: PayloadAction<string>) {
      state.posts = state.posts.filter((post) => post.id !== action.payload);
    },
    searchPosts(state, action: PayloadAction<string>) {
      if (action.payload === '') {
        state.searchedPosts = undefined;
      } else {
        state.searchedPosts = state.posts.filter((post) =>
          post.title.toLowerCase().includes(action.payload)
        );
      }
    },
    resetSearch(state) {
      state.searchedPosts = undefined;
    },
    changeStatus(state, action: PayloadAction<Status>) {
      state.status = action.payload;
    },
  },
});

export const {
  populate,
  addPost,
  delPost,
  searchPosts,
  resetSearch,
  changeStatus,
} = postsSlice.actions;

export const store = configureStore({
  reducer: postsSlice.reducer,
});

export const sendPost = (post: PostType) => {
  return async (dispatch: Dispatch) => {
    const { id, ...postNoId } = post;
    try {
      dispatch(changeStatus({ loading: true, error: '' }));
      const response = await fetch(
        import.meta.env.VITE_FIREBASE_URL + 'posts.json',
        {
          method: 'POST',
          body: JSON.stringify(postNoId),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) throw new Error('Something went wrong');
      const data = await response.json();
      dispatch(addPost({ id: data.name, ...postNoId }));
      dispatch(changeStatus({ loading: false, error: '' }));
    } catch (err: any) {
      dispatch(
        changeStatus({
          loading: false,
          error: 'Error sending post: ' + err.message,
        })
      );
    }
  };
};

export const getPosts = (
  transformData: (data: PostTypeAPI) => Promise<PostType[]>
) => {
  return async (dispatch: Dispatch) => {
    try {
      dispatch(changeStatus({ loading: true, error: '' }));
      const response = await fetch(
        import.meta.env.VITE_FIREBASE_URL + 'posts.json'
      );
      if (!response.ok) throw new Error('Something went wrong');
      const data = await response.json();
      const posts = await transformData(data);
      dispatch(changeStatus({ loading: false, error: '' }));
      dispatch(populate(posts));
    } catch (err: any) {
      dispatch(
        changeStatus({ loading: false, error: 'Fail to fetch: ' + err.message })
      );
    }
  };
};

export type AppDispatch = typeof store.dispatch;
