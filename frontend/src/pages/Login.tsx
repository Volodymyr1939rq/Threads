import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useCurrentUser } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const {refreshUser}=useCurrentUser()
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Невірний email або password');
            }

            const data = await response.json();
            const token = data.accessToken || data.token?.accessToken || data.token;

            if (!token) {
                throw new Error('Не вдалося отримати токен від сервера');
            }

            Cookies.set("token", token, {
                expires: 7,
                secure: true,
                sameSite: 'Lax'
            });
            await refreshUser()
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Помилка авторизації');
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between items-center relative overflow-hidden">
            <div className="w-full max-w-[370px] flex flex-col items-center mt-40 px-4 gap-4">
                <h2 className="text-white font-semibold">Увійти через Instagram</h2>
                <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
                    <input 
                        type="email"
                        placeholder="Введіть email, номер користувача або телефон"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="off"
                        className="w-full bg-[#1E1E1E] text-white p-4 rounded-xl border border-[#333] placeholder-[#777] focus:border-[#555] focus:outline-none transition-colors"
                        required
                    />

                    <input 
                        type="text"
                        placeholder="Введіть пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="off"
                        data-1p-ignore="true"
                        data-lpignore="true"
                        className="w-full bg-[#1E1E1E] text-white p-4 rounded-xl border border-[#333] placeholder-[#777] focus:border-[#555] focus:outline-none transition-colors [-webkit-text-security:disc]"
                        required
                    />

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button 
                        type="submit" 
                        className="w-full bg-white text-black font-semibold p-4 rounded-xl mt-2 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                        Увійти
                    </button>
                </form>

                <button type="button" className="text-[#777] hover:text-white transition-colors text-sm">
                    Забули пароль?
                </button>
            </div>
        </div>
    );
};

export default Login;