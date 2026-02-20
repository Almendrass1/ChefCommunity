import { useState } from 'react';

interface RegisterProps {
    onLogin: (data: any) => void;
    onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onLogin, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        rol: 'aprendiz'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data);
            } else {
                setError(data.error || 'Error al registrarse');
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
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]"></div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-primary mb-2 uppercase tracking-tighter">Formulario de Nuevo Miembro</h2>
                    <p className="font-mono text-[#5D4037] dark:text-[#b9a89d] text-sm tracking-widest">ÚNETE AL CLUB</p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 font-mono text-sm">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div>
                        <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-1 text-[#5D4037] dark:text-[#b9a89d]">Usuario</label>
                        <input
                            name="username"
                            type="text"
                            required
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                            placeholder="ChefMario"
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-1 text-[#5D4037] dark:text-[#b9a89d]">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                            placeholder="mario@chef.co"
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-1 text-[#5D4037] dark:text-[#b9a89d]">Contraseña</label>
                        <input
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-[#f0f0f0] text-black border-2 border-black p-3 font-mono focus:outline-none focus:border-primary focus:shadow-retro-sm transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block font-mono text-xs font-bold uppercase tracking-wider mb-2 text-[#5D4037] dark:text-[#b9a89d]">Rol</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['saludable', 'aprendiz', 'chef'].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rol: r })}
                                    className={`p-2 text-xs font-bold uppercase border-2 border-black dark:border-[#5D4037] transition-all
                    ${formData.rol === r
                                            ? 'bg-primary text-white shadow-retro-sm'
                                            : 'bg-[#f0f0f0] text-black hover:bg-gray-200'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black hover:bg-[#2c241f] text-white font-bold uppercase py-3 border-2 border-transparent hover:border-black transition-all shadow-retro-sm active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Inicializando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-6 text-center border-t-2 border-black/10 dark:border-white/10 pt-4">
                    <p className="text-xs font-mono text-[#5D4037] dark:text-[#b9a89d] mb-2">¿YA REGISTRADO?</p>
                    <button
                        onClick={onSwitchToLogin}
                        className="text-primary font-bold uppercase hover:underline text-sm tracking-widest"
                    >
                        Acceder Terminal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Register;
