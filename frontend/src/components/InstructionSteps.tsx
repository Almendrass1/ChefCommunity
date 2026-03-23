import React from 'react';

interface Step {
    step?: number;
    title?: string;
    text: string;
    image_url?: string;
}

interface InstructionStepsProps {
    steps?: Step[];
    formattedInstructions: Step[];
}

const InstructionSteps: React.FC<InstructionStepsProps> = ({ steps, formattedInstructions }) => {

    return (
        <div className="space-y-12">
            {steps && steps.length > 0 ? (
                steps.map((step, idx) => (
                    <div key={`step-${idx}`} className="group relative">
                        <div className="flex flex-col md:flex-row gap-8 items-start bg-[#fef9c3] p-2">
                            {/* Content */}
                            <div className="grow space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="flex-none w-10 h-10 bg-black text-white font-mono font-bold flex items-center justify-center rounded-lg shadow-retro-sm">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </span>
                                    <div className="h-0.5 bg-black/10 grow"></div>
                                </div>
                                <p className="text-lg leading-relaxed dark:text-black font-medium pl-2">
                                    {step.text}
                                </p>
                            </div>

                            {/* Image */}
                            {step.image_url && (
                                <div className="w-full md:w-1/4 shrink-0">
                                    <div className="relative aspect-video md:aspect-square overflow-hidden rounded-xl border-2">
                                        <img
                                            src={step.image_url}
                                            alt={`Paso ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {idx < steps.length - 1 && (
                            <div className="absolute left-5 top-12 bottom-0 w-px bg-white/10 dark:bg-gray-800 -z-10 hidden md:block border-l border-dashed"></div>
                        )}
                    </div>
                ))
            ) : (
                <div className="space-y-6">
                    {formattedInstructions.map((step, i) => (
                        <div key={`formatted-step-${i}`} className="group relative bg-[#3d2a24] text-[#fff8e1] border-2 border-[#181411] dark:border-[#5D4037] rounded-xl p-6 shadow-retro hover:translate-y-[-2px] hover:shadow-retro-lg transition-all duration-300">
                            <div className="absolute -left-3 -top-3 w-10 h-10 bg-primary border-2 border-black text-white font-bold text-xl flex items-center justify-center rounded-lg shadow-sm z-10">
                                {step.step || i + 1}
                            </div>
                            <div className="ml-4">
                                <h4 className="text-xl font-bold mb-2 text-[#ff8e3c]">{step.title || `Paso ${i + 1}`}</h4>
                                <p className="text-[#fff8e1] leading-relaxed font-medium">
                                    {step.text}
                                </p>
                            </div>
                        </div>
                    ))}
                    
                </div>
            )}
        </div>
    );
};

export default InstructionSteps;
