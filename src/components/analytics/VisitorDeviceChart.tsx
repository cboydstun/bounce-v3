"use client"

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface DeviceBreakdown {
    Mobile: number;
    Desktop: number;
    Tablet: number;
    percentages: {
        Mobile: number;
        Desktop: number;
        Tablet: number;
    }
}

interface VisitorDeviceChartProps {
    deviceData: DeviceBreakdown;
}

const VisitorDeviceChart: React.FC<VisitorDeviceChartProps> = ({ deviceData }) => {
    const data = {
        labels: ['Mobile', 'Desktop', 'Tablet'],
        datasets: [
            {
                data: [deviceData.Mobile, deviceData.Desktop, deviceData.Tablet],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const percentage = deviceData.percentages[label as keyof typeof deviceData.percentages].toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
            <div className="h-64">
                <Doughnut data={data} options={options} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-red-50 p-2 rounded">
                    <p className="font-semibold">Mobile</p>
                    <p>{deviceData.percentages.Mobile.toFixed(1)}%</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                    <p className="font-semibold">Desktop</p>
                    <p>{deviceData.percentages.Desktop.toFixed(1)}%</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                    <p className="font-semibold">Tablet</p>
                    <p>{deviceData.percentages.Tablet.toFixed(1)}%</p>
                </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">Business Insight:</p>
                {deviceData.percentages.Mobile > 50 ? (
                    <p>Most of your visitors use mobile devices. Ensure your rental booking process is optimized for small screens.</p>
                ) : deviceData.percentages.Desktop > 50 ? (
                    <p>Most of your visitors use desktop computers. Consider showcasing detailed product galleries and information.</p>
                ) : (
                    <p>You have a balanced mix of device types. Ensure your site works well across all screen sizes.</p>
                )}
            </div>
        </div>
    );
};

export default VisitorDeviceChart;
