import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="mt-auto bg-[#181411] border-t-4 border-[#392f28] py-8 w-full">
            <div className="px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-3 text-white/50">
                    <span translate="no" className="material-symbols-outlined notranslate text-3xl">local_dining</span>
                    <span className="font-display font-bold text-xl uppercase tracking-widest">ChefCommunity</span>
                </div>
                <div className="flex gap-8 text-sm font-mono text-[#b9a89d]">
                    <a className="hover:text-primary hover:underline" href="#">TÉRMINOS</a>
                    <a className="hover:text-primary hover:underline" href="#">PRIVACIDAD</a>
                    <a className="hover:text-primary hover:underline" href="#">SOPORTE</a>
                </div>
                <div className="text-secondary text-xs font-mono">
                    © Mariana Almendras Fuentes.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
