import axios from 'axios';
import {NotFoundError} from "../system/notFoundError";

const API_URL = 'http://localhost:8081/api/v1/posts/';

export const checkPostIdExistence = async (postId: number) => {
  try {
    await axios.get(`${API_URL}${postId}`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        throw new NotFoundError('Post id not found');
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }
};