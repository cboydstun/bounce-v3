/**
 * Utility functions for tracking conversion events
 */

import { ConversionEventType } from '@/types/visitor';

/**
 * Track a conversion event
 * @param type The type of conversion event
 * @param product Optional product associated with the conversion
 * @param value Optional monetary value of the conversion
 * @param completed Whether the conversion was completed (default: true)
 */
export const trackConversion = async (
    type: ConversionEventType,
    product?: string,
    value?: number,
    completed: boolean = true
): Promise<void> => {
    try {
        // Get visitor ID from localStorage if available
        const visitorId = localStorage.getItem('visitorId');
        
        if (!visitorId) {
            console.warn('Cannot track conversion: No visitor ID found');
            return;
        }
        
        // Get current page
        const currentPage = window.location.pathname;
        
        // Create conversion event data
        const conversionEvent = {
            type,
            product,
            value,
            completed
        };
        
        // Send to API
        await fetch('/api/v1/visitors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                visitorId,
                currentPage,
                conversionEvent
            }),
        });
        
        console.log(`Conversion tracked: ${type}`, { product, value, completed });
    } catch (error) {
        console.error('Error tracking conversion:', error);
    }
};

/**
 * Track a contact form submission
 * @param product Optional product associated with the contact
 */
export const trackContactForm = async (product?: string): Promise<void> => {
    return trackConversion('contact_form', product);
};

/**
 * Track a price check
 * @param product The product being checked
 */
export const trackPriceCheck = async (product: string): Promise<void> => {
    return trackConversion('price_check', product);
};

/**
 * Track an availability check
 * @param product The product being checked
 */
export const trackAvailabilityCheck = async (product: string): Promise<void> => {
    return trackConversion('availability_check', product);
};

/**
 * Track the start of a booking process
 * @param product The product being booked
 * @param value The value of the booking
 */
export const trackBookingStarted = async (product: string, value?: number): Promise<void> => {
    return trackConversion('booking_started', product, value);
};

/**
 * Track the completion of a booking
 * @param product The product that was booked
 * @param value The value of the booking
 */
export const trackBookingCompleted = async (product: string, value: number): Promise<void> => {
    return trackConversion('booking_completed', product, value);
};

/**
 * Track an abandoned booking
 * @param product The product that was being booked
 * @param value The potential value of the booking
 */
export const trackBookingAbandoned = async (product: string, value?: number): Promise<void> => {
    return trackConversion('booking_started', product, value, false);
};
