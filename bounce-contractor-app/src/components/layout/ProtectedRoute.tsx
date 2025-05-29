import React from "react";
import { Route, Redirect } from "react-router-dom";
import { useAuthStore, authSelectors } from "../../store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  exact?: boolean;
  path?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  ...routeProps
}) => {
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);

  return (
    <Route
      {...routeProps}
      render={({ location }) =>
        isAuthenticated ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location },
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute;
