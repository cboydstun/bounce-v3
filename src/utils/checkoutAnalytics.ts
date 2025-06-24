import { IVisitor } from "@/types/visitor";

/**
 * Extract checkout-related interactions from visitors
 */
export function getCheckoutInteractions(visitors: IVisitor[]) {
  return visitors.flatMap(
    (visitor) =>
      visitor.interactions?.filter(
        (interaction) =>
          interaction.element === "checkout-form" ||
          (interaction.element &&
            interaction.element.startsWith("checkout-form-field-")),
      ) || [],
  );
}

/**
 * Get booking started and completed counts
 */
export function getBookingCounts(visitors: IVisitor[]) {
  const bookingStarted = visitors.filter((visitor) =>
    visitor.conversionEvents?.some((event) => event.type === "booking_started"),
  ).length;

  const bookingCompleted = visitors.filter((visitor) =>
    visitor.conversionEvents?.some(
      (event) => event.type === "booking_completed",
    ),
  ).length;

  return {
    bookingStarted,
    bookingCompleted,
    completionRate:
      bookingStarted > 0 ? (bookingCompleted / bookingStarted) * 100 : 0,
  };
}

/**
 * Calculate average time to complete checkout
 */
export function getAverageCheckoutTime(visitors: IVisitor[]): number {
  const checkoutTimes: number[] = [];

  visitors.forEach((visitor) => {
    const checkoutInteractions =
      visitor.interactions?.filter((i) => i.element === "checkout-form") || [];

    // Find pairs of view_form_step and form_step_complete for the same step
    const stepTimes: number[] = [];

    // Group interactions by step
    const stepInteractions: Record<string, any[]> = {};

    checkoutInteractions.forEach((interaction) => {
      const step = interaction.data?.step;
      if (step) {
        if (!stepInteractions[step]) {
          stepInteractions[step] = [];
        }
        stepInteractions[step].push(interaction);
      }
    });

    // Calculate time for each step
    Object.values(stepInteractions).forEach((interactions) => {
      const viewInteraction = interactions.find(
        (i) => i.type === "view_form_step",
      );
      const completeInteraction = interactions.find(
        (i) => i.type === "form_step_complete",
      );

      if (viewInteraction && completeInteraction) {
        const viewTime = new Date(viewInteraction.timestamp).getTime();
        const completeTime = new Date(completeInteraction.timestamp).getTime();
        const timeSpent = (completeTime - viewTime) / (1000 * 60); // Convert to minutes
        stepTimes.push(timeSpent);
      }
    });

    // Calculate total checkout time for this visitor
    if (stepTimes.length > 0) {
      const totalTime = stepTimes.reduce((sum, time) => sum + time, 0);
      checkoutTimes.push(totalTime);
    }
  });

  // Calculate average
  return checkoutTimes.length > 0
    ? checkoutTimes.reduce((sum, time) => sum + time, 0) / checkoutTimes.length
    : 0;
}

/**
 * Get checkout funnel data
 */
