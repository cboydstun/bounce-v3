import { NextRequest, NextResponse } from "next/server";

/**
 * Mock implementation of the GET handler for contacts API
 * This is used in tests to ensure proper authentication checks
 */
export async function mockContactsGET(request: NextRequest) {
  // Check for Authorization header
  const authHeader = request.headers.get("Authorization");

  // If no Authorization header, return 401
  if (!authHeader) {
    return NextResponse.json(
      { error: "Unauthorized - No token provided" },
      { status: 401 },
    );
  }

  // Verify the token is valid
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "Unauthorized - Invalid authorization format" },
      { status: 401 },
    );
  }

  // If we get here, the request is authenticated
  return NextResponse.json({
    contacts: [],
  });
}

/**
 * Mock implementation of the GET by ID handler for contacts API
 */
export async function mockContactsGETById(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check for Authorization header
  const authHeader = request.headers.get("Authorization");

  // If no Authorization header, return 401
  if (!authHeader) {
    return NextResponse.json(
      { error: "Unauthorized - No token provided" },
      { status: 401 },
    );
  }

  // Verify the token is valid
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "Unauthorized - Invalid authorization format" },
      { status: 401 },
    );
  }

  // If we get here, the request is authenticated
  return NextResponse.json({});
}

/**
 * Mock implementation of the PUT handler for contacts API
 */
export async function mockContactsPUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check for Authorization header
  const authHeader = request.headers.get("Authorization");

  // If no Authorization header, return 401
  if (!authHeader) {
    return NextResponse.json(
      { error: "Unauthorized - No token provided" },
      { status: 401 },
    );
  }

  // Verify the token is valid
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "Unauthorized - Invalid authorization format" },
      { status: 401 },
    );
  }

  // If we get here, the request is authenticated
  return NextResponse.json({});
}

/**
 * Mock implementation of the PATCH handler for contacts API
 */
export async function mockContactsPATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check for Authorization header
  const authHeader = request.headers.get("Authorization");

  // If no Authorization header, return 401
  if (!authHeader) {
    return NextResponse.json(
      { error: "Unauthorized - No token provided" },
      { status: 401 },
    );
  }

  // Verify the token is valid
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "Unauthorized - Invalid authorization format" },
      { status: 401 },
    );
  }

  // If we get here, the request is authenticated
  return NextResponse.json({});
}

/**
 * Mock implementation of the DELETE handler for contacts API
 */
export async function mockContactsDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Check for Authorization header
  const authHeader = request.headers.get("Authorization");

  // If no Authorization header, return 401
  if (!authHeader) {
    return NextResponse.json(
      { error: "Unauthorized - No token provided" },
      { status: 401 },
    );
  }

  // Verify the token is valid
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "Unauthorized - Invalid authorization format" },
      { status: 401 },
    );
  }

  // If we get here, the request is authenticated
  return NextResponse.json({ message: "Contact deleted successfully" });
}
