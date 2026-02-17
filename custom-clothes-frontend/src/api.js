import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://26.2.82.95:4000/api',
    withCredentials: true
});

// вова чорт