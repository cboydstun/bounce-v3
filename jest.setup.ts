import "@testing-library/jest-dom";

// Polyfill for TextEncoder/TextDecoder (needed for MongoDB)
// @ts-ignore
global.TextEncoder = function TextEncoder() {
  return {
    encode: function encode(str: string): Uint8Array {
      const buf = new ArrayBuffer(str.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return bufView;
    },
    encodeInto: function encodeInto(str: string, array: Uint8Array) {
      for (let i = 0; i < str.length; i++) {
        array[i] = str.charCodeAt(i);
      }
      return { read: str.length, written: str.length };
    },
    encoding: 'utf-8'
  };
};

// @ts-ignore
global.TextDecoder = function TextDecoder() {
  return {
    decode: function decode(array: Uint8Array): string {
      return String.fromCharCode.apply(null, Array.from(array));
    },
    encoding: 'utf-8',
    fatal: false,
    ignoreBOM: false
  };
};

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return "";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next/server
jest.mock("next/server", () => {
  // Create a mock NextRequest class
  class MockNextRequest {
    private url: string;
    private method: string;
    private bodyContent: any;
    private headerValues: Record<string, string> = {
      "authorization": "Bearer mock-token"
    };

    constructor(input: string | URL, init?: RequestInit) {
      this.url = input.toString();
      this.method = init?.method || "GET";
      this.bodyContent = init?.body || "{}";

      // Set headers from init
      if (init?.headers) {
        const headers = init.headers as Record<string, string>;
        Object.keys(headers).forEach(key => {
          this.headerValues[key.toLowerCase()] = headers[key];
        });
      }
    }

    // Mock the json method
    json() {
      return Promise.resolve(
        typeof this.bodyContent === "string"
          ? JSON.parse(this.bodyContent)
          : this.bodyContent
      );
    }

    // Mock the headers object
    get headers() {
      return {
        get: (name: string) => this.headerValues[name.toLowerCase()] || null,
        set: (name: string, value: string) => {
          this.headerValues[name.toLowerCase()] = value;
        }
      };
    }

    // Add any other properties/methods needed for tests
    get nextUrl() {
      return new URL(this.url);
    }

    get cookies() {
      return {
        get: (name: string) => ({ name, value: "test-cookie-value" }),
      };
    }
  }

  // Create a mock NextResponse class
  class MockNextResponse {
    static json(data: any, init?: ResponseInit) {
      const response = {
        status: init?.status || 200,
        headers: new Headers(init?.headers),
        json: async () => data,
        cookies: {
          set: jest.fn(), // Mock the set method
          get: jest.fn().mockReturnValue({ name: "auth_token", value: "test-token" }),
          getAll: jest.fn().mockReturnValue([{ name: "auth_token", value: "test-token" }]),
          delete: jest.fn(),
          has: jest.fn().mockReturnValue(true),
        }
      };
      return response;
    }

    static redirect(url: string | URL) {
      return {
        status: 302,
        headers: new Headers({ Location: url.toString() }),
      };
    }

    static next() {
      return { status: 200 };
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// Set environment variables for tests
process.env.JWT_SECRET = "test-secret";
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
