import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Error reading saved user:", error);
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // LOGIN
  const login = async (username, password) => {
    setLoading(true);

    try {
      const response = await api.post("auth/login/", {
        username,
        password,
      });

      const {
        access,
        refresh,
        user: userData,
      } = response.data;

      // Save JWT tokens
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      // Create complete user object
      const loggedInUser = {
        id: userData?.id,
        username: userData?.username || username,
        role: userData?.role || null,

        // IMPORTANT:
        // Keep 0 as a valid value and only use null
        // when base_id is actually missing.
        base_id: userData?.base_id ?? null,
      };

      // Debug messages
      console.log("LOGIN USER FROM API:", userData);
      console.log("USER SAVED TO LOCALSTORAGE:", loggedInUser);

      // Save user information
      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      // Update React state
      setUser(loggedInUser);

      return {
        success: true,
      };

    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        message:
          error.response?.data?.detail ||
          "Invalid username or password.",
      };

    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const logout = async () => {
    const refreshToken =
      localStorage.getItem("refresh_token");

    try {
      if (refreshToken) {
        await api.post(
          "auth/logout/",
          {
            refresh: refreshToken,
          }
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear authentication data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    // Clear React user state
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}