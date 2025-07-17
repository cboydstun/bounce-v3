import { Contact } from "@/types/contact";
import { ProductWithId } from "@/types/product";

// Get date range based on selected period
export function getDateRangeForPeriod(period: string): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  switch (period) {
    case "nextMonth": {
      // Next month based on current year's data
      const nextMonth = now.getMonth() + 1;
      startDate.setMonth(nextMonth, 1);
      endDate.setMonth(nextMonth + 1, 0);
      break;
    }
    case "currentMonth": {
      startDate.setDate(1);
      endDate.setMonth(now.getMonth() + 1, 0);
      break;
    }
    case "last30Days": {
      startDate.setDate(now.getDate() - 30);
      break;
    }
    case "yearToDate": {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case "lastYear": {
      startDate.setFullYear(now.getFullYear() - 1, 0, 1);
      endDate.setFullYear(now.getFullYear() - 1, 11, 31);
      break;
    }
    case "all":
    default: {
      startDate.setFullYear(2000, 0, 1); // Far in the past
      break;
    }
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

// Calculate revenue data
export function calculateRevenueData(
  contacts: Contact[],
  products: ProductWithId[],
  period: string,
) {
  // Group contacts by time period (day, week, month)
  const groupedData = groupByTimePeriod(contacts, period);

  // Calculate revenue for each period
  const revenueByPeriod = Object.entries(groupedData).reduce(
    (acc, [date, periodContacts]) => {
      const periodRevenue = periodContacts.reduce((total, contact) => {
        // Find the product for this contact
        const product = products.find((p) => p.name === contact.bouncer);

        // If product not found, log a warning (but not during tests)
        if (!product) {
          if (process.env.NODE_ENV !== "test") {
            console.warn(`Product not found for bouncer: ${contact.bouncer}`);
          }
          return total;
        }

        // Add the product price to the total
        return total + (product.price.base || 0);
      }, 0);

      acc[date] = periodRevenue;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Format for chart.js
  const sortedDates = Object.keys(revenueByPeriod).sort();
  const data = sortedDates.map((date) => revenueByPeriod[date]);
  const totalRevenue = data.reduce((sum, val) => sum + val, 0);

  return {
    chartData: {
      labels: sortedDates,
      datasets: [
        {
          label: "Revenue",
          data,
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: true,
        },
      ],
    },
    total: totalRevenue,
  };
}

// Group contacts by time period
export function groupContactsByPeriod(contacts: Contact[], period: string) {
  const groupedData = groupByTimePeriod(contacts, period);

  // Format for chart.js
  const sortedDates = Object.keys(groupedData).sort();

  // Count statuses for each date
  const statusCounts = sortedDates.map((date) => {
    const dateContacts = groupedData[date];

    // Count each status type, handling both string and boolean values
    const confirmed = dateContacts.filter((contact) => {
      if (typeof contact.confirmed === "boolean") {
        return contact.confirmed === true;
      } else {
        return contact.confirmed === "Confirmed";
      }
    }).length;

    const pending = dateContacts.filter((contact) => {
      if (typeof contact.confirmed === "boolean") {
        return contact.confirmed === false;
      } else {
        return contact.confirmed === "Pending";
      }
    }).length;

    const calledTexted = dateContacts.filter(
      (contact) => contact.confirmed === "Called / Texted",
    ).length;

    const declined = dateContacts.filter(
      (contact) => contact.confirmed === "Declined",
    ).length;

    const cancelled = dateContacts.filter(
      (contact) => contact.confirmed === "Cancelled",
    ).length;

    const converted = dateContacts.filter(
      (contact) => contact.confirmed === "Converted",
    ).length;

    return {
      total: dateContacts.length,
      confirmed,
      pending,
      calledTexted,
      declined,
      cancelled,
      converted,
    };
  });

  return {
    chartData: {
      labels: sortedDates,
      datasets: [
        {
          label: "Confirmed",
          data: statusCounts.map((counts) => counts.confirmed),
          backgroundColor: "#10B981", // Green
        },
        {
          label: "Pending",
          data: statusCounts.map((counts) => counts.pending),
          backgroundColor: "#FBBF24", // Yellow
        },
        {
          label: "Called/Texted",
          data: statusCounts.map((counts) => counts.calledTexted),
          backgroundColor: "#3B82F6", // Blue
        },
        {
          label: "Declined",
          data: statusCounts.map((counts) => counts.declined),
          backgroundColor: "#EF4444", // Red
        },
        {
          label: "Cancelled",
          data: statusCounts.map((counts) => counts.cancelled),
          backgroundColor: "#6B7280", // Gray
        },
        {
          label: "Converted",
          data: statusCounts.map((counts) => counts.converted),
          backgroundColor: "#8B5CF6", // Purple
        },
      ],
    },
  };
}

// Calculate product popularity
export function calculateProductPopularity(contacts: Contact[]) {
  // Count occurrences of each product
  const productCounts = contacts.reduce(
    (acc, contact) => {
      acc[contact.bouncer] = (acc[contact.bouncer] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Sort by popularity (descending)
  const sortedProducts = Object.entries(productCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 10); // Top 10 products

  const labels = sortedProducts.map(([name]) => name);
  const data = sortedProducts.map(([, count]) => count);

  return {
    labels,
    datasets: [
      {
        label: "Bookings",
        data,
        backgroundColor: "#8B5CF6",
      },
    ],
  };
}

// Helper function to group contacts by time period
function groupByTimePeriod(
  contacts: Contact[],
  period: string,
): Record<string, Contact[]> {
  const format = getFormatForPeriod(period);

  return contacts.reduce(
    (acc, contact) => {
      const date = new Date(contact.partyDate);
      const key = format(date);

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(contact);
      return acc;
    },
    {} as Record<string, Contact[]>,
  );
}

// Get date format function based on period
function getFormatForPeriod(period: string): (date: Date) => string {
  switch (period) {
    case "last30Days":
    case "nextMonth":
    case "currentMonth":
      return (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    case "yearToDate":
    case "lastYear":
      return (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    case "all":
      return (date) => `${date.getFullYear()}`;
    default:
      return (date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Calculate conversion rate
export function calculateConversionRate(
  contacts: Contact[],
  confirmedContacts: Contact[],
): number {
  // We now pass in pre-filtered confirmed contacts, so we just calculate the percentage
  return contacts.length > 0
    ? (confirmedContacts.length / contacts.length) * 100
    : 0;
}

// Calculate average order value
export function calculateAOV(
  contacts: Contact[],
  products: ProductWithId[],
): number {
  if (contacts.length === 0) return 0;

  const totalRevenue = contacts.reduce((total, contact) => {
    const product = products.find((p) => p.name === contact.bouncer);
    return total + (product?.price.base || 0);
  }, 0);

  return totalRevenue / contacts.length;
}

// Identify repeat customers
export function identifyRepeatCustomers(contacts: Contact[]): {
  repeatRate: number;
  repeatCustomers: Record<string, number>;
} {
  // Group contacts by email
  const customerContacts: Record<string, Contact[]> = {};

  contacts.forEach((contact) => {
    if (!customerContacts[contact.email]) {
      customerContacts[contact.email] = [];
    }
    customerContacts[contact.email].push(contact);
  });

  // Count customers with multiple bookings
  const repeatCustomers: Record<string, number> = {};
  let repeatCustomerCount = 0;

  Object.entries(customerContacts).forEach(([email, customerBookings]) => {
    if (customerBookings.length > 1) {
      repeatCustomers[email] = customerBookings.length;
      repeatCustomerCount++;
    }
  });

  // Calculate repeat rate
  const totalCustomers = Object.keys(customerContacts).length;
  const repeatRate =
    totalCustomers > 0 ? (repeatCustomerCount / totalCustomers) * 100 : 0;

  return { repeatRate, repeatCustomers };
}

// Generate revenue forecast using simple moving average
export function generateRevenueForecast(
  historicalContacts: Contact[],
  products: ProductWithId[],
  forecastPeriod: number = 3, // Default to 3 periods ahead
): { dates: string[]; values: number[] } {
  // Group contacts by month
  const revenueByMonth: Record<string, number> = {};

  historicalContacts.forEach((contact) => {
    const date = new Date(contact.partyDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!revenueByMonth[monthKey]) {
      revenueByMonth[monthKey] = 0;
    }

    const product = products.find((p) => p.name === contact.bouncer);
    revenueByMonth[monthKey] += product?.price.base || 0;
  });

  // Convert to arrays for processing
  const sortedMonths = Object.keys(revenueByMonth).sort();
  const revenues = sortedMonths.map((month) => revenueByMonth[month]);

  // Need at least 3 months of data for forecasting
  if (revenues.length < 3) {
    return { dates: sortedMonths, values: revenues };
  }

  // Simple moving average for forecasting
  const windowSize = 3; // Use last 3 months for average
  const lastValues = revenues.slice(-windowSize);
  const average = lastValues.reduce((sum, val) => sum + val, 0) / windowSize;

  // Generate forecast dates
  const forecastDates: string[] = [];
  const forecastValues: number[] = [];

  const lastDate = new Date(sortedMonths[sortedMonths.length - 1] + "-01");

  for (let i = 1; i <= forecastPeriod; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    const forecastMonthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`;

    forecastDates.push(forecastMonthKey);
    forecastValues.push(average);
  }

  return {
    dates: [...sortedMonths, ...forecastDates],
    values: [...revenues, ...forecastValues],
  };
}

// Analyze seasonal trends
export function analyzeSeasonalTrends(
  contacts: Contact[],
  period: "weekly" | "monthly" | "quarterly" = "monthly",
): Record<string, number> {
  const trendsData: Record<string, number> = {};

  contacts.forEach((contact) => {
    const date = new Date(contact.partyDate);
    let key: string;

    switch (period) {
      case "weekly":
        // Get week number (0-51)
        const weekNum = Math.floor((date.getDate() - 1) / 7);
        key = `Week ${weekNum + 1}`;
        break;
      case "monthly":
        // Month name
        key = date.toLocaleString("default", { month: "long" });
        break;
      case "quarterly":
        // Quarter (Q1-Q4)
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `Q${quarter}`;
        break;
    }

    if (!trendsData[key]) {
      trendsData[key] = 0;
    }

    trendsData[key]++;
  });

  return trendsData;
}

// Calculate year-over-year growth
export function calculateYoYGrowth(
  currentPeriodContacts: Contact[],
  previousPeriodContacts: Contact[],
  products: ProductWithId[],
): number {
  // Calculate revenue for current period
  const currentRevenue = currentPeriodContacts.reduce((total, contact) => {
    const product = products.find((p) => p.name === contact.bouncer);
    return total + (product?.price.base || 0);
  }, 0);

  // Calculate revenue for previous period
  const previousRevenue = previousPeriodContacts.reduce((total, contact) => {
    const product = products.find((p) => p.name === contact.bouncer);
    return total + (product?.price.base || 0);
  }, 0);

  // Calculate growth rate
  if (previousRevenue === 0) return 100; // If no previous revenue, consider it 100% growth

  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}
