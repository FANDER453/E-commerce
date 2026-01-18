import React from 'react';
import {api} from "../api";

const LoginPage = () => {

     async function login() {
        const response = await api.post('/auth/login',{
            name: 'saber3',
            password: '123456'
        })
            .then(response => {
                if (response.data.accessToken) {
                    localStorage.setItem('accessToken', response.data.accessToken);
                }
                if (response.data.success) {
                console.log('zaebis')
         }})
            .catch(error => console.log(error))

    }


    return (
        <div>
            <button onClick={login}>gffgfg</button>
        </div>
    );
};

export default LoginPage;