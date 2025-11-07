import React, { useState, useRef } from 'react';
import { PlusCircle, Trash2, Camera, Loader } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { fileToBase64 } from '../utils/imageUtils';
import { parseDateAsUTC } from '../utils/dateUtils';

interface TripFormProps {
    addTrips: (trips: { departure: string; arrival: string }[]) => void;
}

const TripForm: React.FC<TripFormProps> = ({ addTrips }) => {
    const [trips, setTrips] = useState([{ departure: '', arrival: '' }]);
    const [error, setError] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTripChange = (index: number, field: 'departure' | 'arrival', value: string) => {
        const newTrips = [...trips];
        newTrips[index][field] = value;
        setTrips(newTrips);
        setError(''); // Clear error on change
    };

    const addTripRow = () => {
        setTrips([...trips, { departure: '', arrival: '' }]);
    };

    const removeTripRow = (index: number) => {
        if (trips.length > 1) {
            const newTrips = trips.filter((_, i) => i !== index);
            setTrips(newTrips);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setError('');

        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY is not set.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const base64Data = await fileToBase64(file);
            const mimeType = file.type;

            const imagePart = { inlineData: { data: base64Data, mimeType } };
            const textPart = { text: "Проанализируй это изображение, на котором показан список поездок. Извлеки все даты выезда и въезда. Верни JSON-массив объектов, где каждый объект имеет ключи 'departure' и 'arrival' в формате 'YYYY-MM-DD'. Если даты не найдены, верни пустой массив. Даты должны быть отсортированы по дате выезда." };
            
            const schema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        departure: { type: Type.STRING, description: 'Дата выезда в формате YYYY-MM-DD.' },
                        arrival: { type: Type.STRING, description: 'Дата въезда в формате YYYY-MM-DD.' },
                    },
                    required: ['departure', 'arrival'],
                },
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            const jsonStr = response.text.trim();
            const parsedTrips = JSON.parse(jsonStr) as { departure: string; arrival: string }[];

            if (Array.isArray(parsedTrips) && parsedTrips.length > 0) {
                const validParsedTrips = parsedTrips.filter(t => t.departure && t.arrival);
                const currentFilledTrips = trips.filter(t => t.departure || t.arrival);
                const combinedTrips = [...currentFilledTrips, ...validParsedTrips];
                setTrips(combinedTrips.length > 0 ? combinedTrips : [{ departure: '', arrival: '' }]);
            } else {
                setError('Не удалось найти поездки на скриншоте.');
            }

        } catch (error) {
            console.error("Error parsing screenshot:", error);
            setError('Произошла ошибка при анализе изображения. Пожалуйста, попробуйте еще раз.');
        } finally {
            setIsParsing(false);
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const validTrips: { departure: string; arrival: string }[] = [];
        const filledTrips = trips.filter(t => t.departure || t.arrival);

        if (filledTrips.length === 0) {
            setError('Добавьте хотя бы одну поездку.');
            return;
        }

        for (let i = 0; i < filledTrips.length; i++) {
            const { departure, arrival } = filledTrips[i];

            if (!departure || !arrival) {
                setError(`Заполните обе даты для поездки #${i + 1}.`);
                return;
            }
            if (parseDateAsUTC(departure) >= parseDateAsUTC(arrival)) {
                setError(`Дата выезда для поездки #${i + 1} должна быть раньше даты въезда.`);
                return;
            }
            validTrips.push({ departure, arrival });
        }

        addTrips(validTrips);
        setTrips([{ departure: '', arrival: '' }]);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {trips.map((trip, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                            <div>
                                <label htmlFor={`departure-${index}`} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Дата выезда</label>
                                <input
                                    type="date"
                                    id={`departure-${index}`}
                                    value={trip.departure}
                                    onChange={(e) => handleTripChange(index, 'departure', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-slate-700 text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor={`arrival-${index}`} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Дата въезда</label>
                                <input
                                    type="date"
                                    id={`arrival-${index}`}
                                    value={trip.arrival}
                                    onChange={(e) => handleTripChange(index, 'arrival', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-slate-700 text-sm"
                                />
                            </div>
                        </div>
                        {trips.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeTripRow(index)}
                                className="text-slate-400 hover:text-red-500 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 self-end mb-1 transition-colors"
                                aria-label="Удалить поездку"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <button
                    type="button"
                    onClick={addTripRow}
                    className="w-full flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 py-2 px-4 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600"
                >
                    <PlusCircle size={18} />
                    Добавить вручную
                </button>
                 <button
                    type="button"
                    onClick={handleUploadClick}
                    className="w-full flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 py-2 px-4 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-colors border-2 border-dashed border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-wait"
                    disabled={isParsing}
                >
                    {isParsing ? <Loader size={18} className="animate-spin" /> : <Camera size={18} />}
                    {isParsing ? 'Анализирую...' : 'Загрузить скриншот'}
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                />
            </div>
            
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-colors"
            >
                Добавить поездки
            </button>
        </form>
    );
};

export default TripForm;