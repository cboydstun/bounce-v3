import { NextResponse } from "next/server";
import Visitor from "@/models/Visitor";
import dbConnect from "@/lib/db/mongoose";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { visitorId, interactionType, data } = await request.json();
    
    if (!visitorId) {
      return NextResponse.json(
        { error: "Visitor ID is required" },
        { status: 400 }
      );
    }
    
    // Calculate score adjustments based on interaction type
    const scoreAdjustments = calculateScoreAdjustments(interactionType, data);
    
    // Update visitor document with new scores and funnel stage if needed
    const updateQuery: any = {
      $inc: {
        engagementScore: scoreAdjustments.engagement,
        intentScore: scoreAdjustments.intent
      },
      $push: {
        interactions: {
          type: interactionType as any,
          page: data?.page || "/contact",
          timestamp: new Date(),
          data
        }
      },
      $set: {
        lastVisit: new Date()
      }
    };
    
    // Update funnel stage based on interaction
    if (interactionType === "form_start" && !data?.funnelStageUpdated) {
      updateQuery.$set.funnelStage = "prospect";
    } else if (interactionType === "contact_form" && !data?.funnelStageUpdated) {
      updateQuery.$set.funnelStage = "lead";
    } else if (interactionType === "success_page_cta_click" && !data?.funnelStageUpdated) {
      updateQuery.$set.funnelStage = "opportunity";
    }
    
    // Update visitor document
    const updatedVisitor = await Visitor.findOneAndUpdate(
      { visitorId },
      updateQuery,
      { new: true }
    );
    
    if (!updatedVisitor) {
      // If visitor doesn't exist, create a new one with basic info
      const newVisitor = await Visitor.create({
        visitorId,
        engagementScore: scoreAdjustments.engagement,
        intentScore: scoreAdjustments.intent,
        funnelStage: interactionType === "form_start" ? "prospect" : 
                    interactionType === "contact_form" ? "lead" : 
                    interactionType === "success_page_cta_click" ? "opportunity" : "visitor",
        interactions: [{
          type: interactionType as any,
          page: data?.page || "/contact",
          timestamp: new Date(),
          data
        }],
        firstVisit: new Date(),
        lastVisit: new Date(),
        visitCount: 1,
        userAgent: data?.userAgent || "Unknown",
        device: data?.device || "Desktop",
        referrer: data?.referrer || "Direct",
        language: data?.language || "en-US",
      });
      
      return NextResponse.json({ success: true, visitor: newVisitor, created: true });
    }
    
    return NextResponse.json({ success: true, visitor: updatedVisitor });
  } catch (error) {
    console.error("Error updating visitor score:", error);
    return NextResponse.json(
      { error: "Failed to update visitor score" },
      { status: 500 }
    );
  }
}

// Score calculation logic
function calculateScoreAdjustments(interactionType: string, data: any) {
  // Base scores
  let engagementScore = 0;
  let intentScore = 0;
  
  switch (interactionType) {
    case "form_view":
      engagementScore = 1;
      break;
    case "form_field_focus":
      engagementScore = 1;
      break;
    case "form_field_complete":
      engagementScore = 2;
      intentScore = 1;
      break;
    case "form_message_update":
      engagementScore = 1;
      break;
    case "form_extras_selection":
      engagementScore = 2;
      intentScore = 2;
      break;
    case "form_start":
      engagementScore = 5;
      intentScore = 3;
      break;
    case "form_completion":
      engagementScore = 5;
      intentScore = 5;
      break;
    case "form_submit":
      engagementScore = 10;
      intentScore = 15;
      break;
    case "contact_form":
      engagementScore = 15;
      intentScore = 25;
      break;
    case "success_page_view":
      engagementScore = 5;
      intentScore = 5;
      break;
    case "success_page_cta_click":
      engagementScore = 8;
      intentScore = 10;
      break;
  }
  
  // Bonus points for additional data
  if (data) {
    // More fields filled = higher intent
    if (data.fieldsCompleted && data.totalFields) {
      const completionPercentage = data.fieldsCompleted / data.totalFields;
      intentScore += Math.round(completionPercentage * 10);
    }
    
    // Message length indicates higher engagement
    if (data.messageLength) {
      if (data.messageLength > 200) engagementScore += 5;
      else if (data.messageLength > 100) engagementScore += 3;
      else if (data.messageLength > 50) engagementScore += 1;
    }
    
    // Extras selected indicates higher intent
    if (data.extrasSelected && data.extrasSelected > 0) {
      intentScore += Math.min(data.extrasSelected * 2, 10);
    }
    
    // Time spent on form indicates engagement
    if (data.timeSpent) {
      if (data.timeSpent > 180) engagementScore += 5; // >3 minutes
      else if (data.timeSpent > 90) engagementScore += 3; // >1.5 minutes
      else if (data.timeSpent > 30) engagementScore += 1; // >30 seconds
    }
  }
  
  return { engagement: engagementScore, intent: intentScore };
}
