import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await login(email, password);
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      if (onLoginSuccess) onLoginSuccess();
      navigate('/admin');
    } catch (err: any) {
      setError('Błędny email lub hasło');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2 className="login-title">Logowanie fotografa</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="login-input"
        required
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="login-input"
        required
      />
      {error && <div className="login-error">{error}</div>}
      <button
        type="submit"
        className="login-submit"
      >
        Zaloguj się
      </button>
    </form>
  );
};

export default LoginPage;
