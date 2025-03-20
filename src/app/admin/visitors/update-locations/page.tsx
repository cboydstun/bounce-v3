"use client";

import React, { useState } from 'react';
import Link from 'next/link';

/**
 * Admin page to update visitor locations
 * This page provides a button to trigger the location update process
 */
export default function UpdateVisitorLocations() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        stats?: {
            total: number;
            updated: number;
            skipped: number;
            errors: number;
        };
        error?: string;
    } | null>(null);

    const updateLocations = async () => {
        try {
            setIsLoading(true);
            setResult(null);
            
            const response = await fetch('/api/v1/visitors/update-locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error updating locations:', error);
            setResult({
                success: false,
                message: 'An error occurred while updating locations',
                error: error instanceof Error ? error.message : String(error)
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href="/admin/visitors" className="text-blue-500 hover:text-blue-700">
                    &larr; Back to Visitors
                </Link>
            </div>
            
            <h1 className="text-2xl font-bold mb-6">Update Visitor Locations</h1>
            
            <div className="mb-8">
                <p className="mb-4">
                    This tool will update location data for all visitors based on their IP addresses.
                    It uses the IP-API.com service to get location data.
                </p>
                <p className="mb-4">
                    The process may take some time depending on the number of visitors without location data.
                    Visitors are processed in batches to avoid hitting rate limits.
                </p>
                <p className="mb-4 text-yellow-600">
                    <strong>Note:</strong> This process will only update visitors without location data.
                    Visitors that already have location data will not be affected.
                </p>
            </div>
            
            <button
                onClick={updateLocations}
                disabled={isLoading}
                className={`px-4 py-2 rounded ${
                    isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
            >
                {isLoading ? 'Updating Locations...' : 'Update Visitor Locations'}
            </button>
            
            {result && (
                <div className={`mt-6 p-4 rounded ${
                    result.success ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
                }`}>
                    <h2 className="text-xl font-semibold mb-2">
                        {result.success ? 'Success!' : 'Error'}
                    </h2>
                    <p className="mb-2">{result.message}</p>
                    
                    {result.stats && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Results:</h3>
                            <ul className="list-disc pl-5">
                                <li>Total visitors processed: {result.stats.total}</li>
                                <li>Visitors updated: {result.stats.updated}</li>
                                <li>Visitors skipped: {result.stats.skipped}</li>
                                <li>Errors: {result.stats.errors}</li>
                            </ul>
                        </div>
                    )}
                    
                    {result.error && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Error Details:</h3>
                            <p className="text-red-600">{result.error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
