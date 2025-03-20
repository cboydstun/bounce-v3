"use client"

import React from 'react';
import { IVisitor } from '@/types/visitor';

interface ConversionFunnelAnalyticsProps {
    visitors: IVisitor[];
}

const ConversionFunnelAnalytics: React.FC<ConversionFunnelAnalyticsProps> = ({ visitors }) => {
    // Count visitors at each funnel stage
    const funnelStages = {
        visitor: 0,
        prospect: 0,
        lead: 0,
        opportunity: 0,
        customer: 0
    };
    
    // Count total visitors
    const totalVisitors = visitors.length;
    
    // Group visitors by funnel stage
    visitors.forEach(visitor => {
        const stage = visitor.funnelStage || 'visitor';
        funnelStages[stage as keyof typeof funnelStages]++;
    });
    
    // Calculate conversion rates between stages
    const conversionRates = {
        visitorToProspect: totalVisitors > 0 ? (funnelStages.prospect / totalVisitors) * 100 : 0,
        prospectToLead: funnelStages.prospect > 0 ? (funnelStages.lead / funnelStages.prospect) * 100 : 0,
        leadToOpportunity: funnelStages.lead > 0 ? (funnelStages.opportunity / funnelStages.lead) * 100 : 0,
        opportunityToCustomer: funnelStages.opportunity > 0 ? (funnelStages.customer / funnelStages.opportunity) * 100 : 0,
        overallConversion: totalVisitors > 0 ? (funnelStages.customer / totalVisitors) * 100 : 0
    };
    
    // Calculate average time spent at each stage (in days)
    const stageDurations = {
        visitorToProspect: 0,
        prospectToLead: 0,
        leadToOpportunity: 0,
        opportunityToCustomer: 0
    };
    
    // Count visitors with conversion events
    const visitorsWithConversionEvents = visitors.filter(v => 
        v.conversionEvents && v.conversionEvents.length > 0
    );
    
    // Calculate average conversion value
    let totalConversionValue = 0;
    let conversionValueCount = 0;
    
    visitorsWithConversionEvents.forEach(visitor => {
        if (visitor.conversionEvents) {
            visitor.conversionEvents.forEach(event => {
                if (event.value) {
                    totalConversionValue += event.value;
                    conversionValueCount++;
                }
            });
        }
    });
    
    const averageConversionValue = conversionValueCount > 0 
        ? totalConversionValue / conversionValueCount 
        : 0;
    
    // Get most common conversion events
    const conversionEventCounts: Record<string, number> = {};
    
    visitorsWithConversionEvents.forEach(visitor => {
        if (visitor.conversionEvents) {
            visitor.conversionEvents.forEach(event => {
                const eventType = event.type;
                conversionEventCounts[eventType] = (conversionEventCounts[eventType] || 0) + 1;
            });
        }
    });
    
    // Sort conversion events by count
    const sortedConversionEvents = Object.entries(conversionEventCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Top 3 events
    
    // Get most common product in conversion events
    const productCounts: Record<string, number> = {};
    
    visitorsWithConversionEvents.forEach(visitor => {
        if (visitor.conversionEvents) {
            visitor.conversionEvents.forEach(event => {
                if (event.product) {
                    productCounts[event.product] = (productCounts[event.product] || 0) + 1;
                }
            });
        }
    });
    
    // Sort products by count
    const sortedProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Top 3 products
    
    // Helper function to get color based on conversion rate
    const getConversionRateColor = (rate: number) => {
        if (rate >= 20) return 'text-green-600';
        if (rate >= 10) return 'text-blue-600';
        if (rate >= 5) return 'text-yellow-600';
        return 'text-red-600';
    };
    
    // Helper function to get width percentage for funnel visualization
    const getWidthPercentage = (count: number) => {
        return totalVisitors > 0 ? (count / totalVisitors) * 100 : 0;
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Conversion Funnel Analytics</h3>
            
            {/* Funnel Visualization */}
            <div className="mb-6">
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                Visitors ({funnelStages.visitor})
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-blue-600">
                                {getWidthPercentage(funnelStages.visitor).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                        <div style={{ width: `${getWidthPercentage(funnelStages.visitor)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                    </div>
                </div>
                
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                Prospects ({funnelStages.prospect})
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-green-600">
                                {getWidthPercentage(funnelStages.prospect).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                        <div style={{ width: `${getWidthPercentage(funnelStages.prospect)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                    </div>
                </div>
                
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
                                Leads ({funnelStages.lead})
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-yellow-600">
                                {getWidthPercentage(funnelStages.lead).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200">
                        <div style={{ width: `${getWidthPercentage(funnelStages.lead)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"></div>
                    </div>
                </div>
                
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">
                                Opportunities ({funnelStages.opportunity})
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-orange-600">
                                {getWidthPercentage(funnelStages.opportunity).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-200">
                        <div style={{ width: `${getWidthPercentage(funnelStages.opportunity)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                    </div>
                </div>
                
                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                                Customers ({funnelStages.customer})
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-red-600">
                                {getWidthPercentage(funnelStages.customer).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-200">
                        <div style={{ width: `${getWidthPercentage(funnelStages.customer)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                    </div>
                </div>
            </div>
            
            {/* Conversion Rates */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold mb-2">Conversion Rates</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Visitor → Prospect</p>
                        <p className={`text-lg font-bold ${getConversionRateColor(conversionRates.visitorToProspect)}`}>
                            {conversionRates.visitorToProspect.toFixed(1)}%
                        </p>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Prospect → Lead</p>
                        <p className={`text-lg font-bold ${getConversionRateColor(conversionRates.prospectToLead)}`}>
                            {conversionRates.prospectToLead.toFixed(1)}%
                        </p>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Lead → Opportunity</p>
                        <p className={`text-lg font-bold ${getConversionRateColor(conversionRates.leadToOpportunity)}`}>
                            {conversionRates.leadToOpportunity.toFixed(1)}%
                        </p>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Opportunity → Customer</p>
                        <p className={`text-lg font-bold ${getConversionRateColor(conversionRates.opportunityToCustomer)}`}>
                            {conversionRates.opportunityToCustomer.toFixed(1)}%
                        </p>
                    </div>
                    
                    <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-gray-500">Overall Conversion</p>
                        <p className={`text-lg font-bold ${getConversionRateColor(conversionRates.overallConversion)}`}>
                            {conversionRates.overallConversion.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Conversion Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-2">Top Conversion Events</h4>
                    {sortedConversionEvents.length > 0 ? (
                        <ul className="space-y-2">
                            {sortedConversionEvents.map(([event, count], index) => (
                                <li key={index} className="flex justify-between items-center">
                                    <span className="text-sm capitalize">{event.replace(/_/g, ' ')}</span>
                                    <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                        {count} events
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No conversion events recorded yet.</p>
                    )}
                </div>
                
                <div className="border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-2">Top Products in Conversions</h4>
                    {sortedProducts.length > 0 ? (
                        <ul className="space-y-2">
                            {sortedProducts.map(([product, count], index) => (
                                <li key={index} className="flex justify-between items-center">
                                    <span className="text-sm capitalize">{product.replace(/-/g, ' ')}</span>
                                    <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                        {count} conversions
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No product conversions recorded yet.</p>
                    )}
                </div>
            </div>
            
            {/* Business Insights */}
            <div className="mt-6 text-sm text-gray-600">
                <p className="font-medium">Business Insights:</p>
                <ul className="list-disc list-inside mt-2 space-y-2">
                    {conversionRates.visitorToProspect < 5 && (
                        <li>Your visitor-to-prospect conversion rate is low. Consider adding more prominent call-to-action buttons on your product pages.</li>
                    )}
                    
                    {conversionRates.prospectToLead < 10 && funnelStages.prospect > 0 && (
                        <li>Your prospect-to-lead conversion rate could be improved. Review your contact form to ensure it's easy to complete.</li>
                    )}
                    
                    {conversionRates.leadToOpportunity < 15 && funnelStages.lead > 0 && (
                        <li>Consider following up with leads more quickly to improve your lead-to-opportunity conversion rate.</li>
                    )}
                    
                    {conversionRates.opportunityToCustomer < 20 && funnelStages.opportunity > 0 && (
                        <li>Your opportunity-to-customer conversion rate suggests potential issues in the final booking process. Simplify the checkout flow.</li>
                    )}
                    
                    {conversionRates.overallConversion < 2 && totalVisitors > 100 && (
                        <li>Your overall conversion rate is below industry average. Consider A/B testing different elements of your rental booking process.</li>
                    )}
                    
                    {sortedProducts.length > 0 && (
                        <li>Your top converting product is "{sortedProducts[0][0].replace(/-/g, ' ')}". Consider featuring this product more prominently on your homepage.</li>
                    )}
                    
                    {averageConversionValue > 0 && (
                        <li>Your average conversion value is ${averageConversionValue.toFixed(2)}. Focus marketing efforts on products with higher than average values.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ConversionFunnelAnalytics;
