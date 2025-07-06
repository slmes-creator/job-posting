import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './App.css';

function App() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="AppWrapper">
      <div className="AuthBox">
        <div className="AuthContent">
          <h1 className="AuthHeader">Welcome Back!</h1>
          <input className='AuthInput' type="text" placeholder="Email" />
          <div className='PasswordInputWrapper'>
            <input
              className='AuthInput'
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
            />
            <button
              className='PasswordToggleButton'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>
          <button className='AuthButton'>Login</button>
        </div>
        <div className='AuthFooterRow'>
          <p className='AuthFooter'><a href="#">Forgot Password?</a></p>
          <p className='AuthFooter'><a href="#">Register</a></p>
        </div>
      </div>
    </div>
  )
}

export default App;
