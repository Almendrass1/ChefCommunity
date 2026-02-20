import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmación Requerida",
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    type = 'danger'
}) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`bg-white dark:bg-[#221810] border-4 ${isSuccess ? 'border-retro-green' : 'border-black dark:border-[#5D4037]'} p-6 rounded-xl shadow-retro-lg max-w-sm w-full relative`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#5D4037] hover:text-red-500"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="text-center mb-6">
                    {isSuccess && (
                        <div className="w-16 h-16 bg-retro-green text-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black shadow-retro-sm">
                            <span className="material-symbols-outlined text-4xl">check</span>
                        </div>
                    )}
                    <h3 className={`text-2xl font-bold uppercase mb-2 ${isSuccess ? 'text-retro-green' : 'text-primary'}`}>
                        {title}
                    </h3>
                    <p className="font-mono text-sm text-[#5D4037] dark:text-[#b9a89d]">
                        {message}
                    </p>
                </div>

                <div className="flex gap-4 pt-2">
                    {!isSuccess && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-black font-bold py-2 px-4 rounded border-2 border-black uppercase"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            if (isSuccess) onClose();
                        }}
                        className={`flex-1 font-bold py-2 px-4 rounded border-2 border-black uppercase shadow-retro-sm active:translate-y-0.5 active:shadow-none text-white
                            ${isSuccess ? 'bg-retro-green hover:bg-green-700' : 'bg-primary hover:bg-[#d95d00]'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
