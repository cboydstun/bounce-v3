import { Contact } from "@/types/contact";
import { ProductWithId } from "@/types/product";

// Get date range based on selected period
export function getDateRangeForPeriod(period: string): { startDate: string; endDate: string } {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
        case 'nextMonth': {
            // Next month based on previous year's data
            const lastYear = now.getFullYear() - 1;
            const nextMonth = now.getMonth() + 1;
            startDate.setFullYear(lastYear, nextMonth, 1);
            endDate.setFullYear(lastYear, nextMonth + 1, 0);
            break;
        }
        case 'currentMonth': {
            startDate.setDate(1);
            endDate.setMonth(now.getMonth() + 1, 0);
            break;
        }
        case 'last30Days': {
            startDate.setDate(now.getDate() - 30);
            break;
        }
        case 'yearToDate': {
            startDate.setMonth(0, 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        }
        case 'lastYear': {
            startDate.setFullYear(now.getFullYear() - 1, 0, 1);
            endDate.setFullYear(now.getFullYear() - 1, 11, 31);
            break;
        }
        case 'all':
        default: {
            startDate.setFullYear(2000, 0, 1); // Far in the past
            break;
        }
    }

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

// Calculate revenue data
export function calculateRevenueData(
    contacts: Contact[],
    products: ProductWithId[],
    period: string
) {
    // Group contacts by time period (day, week, month)
    const groupedData = groupByTimePeriod(contacts, period);

    // Calculate revenue for each period
    const revenueByPeriod = Object.entries(groupedData).reduce((acc, [date, periodContacts]) => {
        const periodRevenue = periodContacts.reduce((total, contact) => {
            const product = products.find(p => p.name === contact.bouncer);
            return total + (product?.price.base || 0);
        }, 0);

        acc[date] = periodRevenue;
        return acc;
    }, {} as Record<string, number>);

    // Format for chart.js
    const sortedDates = Object.keys(revenueByPeriod).sort();
    const data = sortedDates.map(date => revenueByPeriod[date]);
    const totalRevenue = data.reduce((sum, val) => sum + val, 0);

    return {
        chartData: {
            labels: sortedDates,
            datasets: [{
                label: 'Revenue',
                data,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
            }]
        },
        total: totalRevenue
    };
}

// Group contacts by time period
export function groupContactsByPeriod(contacts: Contact[], period: string) {
    const groupedData = groupByTimePeriod(contacts, period);

    // Format for chart.js
    const sortedDates = Object.keys(groupedData).sort();
    const data = sortedDates.map(date => groupedData[date].length);

    return {
        chartData: {
            labels: sortedDates,
            datasets: [{
                label: 'Bookings',
                data,
                backgroundColor: '#3B82F6',
            }]
        }
    };
}

// Calculate product popularity
export function calculateProductPopularity(contacts: Contact[], products: ProductWithId[]) {
    // Count occurrences of each product
    const productCounts = contacts.reduce((acc, contact) => {
        acc[contact.bouncer] = (acc[contact.bouncer] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Sort by popularity (descending)
    const sortedProducts = Object.entries(productCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 10); // Top 10 products

    const labels = sortedProducts.map(([name]) => name);
    const data = sortedProducts.map(([, count]) => count);

    return {
        labels,
        datasets: [{
            label: 'Bookings',
            data,
            backgroundColor: '#8B5CF6',
        }]
    };
}

// Helper function to group contacts by time period
function groupByTimePeriod(contacts: Contact[], period: string): Record<string, Contact[]> {
    const format = getFormatForPeriod(period);

    return contacts.reduce((acc, contact) => {
        const date = new Date(contact.partyDate);
        const key = format(date);

        if (!acc[key]) {
            acc[key] = [];
        }

        acc[key].push(contact);
        return acc;
    }, {} as Record<string, Contact[]>);
}

// Get date format function based on period
function getFormatForPeriod(period: string): (date: Date) => string {
    switch (period) {
        case 'last30Days':
        case 'nextMonth':
        case 'currentMonth':
            return (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        case 'yearToDate':
        case 'lastYear':
            return (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        case 'all':
            return (date) => `${date.getFullYear()}`;
        default:
            return (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}

// Format currency
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}
