"use client";

interface PopupSurveyProps {
    show: boolean;
    guestName: string;
    onClose: () => void;
    onSubmit: (rating: string) => void;
}

export default function PopupSurvey({ show, guestName, onClose, onSubmit }: PopupSurveyProps) {
    if (!show) return null;

    return (
        <div className="fixed flex inset-0 bg-slate-900/60 backdrop-blur-sm items-center justify-center z-[9999]">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-[90%] max-w-[450px] relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
                
                <div className="text-slate-600 font-medium mb-1">Hay, <span className="text-slate-900 font-bold">{guestName}</span> 👋</div>
                <h2 className="text-slate-900 text-xl font-bold mb-8">Berikan penilaian Anda untuk Kami</h2>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    onSubmit(formData.get('rating') as string);
                }}>
                    <div className="flex justify-center gap-6 mb-8">
                        {[
                            { value: "1", emoji: "😞", text: "Tidak Puas" },
                            { value: "2", emoji: "😐", text: "Puas" },
                            { value: "3", emoji: "😄", text: "Sangat Puas" }
                        ].map((opt) => (
                            <label key={opt.value} className="cursor-pointer group flex flex-col items-center gap-3">
                                <input type="radio" name="rating" value={opt.value} required className="hidden peer" />
                                <div className="text-5xl transition-all duration-300 p-2 rounded-2xl peer-checked:scale-125 peer-checked:bg-slate-50 peer-checked:grayscale-0 peer-checked:opacity-100 grayscale opacity-50 group-hover:opacity-80 group-hover:scale-110 group-hover:bg-slate-50">
                                    {opt.emoji}
                                </div>
                                <span className="text-sm font-medium transition-colors text-slate-500 peer-checked:text-emerald-600 peer-checked:font-bold">{opt.text}</span>
                            </label>
                        ))}
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold text-base px-5 py-4 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">
                        Kirim Penilaian Pelayanan
                    </button>
                </form>
            </div>
        </div>
    );
}