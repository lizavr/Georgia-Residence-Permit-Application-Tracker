
import React from 'react';
import { CalendarDays } from 'lucide-react';

const Header: React.FC = () => {
    return (
        <header className="bg-white dark:bg-slate-800 shadow-md">
            <div className="container mx-auto px-4 py-4 md:px-6 lg:px-8 flex items-center space-x-3">
                 <CalendarDays className="h-8 w-8 text-indigo-600" />
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                    Трекер ВНЖ в Грузии
                </h1>
            </div>
        </header>
    );
};

export default Header;
