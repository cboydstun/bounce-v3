import axios from 'axios';
import { ApiClient } from '../apiClient';
import { APP_CONFIG } from '../../../config/app.config';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ApiClient', () => {
    let apiClient: ApiClient;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        apiClient = new ApiClient();
    });

    describe('error handling', () => {
        it('should handle 409 Conflict errors correctly', async () => {
            // Mock a 409 Conflict response from the server
            const mockError = {
                response: {
                    status: 409,
                    data: {
                        message: 'Task already claimed by another contractor',
                    },
                },
            };

            // Setup axios to reject with our mock error
            mockedAxios.create.mockReturnValue({
                request: jest.fn().mockRejectedValue(mockError),
                interceptors: {
                    request: { use: jest.fn(), eject: jest.fn() },
                    response: { use: jest.fn(), eject: jest.fn() },
                },
            } as any);

            // Create a new instance with the mocked axios
            const client = new ApiClient();

            // Attempt to make a request that will fail with 409
            try {
                await client.post('/tasks/123/claim', {});
                // If we reach here, the test should fail
                fail('Expected an error to be thrown');
            } catch (error: any) {
                // Verify the error is properly transformed
                expect(error.code).toBe('RESOURCE_CONFLICT');
                expect(error.statusCode).toBe(409);
                expect(error.message).toBe('Task already claimed by another contractor');
            }
        });

        it('should handle other error status codes correctly', async () => {
            // Test cases for different status codes
            const testCases = [
                { status: 400, expectedCode: APP_CONFIG.ERROR_CODES.VALIDATION_ERROR },
                { status: 401, expectedCode: APP_CONFIG.ERROR_CODES.AUTH_ERROR },
                { status: 403, expectedCode: APP_CONFIG.ERROR_CODES.AUTH_ERROR },
                { status: 404, expectedCode: 'NOT_FOUND' },
                { status: 429, expectedCode: 'RATE_LIMIT_EXCEEDED' },
                { status: 500, expectedCode: APP_CONFIG.ERROR_CODES.SERVER_ERROR },
                { status: 502, expectedCode: APP_CONFIG.ERROR_CODES.SERVER_ERROR },
                { status: 503, expectedCode: APP_CONFIG.ERROR_CODES.SERVER_ERROR },
                { status: 504, expectedCode: APP_CONFIG.ERROR_CODES.SERVER_ERROR },
                { status: 418, expectedCode: APP_CONFIG.ERROR_CODES.UNKNOWN_ERROR }, // I'm a teapot
            ];

            for (const testCase of testCases) {
                // Mock the error response for this status code
                const mockError = {
                    response: {
                        status: testCase.status,
                        data: {
                            message: `Error with status ${testCase.status}`,
                        },
                    },
                };

                // Setup axios to reject with our mock error
                mockedAxios.create.mockReturnValue({
                    request: jest.fn().mockRejectedValue(mockError),
                    interceptors: {
                        request: { use: jest.fn(), eject: jest.fn() },
                        response: { use: jest.fn(), eject: jest.fn() },
                    },
                } as any);

                // Create a new instance with the mocked axios
                const client = new ApiClient();

                // Attempt to make a request that will fail
                try {
                    await client.post('/test', {});
                    // If we reach here, the test should fail
                    fail(`Expected an error to be thrown for status ${testCase.status}`);
                } catch (error: any) {
                    // Verify the error is properly transformed
                    expect(error.code).toBe(testCase.expectedCode);
                    expect(error.statusCode).toBe(testCase.status);
                    expect(error.message).toBe(`Error with status ${testCase.status}`);
                }
            }
        });
    });
});
