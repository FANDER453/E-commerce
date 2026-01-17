import React from 'react';
import cl from './button1.module.css'

const Button1 = ({children, ...props}) => {
    return (
        <button className={'btt'}>
            {children}
        </button>
    );
};

export default Button1;