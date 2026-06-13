import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [pendingOtp, setPendingOtp] = useState(null);

  const applyTheme = (nextTheme) => {
    const normalizedTheme = nextTheme === "light" ? "light" : "dark";
    setTheme(normalizedTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", normalizedTheme);
      document.documentElement.classList.toggle("dark", normalizedTheme === "dark");
    }
  };

  const login = (userdata, authToken, nextTheme) => {
    setUser(userdata);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(userdata));
    }
    if (authToken && typeof window !== "undefined") {
      setToken(authToken);
      localStorage.setItem("authToken", authToken);
    }
    if (nextTheme) applyTheme(nextTheme);
  };
  const logout = async () => {
    setUser(null);
    setToken(null);
    setPendingOtp(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };
  const getLocationPayload = async () => {
    if (!navigator.geolocation) return {};
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
        });
      });
      const { latitude, longitude } = position.coords;
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await res.json();
      return {
        city: data.city || data.locality || "Unknown city",
        state: data.principalSubdivision || "",
      };
    } catch (error) {
      return {};
    }
  };

  const startPlatformLogin = async (firebaseuser) => {
    const locationPayload = await getLocationPayload();
    const payload = {
      email: firebaseuser.email,
      name: firebaseuser.displayName,
      image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      ...locationPayload,
    };
    const response = await axiosInstance.post("/user/login", payload);
    if (response.data.theme) applyTheme(response.data.theme);
    if (response.data.requiresOtp || response.data.requiresMobile) {
      setPendingOtp(response.data);
      return;
    }
    login(response.data.result, response.data.token, response.data.theme);
  };

  const refreshAccessTheme = async (fallbackUser) => {
    if (typeof window === "undefined") return;

    try {
      const locationPayload = await getLocationPayload();
      const authToken = localStorage.getItem("authToken");
      const endpoint = authToken ? "/user/refresh-theme" : "/user/access-theme";
      const response = await axiosInstance.post(endpoint, {
        city: locationPayload.city || fallbackUser?.city,
        state: locationPayload.state || fallbackUser?.state,
      });

      if (response.data.theme) {
        applyTheme(response.data.theme);
      }
    } catch (error) {
      console.error("Could not refresh access theme:", error);
    }
  };

  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      await startPlatformLogin(result.user);
    } catch (error) {
      console.error(error);
    }
  };

  const requestOtp = async ({ mobile } = {}) => {
    if (!pendingOtp?.userId) return;
    const response = await axiosInstance.post("/user/request-otp", {
      userId: pendingOtp.userId,
      mobile,
    });
    if (response.data.theme) applyTheme(response.data.theme);
    setPendingOtp(response.data);
  };

  const verifyOtp = async (otp) => {
    if (!pendingOtp?.userId) return;
    const response = await axiosInstance.post("/user/verify-otp", {
      userId: pendingOtp.userId,
      otp,
    });
    setPendingOtp(null);
    login(response.data.result, response.data.token, response.data.theme);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");
    const storedTheme = localStorage.getItem("theme") || "dark";
    const hasStoredUser = Boolean(storedUser);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        void refreshAccessTheme(parsedUser);
      } catch (error) {
        localStorage.removeItem("user");
      }
    }

    if (storedToken) setToken(storedToken);
    applyTheme(storedTheme);

    if (!storedUser) {
      void refreshAccessTheme(null);
    }

    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser && !hasStoredUser) {
        try {
          await startPlatformLogin(firebaseuser);
        } catch (error) {
          console.error(error);
          logout();
        }
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        theme,
        pendingOtp,
        login,
        logout,
        handlegooglesignin,
        requestOtp,
        verifyOtp,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
