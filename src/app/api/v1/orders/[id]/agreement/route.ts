import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongoose";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { docusealService } from "@/services/docusealService";

/**
 * GET endpoint to download signed agreement for an order
 * This endpoint is protected and requires authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Not authenticated" },
        { status: 401 },
      );
    }

    await dbConnect();

    const { id: orderId } = await params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if agreement has been signed
    if (order.agreementStatus !== "signed") {
      return NextResponse.json(
        { error: "Agreement has not been signed yet" },
        { status: 400 },
      );
    }

    // Check if we have a DocuSeal submission ID
    if (!order.docusealSubmissionId) {
      return NextResponse.json(
        { error: "No DocuSeal submission found for this order" },
        { status: 400 },
      );
    }

    try {
      // Get the signed document from DocuSeal
      const documentBuffer = await docusealService.downloadSignedDocument(
        order.docusealSubmissionId,
      );

      if (!documentBuffer) {
        return NextResponse.json(
          { error: "Signed document not available" },
          { status: 404 },
        );
      }

      // Use the buffer directly (DocuSeal service returns a Buffer)
      const buffer = documentBuffer;

      // Create response with PDF content
      const response = new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="agreement-${order.orderNumber}.pdf"`,
          "Content-Length": buffer.length.toString(),
        },
      });

      return response;
    } catch (docusealError) {
      console.error("DocuSeal error:", docusealError);

      // If we have a stored document URL, try to redirect to it
      if (order.signedDocumentUrl) {
        return NextResponse.redirect(order.signedDocumentUrl);
      }

      return NextResponse.json(
        {
          error: "Failed to download signed agreement",
          details:
            docusealError instanceof Error
              ? docusealError.message
              : "Unknown DocuSeal error",
        },
        { status: 500 },
      );
    }
  } catch (error: unknown) {
    console.error("Error downloading agreement:", error);
    return NextResponse.json(
      {
        error: "Failed to download agreement",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint info for agreement status
 * Alternative endpoint that returns agreement info instead of downloading
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get the session using NextAuth's recommended approach
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return new NextResponse(null, { status: 401 });
    }

    await dbConnect();

    const { id: orderId } = await params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return new NextResponse(null, { status: 404 });
    }

    // Check if agreement has been signed
    if (order.agreementStatus !== "signed") {
      return new NextResponse(null, { status: 400 });
    }

    // Return success if document is available
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "X-Agreement-Status": order.agreementStatus,
        "X-Signed-At": order.agreementSignedAt?.toISOString() || "",
      },
    });
  } catch (error: unknown) {
    console.error("Error checking agreement:", error);
    return new NextResponse(null, { status: 500 });
  }
}
