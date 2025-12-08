
import React, { useState, useEffect } from 'react';
import { SystemUser } from '../types';

interface SystemLoginViewProps {
  users: SystemUser[];
  onLogin: (user: SystemUser) => void;
  schoolName: string;
  onGoToPortal?: () => void;
}

export const SystemLoginView: React.FC<SystemLoginViewProps> = ({ users, onLogin, schoolName, onGoToPortal }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
      const saved = localStorage.getItem('cantina_remember_system');
      if (saved) {
          try {
              const { l, p } = JSON.parse(saved);
              setLogin(l);
              setPassword(p);
              setRememberMe(true);
          } catch (e) {
              // Ignore invalid json
          }
      }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Default admin fallback if users array is empty
    if (users.length === 0 && login === 'admin' && password === '123') {
        if (rememberMe) {
            localStorage.setItem('cantina_remember_system', JSON.stringify({ l: login, p: password }));
        } else {
            localStorage.removeItem('cantina_remember_system');
        }
        onLogin({ id: 'admin-default', name: 'Administrador', login: 'admin', role: 'ADMIN' });
        return;
    }

    const user = users.find(u => u.login.toLowerCase() === login.toLowerCase() && u.password === password);
    
    if (user) {
        if (rememberMe) {
            localStorage.setItem('cantina_remember_system', JSON.stringify({ l: login, p: password }));
        } else {
            localStorage.removeItem('cantina_remember_system');
        }
        onLogin(user);
    } else {
        setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-wide">{schoolName || 'Cantina Escolar'}</h1>
            <p className="text-sm text-gray-500 mt-2">Acesso Restrito ao Sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Usuário</label>
                <input 
                    type="text" 
                    autoFocus
                    required
                    className="w-full border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-brand-500 transition-colors"
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                    placeholder="Seu usuário"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        required
                        className="w-full border-2 border-gray-200 rounded-lg p-3 outline-none focus:border-brand-500 transition-colors pr-10"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Sua senha"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                        {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex items-center">
                <input 
                    id="remember-me" 
                    type="checkbox" 
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                    Salvar senha
                </label>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg font-medium text-center">
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg shadow-lg transition-transform active:scale-95"
            >
                ENTRAR
            </button>
        </form>
        
        <div className="mt-8 text-center flex flex-col gap-2">
             {onGoToPortal && (
                <button 
                    type="button"
                    onClick={onGoToPortal}
                    className="text-sm text-brand-600 hover:text-brand-800 font-bold hover:underline"
                >
                    Acesso Portal dos Pais
                </button>
             )}
            <p className="text-xs text-gray-400">
                Caso tenha esquecido sua senha, contate o administrador.
            </p>
        </div>
      </div>
    </div>
  );
};
