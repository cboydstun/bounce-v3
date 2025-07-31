import React, { useMemo } from "react";
import { Route, Redirect } from "react-router-dom";
import { useAuthStore, authSelectors } from "../../store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  exact?: boolean;
  path?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = React.memo(
  ({ children, exact, path, ...routeProps }) => {
    const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);

    // Memoize the render function to prevent unnecessary re-renders
    const renderFunction = useMemo(() => {
      return ({ location }: any) => {
        if (!isAuthenticated) {
          return (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: location },
              }}
            />
          );
        }
        return children;
      };
    }, [isAuthenticated, children]);

    return (
      <Route
        exact={exact}
        path={path}
        {...routeProps}
        render={renderFunction}
      />
    );
  },
);

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
