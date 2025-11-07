import React from 'react';
import { Trip } from '../types';
import { Trash2, Plane } from 'lucide-react';
import { parseDateAsUTC, formatUTCDateAsDMY } from '../utils/dateUtils';

interface TripListProps {
    trips: Trip[];
    deleteTrip: (id: string) => void;
}

const TripList: React.FC<TripListProps> = ({ trips, deleteTrip }) => {
    if (trips.length === 0) {
        return (
            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">Здесь будет список ваших поездок.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {trips.map(trip => {
                const departureDate = parseDateAsUTC(trip.departure);
                const arrivalDate = parseDateAsUTC(trip.arrival);
                const duration = !isNaN(departureDate.getTime()) && !isNaN(arrivalDate.getTime())
                    ? Math.round((arrivalDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                return (
                    <div key={trip.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3">
                            <Plane className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="font-semibold text-slate-700 dark:text-slate-200">
                                    {formatUTCDateAsDMY(departureDate)} - {formatUTCDateAsDMY(arrivalDate)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {duration} дней отсутствия
                                </p>
                            </div>
                        </div>
                        <button onClick={() => deleteTrip(trip.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800">
                            <Trash2 size={18} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default TripList;