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
  exact,
  path,
  ...routeProps
}) => {
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);

  return (
    <Route
      exact={exact}
      path={path}
      {...routeProps}
      render={({ location }) => {
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
      }}
    />
  );
};

export default ProtectedRoute;
