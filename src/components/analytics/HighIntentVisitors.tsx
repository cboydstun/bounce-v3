"use client"

import React, { useState } from 'react';
import { IVisitor } from '@/types/visitor';

interface HighIntentVisitorsProps {
    visitors: IVisitor[];
}

const HighIntentVisitors: React.FC<HighIntentVisitorsProps> = ({ visitors }) => {
    const [expandedVisitor, setExpandedVisitor] = useState<string | null>(null);
    
    // Helper function to get page visit frequency
    const getPageVisitFrequency = (visitor: IVisitor) => {
        const pageVisits: { [key: string]: number } = {};
        
        visitor.visitedPages.forEach((page: { url: string; timestamp: Date }) => {
            const url = page.url;
            pageVisits[url] = (pageVisits[url] || 0) + 1;
        });
        
        // Convert to array and sort by frequency
        return Object.entries(pageVisits)
            .map(([page, count]) => ({ page, count }))
            .filter(item => item.count > 1) // Only pages visited more than once
            .sort((a, b) => b.count - a.count);
    };
    
    // Format page URLs for display
    const formatPageUrl = (url: string) => {
        // Remove domain and protocol if present
        let formatted = url.replace(/^https?:\/\/[^\/]+/, '');
        
        // Handle root path
        if (formatted === '' || formatted === '/') {
            return 'Home Page';
        }
        
        // Remove trailing slash
        formatted = formatted.replace(/\/$/, '');
        
        // Remove leading slash and split by remaining slashes
        const parts = formatted.replace(/^\//, '').split('/');
        
        // If it's a product page, format it nicely
        if (parts[0] === 'products' && parts.length > 1) {
            return `Product: ${parts[1].replace(/-/g, ' ')}`;
        }
        
        // For other pages, just capitalize and clean up
        return parts.map(part => 
            part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')
        ).join(' > ');
    };
    
    // Format date for display
    const formatDate = (dateString: Date | string) => {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return date.toLocaleString();
    };
    
    // Toggle expanded visitor
    const toggleExpand = (visitorId: string) => {
        if (expandedVisitor === visitorId) {
            setExpandedVisitor(null);
        } else {
            setExpandedVisitor(visitorId);
        }
    };
    
    // Get product interest
    const getProductInterest = (visitor: IVisitor) => {
        const productPages = visitor.visitedPages
            .filter((page: { url: string }) => page.url.includes('/products/'))
            .map((page: { url: string }) => {
                const match = page.url.match(/\/products\/([^\/]+)/);
                return match ? match[1].replace(/-/g, ' ') : null;
            })
            .filter(Boolean);
        
        if (productPages.length === 0) return null;
        
        // Count occurrences of each product
        const productCounts: { [key: string]: number } = {};
        productPages.forEach((product) => {
            if (product) {
                productCounts[product] = (productCounts[product] || 0) + 1;
            }
        });
        
        // Find the most viewed product
        let topProduct = '';
        let topCount = 0;
        
        Object.entries(productCounts).forEach(([product, count]) => {
            if (count > topCount) {
                topProduct = product;
                topCount = count;
            }
        });
        
        return { product: topProduct, count: topCount };
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">High-Intent Visitors</h3>
            
            {visitors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No high-intent visitors detected yet.</p>
            ) : (
                <div>
                    <p className="text-sm text-gray-600 mb-4">
                        These visitors have viewed the same page multiple times, indicating high interest in your rental products.
                    </p>
                    
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        {visitors.slice(0, 5).map((visitor) => {
                            const pageFrequency = getPageVisitFrequency(visitor);
                            const productInterest = getProductInterest(visitor);
                            const isExpanded = expandedVisitor === String(visitor._id);
                            
                            return (
                                <div key={String(visitor._id)} className="border-b border-gray-200 last:border-b-0">
                                    <div 
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                        onClick={() => toggleExpand(String(visitor._id))}
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {String(visitor.visitorId).substring(0, 8)}...
                                                {productInterest && (
                                                    <span className="ml-2 text-sm text-purple-600 font-normal">
                                                        Interested in: {productInterest.product}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {visitor.visitCount} visits • Last visit: {formatDate(visitor.lastVisit)}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            {visitor.device === 'Mobile' && (
                                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 mr-2">Mobile</span>
                                            )}
                                            {visitor.device === 'Desktop' && (
                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 mr-2">Desktop</span>
                                            )}
                                            {visitor.device === 'Tablet' && (
                                                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 mr-2">Tablet</span>
                                            )}
                                            <svg 
                                                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                                            <h4 className="font-medium text-sm mb-2">Frequently Viewed Pages:</h4>
                                            <ul className="space-y-1 mb-4">
                                                {pageFrequency.map((item, index) => (
                                                    <li key={index} className="text-sm flex justify-between">
                                                        <span>{formatPageUrl(item.page)}</span>
                                                        <span className="text-gray-500">{item.count} views</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500">Location:</p>
                                                    <p>{visitor.location ? 
                                                        `${visitor.location.city || ''}, ${visitor.location.country || ''}` : 
                                                        'Unknown'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500">Referrer:</p>
                                                    <p>{visitor.referrer || 'Direct'}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 pt-3 border-t border-gray-200">
                                                <p className="text-sm font-medium text-gray-700">Business Insight:</p>
                                                {productInterest ? (
                                                    <p className="text-sm text-gray-600">
                                                        This visitor has viewed "{productInterest.product}" {productInterest.count} times. 
                                                        Consider following up with a special offer for this rental product.
                                                    </p>
                                                ) : pageFrequency.length > 0 ? (
                                                    <p className="text-sm text-gray-600">
                                                        This visitor has repeatedly viewed "{formatPageUrl(pageFrequency[0].page)}". 
                                                        They may be interested in related rental products.
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-600">
                                                        This visitor has made multiple visits to your site, showing general interest in your rental offerings.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {visitors.length > 5 && (
                        <p className="text-sm text-center text-gray-500 mt-4">
                            Showing 5 of {visitors.length} high-intent visitors
                        </p>
                    )}
                </div>
            )}
            
            <div className="mt-6 text-sm text-gray-600">
                <p className="font-medium">Why This Matters:</p>
                <p className="mt-1">
                    High-intent visitors are your most valuable leads. They've shown repeated interest in specific 
                    rental products and are more likely to convert. Consider implementing targeted follow-up strategies 
                    for these visitors, such as special offers or personalized outreach.
                </p>
            </div>
        </div>
    );
};

export default HighIntentVisitors;