export function getCheckoutFunnelData(visitors: IVisitor[]) {
  // Count interactions by type and step
  const stepCounts = {
    booking_started: 0,
    selection: { view: 0, complete: 0 },
    datetime: { view: 0, complete: 0 },
    details: { view: 0, complete: 0 },
    extras: { view: 0, complete: 0 },
    review: { view: 0, complete: 0 },
    payment: { view: 0, complete: 0 },
    booking_submitted: 0,
    booking_abandoned: 0,
  };

  // Process all visitors
  visitors.forEach((visitor) => {
    // Check for booking_started events
    if (visitor.conversionEvents?.some((e) => e.type === "booking_started")) {
      stepCounts.booking_started++;
    }

    // Check for booking_completed events
    if (visitor.conversionEvents?.some((e) => e.type === "booking_completed")) {
      stepCounts.booking_submitted++;
    }

    // Process checkout interactions
    visitor.interactions?.forEach((interaction) => {
      if (interaction.element === "checkout-form") {
        const step = interaction.data?.step;
        const type = interaction.type;

        if (
          step &&
          typeof stepCounts[step as keyof typeof stepCounts] === "object"
        ) {
          if (type === ("view_form_step" as string)) {
            (stepCounts[step as keyof typeof stepCounts] as any).view++;
          } else if (type === ("form_step_complete" as string)) {
            (stepCounts[step as keyof typeof stepCounts] as any).complete++;
          }
        }

        if (type === ("booking_abandoned" as string)) {
          stepCounts.booking_abandoned++;
        }
      }
    });
  });

  // Prepare chart data
  return {
    labels: [
      "Booking Started",
      "Selection View",
      "Selection Complete",
      "Date & Time View",
      "Date & Time Complete",
      "Your Info View",
      "Your Info Complete",
      "Extras View",
      "Extras Complete",
      "Review View",
      "Review Complete",
      "Payment View",
      "Payment Complete",
      "Booking Submitted",
    ],
    datasets: [
      {
        label: "Checkout Funnel",
        data: [
          stepCounts.booking_started,
          stepCounts.selection.view,
          stepCounts.selection.complete,
          stepCounts.datetime.view,
          stepCounts.datetime.complete,
          stepCounts.details.view,
          stepCounts.details.complete,
          stepCounts.extras.view,
          stepCounts.extras.complete,
          stepCounts.review.view,
          stepCounts.review.complete,
          stepCounts.payment.view,
          stepCounts.payment.complete,
          stepCounts.booking_submitted,
        ],
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(255, 159, 64, 0.8)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Get step-specific abandonment data
 */
export function getStepAbandonmentData(visitors: IVisitor[]) {
  // Count views, errors, and abandonments by step
  const stepData = {
    selection: { views: 0, errors: 0, abandonments: 0 },
    datetime: { views: 0, errors: 0, abandonments: 0 },
    details: { views: 0, errors: 0, abandonments: 0 },
    extras: { views: 0, errors: 0, abandonments: 0 },
    review: { views: 0, errors: 0, abandonments: 0 },
    payment: { views: 0, errors: 0, abandonments: 0 },
  };

  // Process all visitors
  visitors.forEach((visitor) => {
    // Process checkout interactions
    visitor.interactions?.forEach((interaction) => {
      if (interaction.element === "checkout-form") {
        const step = interaction.data?.step;
        const type = interaction.type;

        if (step && stepData[step as keyof typeof stepData]) {
          if (type === ("view_form_step" as string)) {
            stepData[step as keyof typeof stepData].views++;
          } else if (type === ("form_step_error" as string)) {
            stepData[step as keyof typeof stepData].errors++;
          } else if (type === ("booking_abandoned" as string)) {
            stepData[step as keyof typeof stepData].abandonments++;
          }
        }
      }
    });
  });

  // Calculate abandonment rates
  const abandonmentRates = Object.entries(stepData).map(([step, data]) => ({
    step,
    rate: data.views > 0 ? (data.abandonments / data.views) * 100 : 0,
    errorRate: data.views > 0 ? (data.errors / data.views) * 100 : 0,
  }));

  // Prepare chart data
  return {
    labels: abandonmentRates.map((item) => {
      switch (item.step) {
        case "selection":
          return "Choose Bounce House";
        case "datetime":
          return "Date & Time";
        case "details":
          return "Your Info";
        case "extras":
          return "Add Extras";
        case "review":
          return "Review Order";
        case "payment":
          return "Payment";
        default:
          return (
            item.step.charAt(0).toUpperCase() + item.step.slice(1) + " Step"
          );
      }
    }),
    datasets: [
      {
        label: "Abandonment Rate (%)",
        data: abandonmentRates.map((item) => item.rate),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Error Rate (%)",
        data: abandonmentRates.map((item) => item.errorRate),
        backgroundColor: "rgba(255, 159, 64, 0.6)",
        borderColor: "rgba(255, 159, 64, 1)",
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Get form field friction data
 */
export function getFieldFrictionData(visitors: IVisitor[]) {
  // Count field interactions and errors
  const fieldData: Record<string, { interactions: number; errors: number }> =
    {};

  // Process all visitors
  visitors.forEach((visitor) => {
    // Process field interactions
    visitor.interactions?.forEach((interaction) => {
      if (
        interaction.element &&
        interaction.element.startsWith("checkout-form-field-")
      ) {
        const field = interaction.data?.field;

        if (field) {
          if (!fieldData[field]) {
            fieldData[field] = { interactions: 0, errors: 0 };
          }

          fieldData[field].interactions++;

          // Check if there was an error with this field
          if (interaction.data?.error) {
            fieldData[field].errors++;
          }
        }
      }
    });

    // Process form step errors
    visitor.interactions?.forEach((interaction) => {
      if (
        interaction.type === ("form_step_error" as string) &&
        interaction.data?.errors
      ) {
        const errors = interaction.data.errors as Record<string, string>;

        Object.keys(errors).forEach((field) => {
          if (!fieldData[field]) {
            fieldData[field] = { interactions: 1, errors: 1 };
          } else {
            fieldData[field].errors++;
          }
        });
      }
    });
  });

  // Calculate error rates
  const fieldErrorRates = Object.entries(fieldData)
    .map(([field, data]) => ({
      field,
      errorRate:
        data.interactions > 0 ? (data.errors / data.interactions) * 100 : 0,
    }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 10); // Top 10 fields with highest error rates

  // Prepare chart data
  return {
    labels: fieldErrorRates.map(
      (item) =>
        item.field.charAt(0).toUpperCase() +
        item.field
          .slice(1)
          .replace(/([A-Z])/g, " $1")
          .trim(),
    ),
    datasets: [
      {
        label: "Error Rate (%)",
        data: fieldErrorRates.map((item) => item.errorRate),
        backgroundColor: fieldErrorRates.map((item) =>
          item.errorRate > 20
            ? "rgba(255, 99, 132, 0.6)"
            : item.errorRate > 10
              ? "rgba(255, 159, 64, 0.6)"
              : "rgba(75, 192, 192, 0.6)",
        ),
        borderColor: fieldErrorRates.map((item) =>
          item.errorRate > 20
            ? "rgba(255, 99, 132, 1)"
            : item.errorRate > 10
              ? "rgba(255, 159, 64, 1)"
              : "rgba(75, 192, 192, 1)",
        ),
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Get device behavior data for checkout
 */
export function getCheckoutDeviceData(visitors: IVisitor[]) {
  // Count starts and completions by device
  const deviceCounts = {
    starts: { Mobile: 0, Desktop: 0, Tablet: 0 },
    completions: { Mobile: 0, Desktop: 0, Tablet: 0 },
  };

  // Process all visitors
  visitors.forEach((visitor) => {
    const device = visitor.device || "Desktop";

    // Check for booking_started events
    if (visitor.conversionEvents?.some((e) => e.type === "booking_started")) {
      deviceCounts.starts[device as keyof typeof deviceCounts.starts]++;
    }

    // Check for booking_completed events
    if (visitor.conversionEvents?.some((e) => e.type === "booking_completed")) {
      deviceCounts.completions[
        device as keyof typeof deviceCounts.completions
      ]++;
    }
  });

  // Prepare chart data for starts
  const startsData = {
    labels: ["Mobile", "Desktop", "Tablet"],
    datasets: [
      {
        label: "Checkout Starts by Device",
        data: [
          deviceCounts.starts.Mobile,
          deviceCounts.starts.Desktop,
          deviceCounts.starts.Tablet,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for completions
  const completionsData = {
    labels: ["Mobile", "Desktop", "Tablet"],
    datasets: [
      {
        label: "Checkout Completions by Device",
        data: [
          deviceCounts.completions.Mobile,
          deviceCounts.completions.Desktop,
          deviceCounts.completions.Tablet,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return {
    starts: startsData,
    completions: completionsData,
    // Calculate completion rates by device
    completionRates: {
      Mobile:
        deviceCounts.starts.Mobile > 0
          ? (deviceCounts.completions.Mobile / deviceCounts.starts.Mobile) * 100
          : 0,
      Desktop:
        deviceCounts.starts.Desktop > 0
          ? (deviceCounts.completions.Desktop / deviceCounts.starts.Desktop) *
            100
          : 0,
      Tablet:
        deviceCounts.starts.Tablet > 0
          ? (deviceCounts.completions.Tablet / deviceCounts.starts.Tablet) * 100
          : 0,
    },
  };
}

/**
 * Get visitor checkout journeys
 */
export function getVisitorCheckoutJourneys(
  visitors: IVisitor[],
  limit: number = 10,
) {
  // Filter visitors who have checkout interactions
  const checkoutVisitors = visitors.filter((visitor) =>
    visitor.interactions?.some(
      (i) =>
        i.element === "checkout-form" ||
        (i.element && i.element.startsWith("checkout-form-field-")),
    ),
  );

  // Process visitor journeys
  const journeys = checkoutVisitors.map((visitor) => {
    // Get checkout interactions
    const checkoutInteractions =
      visitor.interactions?.filter(
        (i) =>
          i.element === "checkout-form" ||
          i.element?.startsWith("checkout-form-field-"),
      ) || [];

    // Get steps viewed
    const stepsViewed = new Set<string>();
    checkoutInteractions.forEach((i) => {
      if (i.type === ("view_form_step" as string) && i.data?.step) {
        stepsViewed.add(i.data.step as string);
      }
    });

    // Get steps completed
    const stepsCompleted = new Set<string>();
    checkoutInteractions.forEach((i) => {
      if (i.type === ("form_step_complete" as string) && i.data?.step) {
        stepsCompleted.add(i.data.step as string);
      }
    });

    // Get errors
    const errors = new Set<string>();
    checkoutInteractions.forEach((i) => {
      if (i.type === ("form_step_error" as string) && i.data?.errors) {
        const errorFields = Object.keys(
          i.data.errors as Record<string, string>,
        );
        errorFields.forEach((field) => errors.add(field));
      }
    });

    // Determine outcome
    let outcome = "Abandoned";
    if (visitor.conversionEvents?.some((e) => e.type === "booking_completed")) {
      outcome = "Completed";
    } else if (
      visitor.conversionEvents?.some((e) => e.type === "booking_started")
    ) {
      outcome = "Started";
    }

    return {
      visitorId: visitor.visitorId,
      stepsViewed: Array.from(stepsViewed),
      stepsCompleted: Array.from(stepsCompleted),
      errors: Array.from(errors),
      outcome,
      device: visitor.device,
      lastVisit: visitor.lastVisit,
    };
  });

  // Sort by last visit (most recent first) and limit
  return journeys
    .sort(
      (a, b) =>
        new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime(),
    )
    .slice(0, limit);
}
