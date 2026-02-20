import { useState } from 'react';

interface LoginProps {
    onLogin: (data: any) => void;
    onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data);
            } else {
                setError(data.error || 'Error al iniciar sesión');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
            <div className="bg-white dark:bg-[#221810] border-4 border-black dark:border-[#5D4037] p-8 rounded-xl shadow-retro-lg max-w-md w-full relative overflow-hidden">
                {/* VHS Scanline */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]"></div>

                <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-primary mb-2 glitch-text" data-text="INSERTAR CINTA">INSERTAR CINTA</h2>
                    <p className="font-mono text-[#5D4037] dark:text-[#b9a89d] text-sm tracking-widest">AUTORIZACIÓN REQUERIDA</p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 font-mono text-sm" role="alert">
                        <p className="font-bold">ERROR 401</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div>
                        <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                            ID Operador (Email)
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                            placeholder="chef@comunidad.com"
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">
                            Código de Acceso (Contraseña)
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-[#d95d00] text-white font-bold py-3 px-4 rounded border-2 border-black uppercase tracking-widest shadow-retro-sm active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">play_arrow</span>
                                Iniciar Sesión
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t-2 border-dashed border-[#5D4037]/30 pt-6">
                    <p className="font-mono text-xs text-[#5D4037] dark:text-[#b9a89d] mb-3">¿NUEVO USUARIO?</p>
                    <button
                        onClick={onSwitchToRegister}
                        className="text-primary font-bold uppercase text-sm hover:underline tracking-wide decoration-2 underline-offset-4"
                    >
                        Crear Nuevo Perfil
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
