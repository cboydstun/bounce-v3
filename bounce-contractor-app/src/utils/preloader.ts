/**
 * Preloader utility for lazy-loaded components
 * Preloads critical chunks to improve perceived performance
 */

// Preload functions for each route
export const preloadAvailableTasks = () =>
  import("../pages/tasks/AvailableTasks");
export const preloadMyTasks = () => import("../pages/tasks/MyTasks");
export const preloadProfile = () => import("../pages/profile/Profile");
export const preloadNotifications = () =>
  import("../pages/notifications/NotificationCenter");
export const preloadTaskDetails = () => import("../pages/tasks/TaskDetails");

// Preload critical chunks after initial render
export const preloadCriticalChunks = () => {
  // Preload the most likely next pages
  setTimeout(() => {
    preloadMyTasks();
    preloadProfile();
  }, 2000); // Wait 2 seconds after initial load

  // Preload secondary pages
  setTimeout(() => {
    preloadNotifications();
    preloadTaskDetails();
  }, 5000); // Wait 5 seconds for secondary pages
};

// Preload specific chunks based on current route
export const preloadRouteChunks = (currentRoute: string) => {
  switch (currentRoute) {
    case "/available-tasks":
      // User is on available tasks, likely to go to my tasks or task details
      preloadMyTasks();
      preloadTaskDetails();
      break;
    case "/my-tasks":
      // User is on my tasks, likely to go to task details or available tasks
      preloadTaskDetails();
      preloadAvailableTasks();
      break;
    case "/profile":
      // User is on profile, might go to notifications or back to tasks
      preloadNotifications();
      preloadAvailableTasks();
      break;
    case "/notifications":
      // User is on notifications, likely to go back to tasks
      preloadAvailableTasks();
      preloadMyTasks();
      break;
    default:
      // Default preloading for unknown routes
      preloadAvailableTasks();
      break;
  }
};

// Preload on user interaction (hover, focus)
export const preloadOnInteraction = (targetRoute: string) => {
  switch (targetRoute) {
    case "/available-tasks":
      preloadAvailableTasks();
      break;
    case "/my-tasks":
      preloadMyTasks();
      break;
    case "/profile":
      preloadProfile();
      break;
    case "/notifications":
      preloadNotifications();
      break;
    default:
      break;
  }
};
