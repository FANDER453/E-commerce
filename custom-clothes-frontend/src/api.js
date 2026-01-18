import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://26.85.160.87:4000/api',
    withCredentials: true
});