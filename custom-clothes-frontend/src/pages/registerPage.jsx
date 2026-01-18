import React from 'react';
import axios from 'axios';
import {api} from "../api";



const RegisterPage = () => {

    async function register() {

        await api.post('auth/registration', {
            name: "saber11",
            password: "123456",
            email: "saber11@gmail.com"
        })
        // try {
        //     const res = await api.get('/auth/d');
        //     console.log(res.data);
        // } catch (err) {
        //     console.error(err);
        // }
    }

    return (
        <div>
            <button onClick={register}>xui</button>
        </div>
    );
};

export default RegisterPage;