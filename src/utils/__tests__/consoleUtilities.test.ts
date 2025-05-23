/**
 * Tests for console utility functions
 * These tests verify console mocking/unmocking behavior WITHOUT producing console pollution
 * Following TDD principles - testing behavior, not side effects
 */

describe('Console Utilities', () => {
  beforeEach(() => {
    // Ensure we start with mocked console (default state)
    global.disableConsoleOutput();
    // Clear any previous mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset to mocked state after each test
    global.disableConsoleOutput();
  });

  describe('disableConsoleOutput', () => {
    test('should mock all console methods', () => {
      // Act
      global.disableConsoleOutput();
      
      // Assert - All console methods should be Jest mock functions
      expect(jest.isMockFunction(console.log)).toBe(true);
      expect(jest.isMockFunction(console.error)).toBe(true);
      expect(jest.isMockFunction(console.warn)).toBe(true);
      expect(jest.isMockFunction(console.info)).toBe(true);
      expect(jest.isMockFunction(console.debug)).toBe(true);
    });

    test('should capture console calls without producing output', () => {
      // Arrange
      global.disableConsoleOutput();
      
      // Act - These calls should be captured but not displayed
      console.log('test log message');
      console.error('test error message');
      console.warn('test warn message');
      console.info('test info message');
      console.debug('test debug message');
      
      // Assert - Calls are captured by mocks
      expect(console.log).toHaveBeenCalledWith('test log message');
      expect(console.error).toHaveBeenCalledWith('test error message');
      expect(console.warn).toHaveBeenCalledWith('test warn message');
      expect(console.info).toHaveBeenCalledWith('test info message');
      expect(console.debug).toHaveBeenCalledWith('test debug message');
      
      // Verify call counts
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.debug).toHaveBeenCalledTimes(1);
    });
  });

  describe('enableConsoleOutput', () => {
    test('should restore real console methods', () => {
      // Arrange - Start with mocked console
      global.disableConsoleOutput();
      expect(jest.isMockFunction(console.log)).toBe(true);
      
      // Act
      global.enableConsoleOutput();
      
      // Assert - Console methods should be real functions, not mocks
      expect(jest.isMockFunction(console.log)).toBe(false);
      expect(jest.isMockFunction(console.error)).toBe(false);
      expect(jest.isMockFunction(console.warn)).toBe(false);
      expect(jest.isMockFunction(console.info)).toBe(false);
      expect(jest.isMockFunction(console.debug)).toBe(false);
      
      // Verify they are actual functions
      expect(typeof console.log).toBe('function');
      expect(typeof console.error).toBe('function');
      expect(typeof console.warn).toBe('function');
      expect(typeof console.info).toBe('function');
      expect(typeof console.debug).toBe('function');
    });

    test('should allow console methods to function normally when enabled', () => {
      // Arrange
      global.enableConsoleOutput();
      
      // Act & Assert - Real console methods should have their original names
      expect(console.log.name).toBe('log');
      expect(console.error.name).toBe('error');
      expect(console.warn.name).toBe('warn');
      expect(console.info.name).toBe('info');
      expect(console.debug.name).toBe('debug');
    });
  });

  describe('restoreOriginalConsole', () => {
    test('should restore original console object', () => {
      // Arrange - Start with mocked console
      global.disableConsoleOutput();
      const originalType = 'function';
      
      // Act
      global.restoreOriginalConsole();
      
      // Assert - All methods should be restored to original functions
      expect(typeof console.log).toBe(originalType);
      expect(typeof console.error).toBe(originalType);
      expect(typeof console.warn).toBe(originalType);
      expect(typeof console.info).toBe(originalType);
      expect(typeof console.debug).toBe(originalType);
      
      // Should not be mock functions
      expect(jest.isMockFunction(console.log)).toBe(false);
      expect(jest.isMockFunction(console.error)).toBe(false);
      expect(jest.isMockFunction(console.warn)).toBe(false);
      expect(jest.isMockFunction(console.info)).toBe(false);
      expect(jest.isMockFunction(console.debug)).toBe(false);
    });
  });

  describe('console state transitions', () => {
    test('should transition from mocked to enabled to mocked', () => {
      // Start: Mocked state
      global.disableConsoleOutput();
      expect(jest.isMockFunction(console.log)).toBe(true);
      
      // Transition: Enable console
      global.enableConsoleOutput();
      expect(jest.isMockFunction(console.log)).toBe(false);
      expect(typeof console.log).toBe('function');
      
      // Transition: Back to mocked
      global.disableConsoleOutput();
      expect(jest.isMockFunction(console.log)).toBe(true);
    });

    test('should handle multiple enable/disable cycles', () => {
      // Multiple cycles should work correctly
      for (let i = 0; i < 3; i++) {
        global.enableConsoleOutput();
        expect(jest.isMockFunction(console.log)).toBe(false);
        
        global.disableConsoleOutput();
        expect(jest.isMockFunction(console.log)).toBe(true);
      }
    });
  });

  describe('mock function behavior', () => {
    test('should track multiple calls correctly', () => {
      // Arrange
      global.disableConsoleOutput();
      
      // Act - Make multiple calls
      console.log('first call');
      console.log('second call');
      console.log('third call');
      
      // Assert - All calls should be tracked
      expect(console.log).toHaveBeenCalledTimes(3);
      expect(console.log).toHaveBeenNthCalledWith(1, 'first call');
      expect(console.log).toHaveBeenNthCalledWith(2, 'second call');
      expect(console.log).toHaveBeenNthCalledWith(3, 'third call');
    });

    test('should track calls with multiple arguments', () => {
      // Arrange
      global.disableConsoleOutput();
      
      // Act
      console.log('message', { data: 'test' }, 123, true);
      
      // Assert
      expect(console.log).toHaveBeenCalledWith(
        'message',
        { data: 'test' },
        123,
        true
      );
    });

    test('should allow mock function assertions', () => {
      // Arrange
      global.disableConsoleOutput();
      
      // Act
      console.error('Error occurred:', 'details');
      
      // Assert - Various Jest mock assertions should work
      expect(console.error).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error occurred:', 'details');
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenLastCalledWith('Error occurred:', 'details');
    });
  });

  describe('integration with components', () => {
    test('should capture component console output without pollution', () => {
      // Simulate a component that uses console logging
      const mockComponent = {
        initialize() {
          console.log('[Component] Initializing...');
          console.info('[Component] Configuration loaded');
          return 'initialized';
        },
        
        handleError(error: string) {
          console.error('[Component] Error:', error);
          console.warn('[Component] Fallback behavior activated');
          return 'error-handled';
        }
      };
      
      // Act
      const initResult = mockComponent.initialize();
      const errorResult = mockComponent.handleError('test error');
      
      // Assert - Component behavior
      expect(initResult).toBe('initialized');
      expect(errorResult).toBe('error-handled');
      
      // Assert - Console calls captured without pollution
      expect(console.log).toHaveBeenCalledWith('[Component] Initializing...');
      expect(console.info).toHaveBeenCalledWith('[Component] Configuration loaded');
      expect(console.error).toHaveBeenCalledWith('[Component] Error:', 'test error');
      expect(console.warn).toHaveBeenCalledWith('[Component] Fallback behavior activated');
      
      // Verify call counts
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('performance', () => {
    test('should handle high volume console calls efficiently', () => {
      // Arrange
      global.disableConsoleOutput();
      const startTime = Date.now();
      
      // Act - High volume console operations
      for (let i = 0; i < 1000; i++) {
        console.log(`Message ${i}`);
        console.error(`Error ${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Assert - Should complete quickly (mocked calls are fast)
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(console.log).toHaveBeenCalledTimes(1000);
      expect(console.error).toHaveBeenCalledTimes(1000);
    });
  });
});
