"use client"

import React from 'react';
import { IVisitor } from '@/types/visitor';

interface MarketingAttributionAnalyticsProps {
    visitors: IVisitor[];
}

const MarketingAttributionAnalytics: React.FC<MarketingAttributionAnalyticsProps> = ({ visitors }) => {
    // Count visitors with UTM parameters
    const visitorsWithUtm = visitors.filter(v => 
        v.utmSource || v.utmMedium || v.utmCampaign
    );
    
    const percentageWithUtm = visitors.length > 0 
        ? (visitorsWithUtm.length / visitors.length) * 100 
        : 0;
    
    // Group visitors by UTM source
    const utmSourceCounts: Record<string, number> = {};
    
    visitorsWithUtm.forEach(visitor => {
        const source = visitor.utmSource || 'Unknown';
        utmSourceCounts[source] = (utmSourceCounts[source] || 0) + 1;
    });
    
    // Sort UTM sources by count
    const sortedUtmSources = Object.entries(utmSourceCounts)
        .sort((a, b) => b[1] - a[1]);
    
    // Group visitors by UTM medium
    const utmMediumCounts: Record<string, number> = {};
    
    visitorsWithUtm.forEach(visitor => {
        const medium = visitor.utmMedium || 'Unknown';
        utmMediumCounts[medium] = (utmMediumCounts[medium] || 0) + 1;
    });
    
    // Sort UTM mediums by count
    const sortedUtmMediums = Object.entries(utmMediumCounts)
        .sort((a, b) => b[1] - a[1]);
    
    // Group visitors by UTM campaign
    const utmCampaignCounts: Record<string, number> = {};
    
    visitorsWithUtm.forEach(visitor => {
        const campaign = visitor.utmCampaign || 'Unknown';
        utmCampaignCounts[campaign] = (utmCampaignCounts[campaign] || 0) + 1;
    });
    
    // Sort UTM campaigns by count
    const sortedUtmCampaigns = Object.entries(utmCampaignCounts)
        .sort((a, b) => b[1] - a[1]);
    
    // Calculate conversion rates by source
    const conversionsBySource: Record<string, { visitors: number; conversions: number; rate: number }> = {};
    
    visitorsWithUtm.forEach(visitor => {
        const source = visitor.utmSource || 'Unknown';
        
        if (!conversionsBySource[source]) {
            conversionsBySource[source] = { visitors: 0, conversions: 0, rate: 0 };
        }
        
        conversionsBySource[source].visitors++;
        
        // Check if visitor has completed a conversion
        if (visitor.funnelStage === 'customer' || 
            (visitor.conversionEvents && visitor.conversionEvents.some(e => e.type === 'booking_completed'))) {
            conversionsBySource[source].conversions++;
        }
    });
    
    // Calculate conversion rates
    Object.keys(conversionsBySource).forEach(source => {
        const { visitors, conversions } = conversionsBySource[source];
        conversionsBySource[source].rate = visitors > 0 ? (conversions / visitors) * 100 : 0;
    });
    
    // Sort sources by conversion rate
    const sortedByConversionRate = Object.entries(conversionsBySource)
        .sort((a, b) => b[1].rate - a[1].rate);
    
    // Calculate engagement scores by source
    const engagementBySource: Record<string, { count: number; totalScore: number; avgScore: number }> = {};
    
    visitorsWithUtm.forEach(visitor => {
        const source = visitor.utmSource || 'Unknown';
        
        if (!engagementBySource[source]) {
            engagementBySource[source] = { count: 0, totalScore: 0, avgScore: 0 };
        }
        
        engagementBySource[source].count++;
        
        if (visitor.engagementScore !== undefined) {
            engagementBySource[source].totalScore += visitor.engagementScore;
        }
    });
    
    // Calculate average engagement scores
    Object.keys(engagementBySource).forEach(source => {
        const { count, totalScore } = engagementBySource[source];
        engagementBySource[source].avgScore = count > 0 ? totalScore / count : 0;
    });
    
    // Sort sources by average engagement score
    const sortedByEngagement = Object.entries(engagementBySource)
        .sort((a, b) => b[1].avgScore - a[1].avgScore);
    
    // Calculate landing page effectiveness
    const landingPageCounts: Record<string, number> = {};
    const landingPageConversions: Record<string, number> = {};
    
    visitors.forEach(visitor => {
        if (visitor.landingPage) {
            const page = visitor.landingPage;
            landingPageCounts[page] = (landingPageCounts[page] || 0) + 1;
            
            // Check if visitor has completed a conversion
            if (visitor.funnelStage === 'customer' || 
                (visitor.conversionEvents && visitor.conversionEvents.some(e => e.type === 'booking_completed'))) {
                landingPageConversions[page] = (landingPageConversions[page] || 0) + 1;
            }
        }
    });
    
    // Calculate conversion rates for landing pages
    const landingPageEffectiveness: Record<string, { visitors: number; conversions: number; rate: number }> = {};
    
    Object.keys(landingPageCounts).forEach(page => {
        const visitors = landingPageCounts[page];
        const conversions = landingPageConversions[page] || 0;
        
        landingPageEffectiveness[page] = {
            visitors,
            conversions,
            rate: visitors > 0 ? (conversions / visitors) * 100 : 0
        };
    });
    
    // Sort landing pages by conversion rate
    const sortedLandingPages = Object.entries(landingPageEffectiveness)
        .sort((a, b) => b[1].rate - a[1].rate)
        .slice(0, 5); // Top 5 landing pages
    
    // Helper function to get color based on conversion rate
    const getConversionRateColor = (rate: number) => {
        if (rate >= 10) return 'text-green-600';
        if (rate >= 5) return 'text-blue-600';
        if (rate >= 2) return 'text-yellow-600';
        return 'text-red-600';
    };
    
    // Helper function to format landing page URL
    const formatLandingPage = (url: string) => {
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

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Marketing Attribution Analytics</h3>
            
            {/* UTM Coverage */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold">UTM Parameter Coverage</h4>
                    <span className="text-sm text-gray-500">
                        {visitorsWithUtm.length} of {visitors.length} visitors ({percentageWithUtm.toFixed(1)}%)
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${percentageWithUtm}%` }}
                    ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    {percentageWithUtm < 50 ? 
                        "Low UTM coverage. Consider adding UTM parameters to more of your marketing campaigns." :
                        "Good UTM coverage. Your marketing attribution data is reliable."
                    }
                </p>
            </div>
            
            {/* Traffic Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <h4 className="text-sm font-semibold mb-3">Top Traffic Sources</h4>
                    {sortedUtmSources.length > 0 ? (
                        <div className="space-y-2">
                            {sortedUtmSources.slice(0, 5).map(([source, count], index) => (
                                <div key={index} className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                                        <div 
                                            className="bg-blue-600 h-4 rounded-full" 
                                            style={{ width: `${(count / visitorsWithUtm.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center min-w-[120px]">
                                        <span className="text-xs font-medium capitalize">{source}</span>
                                        <span className="text-xs text-gray-500">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No UTM source data available.</p>
                    )}
                </div>
                
                <div>
                    <h4 className="text-sm font-semibold mb-3">Top Traffic Mediums</h4>
                    {sortedUtmMediums.length > 0 ? (
                        <div className="space-y-2">
                            {sortedUtmMediums.slice(0, 5).map(([medium, count], index) => (
                                <div key={index} className="flex items-center">
                                    <div className="w-full bg-gray-200 rounded-full h-4 mr-2">
                                        <div 
                                            className="bg-green-600 h-4 rounded-full" 
                                            style={{ width: `${(count / visitorsWithUtm.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between items-center min-w-[120px]">
                                        <span className="text-xs font-medium capitalize">{medium}</span>
                                        <span className="text-xs text-gray-500">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No UTM medium data available.</p>
                    )}
                </div>
            </div>
            
            {/* Campaigns */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Top Campaigns</h4>
                {sortedUtmCampaigns.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Campaign
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Visitors
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Medium
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedUtmCampaigns.slice(0, 5).map(([campaign, count], index) => {
                                    // Find most common source and medium for this campaign
                                    const campaignVisitors = visitorsWithUtm.filter(v => v.utmCampaign === campaign);
                                    
                                    const sourceCounts: Record<string, number> = {};
                                    const mediumCounts: Record<string, number> = {};
                                    
                                    campaignVisitors.forEach(visitor => {
                                        const source = visitor.utmSource || 'Unknown';
                                        const medium = visitor.utmMedium || 'Unknown';
                                        
                                        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
                                        mediumCounts[medium] = (mediumCounts[medium] || 0) + 1;
                                    });
                                    
                                    const topSource = Object.entries(sourceCounts)
                                        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
                                        
                                    const topMedium = Object.entries(mediumCounts)
                                        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
                                    
                                    return (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                                {campaign}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                {topSource}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                {topMedium}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No campaign data available.</p>
                )}
            </div>
            
            {/* Conversion Performance */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Source Conversion Performance</h4>
                {sortedByConversionRate.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Visitors
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Conversions
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedByConversionRate.map(([source, data], index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                                            {source}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {data.visitors}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {data.conversions}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={getConversionRateColor(data.rate)}>
                                                {data.rate.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No conversion data available.</p>
                )}
            </div>
            
            {/* Landing Page Performance */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">Top Landing Pages</h4>
                {sortedLandingPages.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Page
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Visitors
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Conversions
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedLandingPages.map(([page, data], index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatLandingPage(page)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {data.visitors}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {data.conversions}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <span className={getConversionRateColor(data.rate)}>
                                                {data.rate.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No landing page data available.</p>
                )}
            </div>
            
            {/* Business Insights */}
            <div className="mt-6 text-sm text-gray-600">
                <p className="font-medium">Business Insights:</p>
                <ul className="list-disc list-inside mt-2 space-y-2">
                    {percentageWithUtm < 50 && (
                        <li>Only {percentageWithUtm.toFixed(1)}% of your visitors have UTM parameters. Add UTM parameters to all your marketing campaigns for better attribution.</li>
                    )}
                    
                    {sortedByConversionRate.length > 0 && sortedByConversionRate[0][1].rate > 0 && (
                        <li>Your highest converting traffic source is {sortedByConversionRate[0][0]} with a {sortedByConversionRate[0][1].rate.toFixed(1)}% conversion rate. Consider increasing your marketing budget for this channel.</li>
                    )}
                    
                    {sortedByConversionRate.length > 1 && sortedByConversionRate[sortedByConversionRate.length - 1][1].visitors > 10 && sortedByConversionRate[sortedByConversionRate.length - 1][1].rate < 1 && (
                        <li>Your {sortedByConversionRate[sortedByConversionRate.length - 1][0]} traffic source has a low conversion rate ({sortedByConversionRate[sortedByConversionRate.length - 1][1].rate.toFixed(1)}%). Consider optimizing or reducing spend on this channel.</li>
                    )}
                    
                    {sortedLandingPages.length > 0 && sortedLandingPages[0][1].rate > 5 && (
                        <li>Your best performing landing page is "{formatLandingPage(sortedLandingPages[0][0])}" with a {sortedLandingPages[0][1].rate.toFixed(1)}% conversion rate. Direct more traffic to this page.</li>
                    )}
                    
                    {sortedUtmMediums.length > 0 && sortedUtmMediums[0][0] !== 'Unknown' && (
                        <li>Your top traffic medium is {sortedUtmMediums[0][0]}. Ensure you're optimizing your content for this channel.</li>
                    )}
                    
                    {sortedUtmCampaigns.length > 0 && sortedUtmCampaigns[0][0] !== 'Unknown' && (
                        <li>Your most active campaign is "{sortedUtmCampaigns[0][0]}" which has brought in {sortedUtmCampaigns[0][1]} visitors.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default MarketingAttributionAnalytics;
