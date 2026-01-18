import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://26.120.91.143:4000/api',
    withCredentials: true
});