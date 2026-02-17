import axios from 'axios'
import {api} from "../api";

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

export const AccessRefresh = async (statusCode, func) => {
    if (statusCode === '401'){
        console.log('gjfg')
        await api.post('/auth/refresh', {})
            .then(response => {
                console.log(response)
                localStorage.setItem('accessToken', response.data.accessToken)
                console.log(localStorage)
            })
    }func()
}



