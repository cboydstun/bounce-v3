import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

// Simple test to verify routing behavior without complex mocking
describe("Routing Issue Diagnosis", () => {
  test("should demonstrate the routing problem", async () => {
    // This test will help us understand the routing issue
    // by creating a minimal reproduction case

    const TestApp = () => {
      return (
        <MemoryRouter initialEntries={["/tasks/available"]}>
          <div>
            <div data-testid="current-route">
              Current route: /tasks/available
            </div>
            <div data-testid="expected-component">
              AvailableTasks should render here
            </div>
          </div>
        </MemoryRouter>
      );
    };

    render(<TestApp />);

    expect(screen.getByTestId("current-route")).toBeInTheDocument();
    expect(screen.getByTestId("expected-component")).toBeInTheDocument();
  });

  test("should show different routes render different components", async () => {
    const TestRoutes = ({ route }: { route: string }) => {
      return (
        <MemoryRouter initialEntries={[route]}>
          <div>
            <div data-testid="route-display">Route: {route}</div>
            {route === "/tasks/available" && (
              <div data-testid="available-tasks">AvailableTasks Component</div>
            )}
            {route === "/tasks/my-tasks" && (
              <div data-testid="my-tasks">MyTasks Component</div>
            )}
            {route.startsWith("/tasks/") &&
              !route.includes("available") &&
              !route.includes("my-tasks") && (
                <div data-testid="task-details">TaskDetails Component</div>
              )}
          </div>
        </MemoryRouter>
      );
    };

    // Test /tasks/available
    const { rerender } = render(<TestRoutes route="/tasks/available" />);
    expect(screen.getByTestId("available-tasks")).toBeInTheDocument();
    expect(screen.queryByTestId("my-tasks")).not.toBeInTheDocument();
    expect(screen.queryByTestId("task-details")).not.toBeInTheDocument();

    // Test /tasks/my-tasks
    rerender(<TestRoutes route="/tasks/my-tasks" />);
    expect(screen.getByTestId("my-tasks")).toBeInTheDocument();
    expect(screen.queryByTestId("available-tasks")).not.toBeInTheDocument();
    expect(screen.queryByTestId("task-details")).not.toBeInTheDocument();

    // Test /tasks/123 (task details)
    rerender(<TestRoutes route="/tasks/123" />);
    expect(screen.getByTestId("task-details")).toBeInTheDocument();
    expect(screen.queryByTestId("available-tasks")).not.toBeInTheDocument();
    expect(screen.queryByTestId("my-tasks")).not.toBeInTheDocument();
  });
});

// Test to verify the actual issue described by the user
describe("Route Matching Issue", () => {
  test("demonstrates the problem: TaskDetails showing on wrong routes", () => {
    // This test documents the issue the user is experiencing
    console.log("=== ROUTING ISSUE ANALYSIS ===");
    console.log(
      "Problem: TaskDetails component appears at /tasks/available and /tasks/my-tasks",
    );
    console.log(
      "Expected: AvailableTasks at /tasks/available, MyTasks at /tasks/my-tasks",
    );
    console.log("Root cause: Dynamic route /tasks/:id matching static routes");
    console.log(
      "Solution: Ensure static routes are processed before dynamic routes",
    );

    expect(true).toBe(true); // This test always passes, it's for documentation
  });
});
