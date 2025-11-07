import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { X, Send, User, Bot, Loader } from 'lucide-react';

interface GeminiChatProps {
    onClose: () => void;
    status: {
        daysIn: number;
        daysNeeded: number;
    };
    calculationDate: string;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const GeminiChat: React.FC<GeminiChatProps> = ({ onClose, status, calculationDate }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            if (!process.env.API_KEY) {
                console.error("API_KEY is not set.");
                setMessages([{ role: 'model', text: 'Ошибка: Ключ API не настроен. Пожалуйста, убедитесь, что переменная окружения API_KEY установлена.' }]);
                return;
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const formattedDate = new Date(calculationDate).toLocaleDateString('ru-RU');
            
            const chatInstance = ai.chats.create({
                model: 'gemini-2.5-flash-lite',
                config: {
                    systemInstruction: `Ты — полезный ассистент для человека, который живет в Грузии и отслеживает дни пребывания для ВНЖ.
                    Пользователь производит расчеты на дату: ${formattedDate}.
                    Текущий статус пользователя на эту дату: он провел ${status.daysIn} дней в Грузии за предшествующий год и ему нужно пробыть еще ${status.daysNeeded} дней.
                    Отвечай на вопросы в этом контексте. Будь кратким и полезным. Всегда отвечай на русском языке.`,
                },
            });
            setChat(chatInstance);
            setMessages([
              { role: 'model', text: `Привет! Я ваш AI-помощник. Статус рассчитан на ${formattedDate}. Чем могу помочь? Например, вы можете спросить "Куда поехать в Грузии на ${status.daysNeeded > 0 ? status.daysNeeded : 7} дней?"` }
            ]);
        } catch (error) {
            console.error("Failed to initialize Gemini AI:", error);
            setMessages([{ role: 'model', text: 'Не удалось инициализировать AI ассистента. Проверьте консоль для деталей.' }]);
        }
    }, [status.daysIn, status.daysNeeded, calculationDate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chat.sendMessageStream({ message: input });
            let text = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of result) {
                text += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: text };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending message to Gemini:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'К сожалению, произошла ошибка при обработке вашего запроса.' }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, chat, isLoading]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] max-h-[700px] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Bot className="text-indigo-500" />
                        AI Ассистент
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <X size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-indigo-500" /></div>}
                            <div className={`max-w-[80%] rounded-xl px-4 py-2 ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0"><User size={18} /></div>}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0"><Bot size={18} className="text-indigo-500" /></div>
                            <div className="max-w-[80%] rounded-xl px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-bl-none">
                                <Loader className="animate-spin h-5 w-5 text-slate-500" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <footer className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Спросите что-нибудь..."
                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-900"
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 bg-indigo-600 text-white rounded-lg disabled:bg-indigo-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors">
                            <Send size={18} />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default GeminiChat;