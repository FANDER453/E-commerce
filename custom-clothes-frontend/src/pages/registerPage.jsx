import React from 'react';

import {api} from "../api";



const RegisterPage = () => {

    async function register() {

        await api.post('auth/registration', {
            name: "saber3",
            password: "123456",
            email: "saber3@gmail.com"

        })
            .then(response => console.log(response.data))
            .catch(error => console.log(error))
    }

    return (
        <div>
            <button onClick={register}>xui</button>
        </div>
    );
};

export default RegisterPage;