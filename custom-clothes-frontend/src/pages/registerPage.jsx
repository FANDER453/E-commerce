import React from 'react';
import {AccessRefresh} from '../utils/functions'
import {api} from "../api";



const RegisterPage = () => {

    const register = async () => {

        await api.post('auth/registration', {
            name: "saber4",
            password: "123456",
            email: "saber4@gmail.com"

        })
            .then(response => {
                const statusCode = response.status
                console.log(statusCode)
                AccessRefresh(statusCode, register)
            })
            .catch(error => console.log(error))



    }

    return (
        <div>
            <button onClick={register}>xui</button>
            <button onClick={AccessRefresh}>xui1</button>
        </div>
    );
};

export default RegisterPage;