import React, { createContext, useState, useEffect, useCallback } from "react";
import { getCurrentUser, logout as logoutRequest } from "../services/authService";

export const AuthContext = createContext(null);

/**
 * Holds the current user, their role (patient/doctor), and authentication state.
 * Validates the stored JWT on startup against GET /auth/me and restores session.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem("user_role"));
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app load
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        if (isMounted) {
          setUser(null);
          setRole(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (isMounted) {
          setUser(userData);
          setRole(userData.role);
          localStorage.setItem("user_role", userData.role);
        }
      } catch (err) {
        if (isMounted) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user_role");
          setUser(null);
          setRole(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    // Listen for unauthorized 401 events from the API client
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
        setRole(null);
      }
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = useCallback((userData, userRole, token) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user_role", userRole);
    setUser(userData);
    setRole(userRole);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_role");
      setUser(null);
      setRole(null);
    }
  }, []);

  const value = {
    user,
    role,
    isAuthenticated: Boolean(role && (user || localStorage.getItem("access_token"))),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

