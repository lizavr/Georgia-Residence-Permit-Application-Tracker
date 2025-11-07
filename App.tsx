import React, { useState, useEffect } from 'react';
import { Trip } from './types';
import { calculateCurrentStatus, checkDepartureSafety } from './utils/dateUtils';
import Header from './components/Header';
import TripForm from './components/TripForm';
import TripList from './components/TripList';
import Summary from './components/Summary';
import GeminiChat from './components/GeminiChat';
import { Bot } from 'lucide-react';

const App: React.FC = () => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [desiredDepartureDate, setDesiredDepartureDate] = useState<string>('');
    const [calculationDate, setCalculationDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [isChatOpen, setChatOpen] = useState<boolean>(false);

    useEffect(() => {
        try {
            const storedTrips = localStorage.getItem('residence-trips');
            if (storedTrips) {
                setTrips(JSON.parse(storedTrips));
            }
        } catch (error) {
            console.error("Failed to parse trips from localStorage", error);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('residence-trips', JSON.stringify(trips));
    }, [trips]);

    const addTrips = (tripsToAdd: Omit<Trip, 'id'>[]) => {
        if (tripsToAdd.length === 0) return;
        const newTripsWithIds = tripsToAdd.map((trip, index) => ({
            ...trip,
            id: `${Date.now()}-${index}`
        }));
        setTrips(prevTrips => [...prevTrips, ...newTripsWithIds].sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime()));
    };

    const deleteTrip = (id: string) => {
        setTrips(prevTrips => prevTrips.filter(trip => trip.id !== id));
    };

    const currentStatus = calculateCurrentStatus(trips, calculationDate);

    const isDepartureSafe = desiredDepartureDate ? checkDepartureSafety(desiredDepartureDate, trips) : null;

    const handleDepartureDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDesiredDepartureDate(e.target.value);
    };
    
    const handleCalculationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCalculationDate(e.target.value);
    };

    return (
        <div className="min-h-screen font-sans">
            <Header />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 border-b-2 border-slate-200 dark:border-slate-700 pb-2">Поездки за пределы Грузии</h2>
                        <TripForm addTrips={addTrips} />
                        <TripList trips={trips} deleteTrip={deleteTrip} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-6">
                        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 border-b-2 border-slate-200 dark:border-slate-700 pb-2">Сводка и планирование</h2>
                        <Summary
                            status={currentStatus}
                            desiredDepartureDate={desiredDepartureDate}
                            onDateChange={handleDepartureDateChange}
                            isDepartureSafe={isDepartureSafe}
                            calculationDate={calculationDate}
                            onCalculationDateChange={handleCalculationDateChange}
                        />
                    </div>
                </div>
            </main>

            <button
                onClick={() => setChatOpen(true)}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-110"
                aria-label="Открыть AI ассистента"
            >
                <Bot size={24} />
            </button>

            {isChatOpen && <GeminiChat status={currentStatus} calculationDate={calculationDate} onClose={() => setChatOpen(false)} />}
        </div>
    );
};

export default App;