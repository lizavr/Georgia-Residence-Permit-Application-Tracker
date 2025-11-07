import { Trip } from './types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function parseDateAsUTC(dateString: string): Date {
    if (!dateString) {
        // Return a default or invalid date to handle empty strings gracefully
        return new Date(NaN);
    }
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

export function formatUTCDateAsDMY(date: Date): string {
    if (isNaN(date.getTime())) return '';
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}.${month}.${year}`;
}


function calculateDaysOutInWindow(windowStart: Date, windowEnd: Date, trips: Trip[]): number {
    let totalDaysOut = 0;

    for (const trip of trips) {
        if (!trip.departure || !trip.arrival) continue;
        
        const tripStart = parseDateAsUTC(trip.departure);
        const tripEnd = parseDateAsUTC(trip.arrival);

        const intersectionStart = new Date(Math.max(windowStart.getTime(), tripStart.getTime()));
        const intersectionEnd = new Date(Math.min(windowEnd.getTime(), tripEnd.getTime()));

        if (intersectionEnd > intersectionStart) {
            const durationMs = intersectionEnd.getTime() - intersectionStart.getTime();
            totalDaysOut += durationMs / MS_PER_DAY;
        }
    }
    return totalDaysOut;
}

export function calculateCurrentStatus(trips: Trip[], calculationDateStr: string) {
    const calculationDate = parseDateAsUTC(calculationDateStr);
    if (isNaN(calculationDate.getTime())) {
        return { daysIn: 0, daysNeeded: 183 }; // Return default state if date is invalid
    }
    
    // The window ends on the calculationDate. To make the range inclusive, we use the next day as the exclusive end.
    const windowEndExclusive = new Date(calculationDate.getTime());
    windowEndExclusive.setUTCDate(windowEndExclusive.getUTCDate() + 1);
    
    // The window starts one year before the calculationDate, plus one day.
    // E.g., for Nov 6, 2025, the window starts on Nov 7, 2024.
    const windowStart = new Date(calculationDate.getTime());
    windowStart.setUTCFullYear(windowStart.getUTCFullYear() - 1);
    windowStart.setUTCDate(windowStart.getUTCDate() + 1);

    // The period can be 365 or 366 days.
    const periodLengthDays = Math.round((windowEndExclusive.getTime() - windowStart.getTime()) / MS_PER_DAY);

    const daysOut = calculateDaysOutInWindow(windowStart, windowEndExclusive, trips);
    const daysIn = periodLengthDays - daysOut;
    const daysNeeded = 183 - daysIn;

    return { 
        daysIn: Math.floor(daysIn), 
        daysNeeded: daysNeeded > 0 ? Math.ceil(daysNeeded) : 0 
    };
}

export function checkDepartureSafety(desiredDepartureDate: string, trips: Trip[]): boolean {
    if (!desiredDepartureDate) return true;

    try {
        const departureDate = parseDateAsUTC(desiredDepartureDate);
        if (isNaN(departureDate.getTime())) return false;

        // An arbitrarily long hypothetical trip to simulate being out of the country indefinitely.
        const farFutureDate = new Date(departureDate.getTime());
        farFutureDate.setUTCFullYear(farFutureDate.getUTCFullYear() + 2);

        const hypotheticalTrip: Trip = {
            id: 'hypothetical',
            departure: desiredDepartureDate,
            arrival: farFutureDate.toISOString().split('T')[0],
        };

        const allTrips = [...trips, hypotheticalTrip];

        // We need to check every day for a year after departure to ensure no future violation occurs.
        // Looping 366 days ensures we cover all possible windows in the next year.
        for (let i = 0; i < 366; i++) {
            const checkDate = new Date(departureDate.getTime() + i * MS_PER_DAY);
            
            const windowEndExclusive = new Date(checkDate.getTime());
            windowEndExclusive.setUTCDate(windowEndExclusive.getUTCDate() + 1);

            const windowStart = new Date(checkDate.getTime());
            windowStart.setUTCFullYear(windowStart.getUTCFullYear() - 1);
            windowStart.setUTCDate(windowStart.getUTCDate() + 1);
            
            const periodLengthDays = Math.round((windowEndExclusive.getTime() - windowStart.getTime()) / MS_PER_DAY);

            const daysOut = calculateDaysOutInWindow(windowStart, windowEndExclusive, allTrips);
            const daysIn = periodLengthDays - daysOut;

            if (daysIn < 183) {
                return false; // Found a future window where the rule is violated.
            }
        }
        return true; // No violations found for a year after departure.
    } catch (error) {
        console.error("Error checking departure safety:", error);
        return false;
    }
}