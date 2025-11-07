import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { parseDateAsUTC, formatUTCDateAsDMY } from '../utils/dateUtils';

interface SummaryProps {
    status: {
        daysIn: number;
        daysNeeded: number;
    };
    desiredDepartureDate: string;
    onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDepartureSafe: boolean | null;
    calculationDate: string;
    onCalculationDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SummaryCard: React.FC<{ title: string, value: string | number, colorClass: string }> = ({ title, value, colorClass }) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-center shadow-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
);


const Summary: React.FC<SummaryProps> = ({ status, desiredDepartureDate, onDateChange, isDepartureSafe, calculationDate, onCalculationDateChange }) => {
    
    const formattedDate = formatUTCDateAsDMY(parseDateAsUTC(calculationDate));
    
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-600 dark:text-slate-300">
                    Статус на {formattedDate}
                </h3>
                <div className="mb-4">
                     <label htmlFor="calculation-date" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Выбрать дату для расчета
                    </label>
                    <input
                        type="date"
                        id="calculation-date"
                        value={calculationDate}
                        onChange={onCalculationDateChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-slate-700"
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <SummaryCard title="Проведено в Грузии" value={status.daysIn} colorClass="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    *Количество дней, проведенных в Грузии за 365-дневный период, заканчивающийся выбранной датой. Для соблюдения правил ВНЖ необходимо не менее 183 дней.
                </p>
            </div>
            
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-3 text-slate-600 dark:text-slate-300">Планировщик выезда</h3>
                <div>
                    <label htmlFor="departure-check" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Если я хочу выехать...
                    </label>
                    <input
                        type="date"
                        id="departure-check"
                        value={desiredDepartureDate}
                        onChange={onDateChange}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-slate-700"
                    />
                </div>
                {isDepartureSafe !== null && (
                    <div className={`mt-4 p-4 rounded-lg flex items-start space-x-3 ${isDepartureSafe ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                        {isDepartureSafe ? <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />}
                        <div>
                            <h4 className="font-bold">{isDepartureSafe ? 'Безопасно для выезда' : 'Выезд рискован'}</h4>
                            <p className="text-sm">
                                {isDepartureSafe 
                                    ? 'Выезд в указанную дату не нарушит условия ВНЖ в течение следующего года.' 
                                    : 'Выезд в эту дату может привести к нарушению правила 183 дней и риску аннулирования ВНЖ.'}
                            </p>
                        </div>
                    </div>
                )}
                 {isDepartureSafe === null && desiredDepartureDate && (
                    <div className="mt-4 p-4 rounded-lg flex items-start space-x-3 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                        <AlertTriangle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold">Расчет...</h4>
                            <p className="text-sm">Проверяем выбранную дату...</p>
                        </div>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default Summary;