import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FullPageLoader } from "../ui/FullPageLoader";
import { ErrorState } from "../ui/ErrorState";

// Gates a role's app shell: bounces to /login when signed out, and to the
// caller's own dashboard when signed in as the wrong role (e.g. a patient
// hitting /admin directly).
export function RequireRole({ role, children }) {
  const { user, token, isLoading, authCheckFailed, retryAuthCheck } = useAuth();

  if (isLoading) return <FullPageLoader />;
  // A token exists but the last verification attempt failed for a reason
  // other than "invalid token" (network blip, backend down) — don't punt
  // a still-valid session to the login screen, offer a retry instead.
  if (!user && token && authCheckFailed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
        <ErrorState message="Couldn't verify your session." onRetry={retryAuthCheck} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  return children;
}

// Keeps a signed-in user out of /login and /register.
export function RedirectIfAuthed({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  return children;
}
