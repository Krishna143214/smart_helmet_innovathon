"use client";

import { useCallback, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  limitToLast,
  onValue,
  orderByKey,
  query,
  ref,
  set,
} from "firebase/database";
import { auth, db } from "@/lib/firebase/config";
import type {
  FirebaseConnectionStatus,
  HelmetHistoryData,
  HelmetHistoryRecord,
  LiveHelmetTelemetry,
} from "@/lib/types";

function messageForError(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  const messages: Record<string, string> = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-not-found": "No Firebase account exists with that email.",
    "auth/wrong-password": "The Firebase password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests":
      "Too many sign-in attempts. Wait a moment and try again.",
    "auth/unauthorized-domain":
      "Add this site to Firebase Authentication's authorized domains.",
    "auth/network-request-failed":
      "Network request failed. Check your connection.",
    PERMISSION_DENIED:
      "Firebase denied access. Check the Realtime Database rules.",
  };

  return (
    messages[code] ??
    (error instanceof Error
      ? error.message
      : "An unexpected Firebase error occurred.")
  );
}

function normalizeHistory(
  raw: HelmetHistoryData | null,
): HelmetHistoryRecord[] {
  if (!raw || typeof raw !== "object") return [];

  return Object.entries(raw)
    .map(([key, record]) => ({ key, ...(record ?? {}) }))
    .sort((a, b) => a.key.localeCompare(b.key))
    
}

export function useDashboardData() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] =
    useState<FirebaseConnectionStatus>("connecting");
  const [live, setLive] = useState<LiveHelmetTelemetry | null>(null);
  const [history, setHistory] = useState<HelmetHistoryRecord[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [buzzerOn, setBuzzerOn] = useState(false);
  const [buzzerBusy, setBuzzerBusy] = useState(false);
  const [buzzerAvailable, setBuzzerAvailable] = useState(false);
  const [buzzerError, setBuzzerError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setAuthLoading(false);
        setLoginError(null);
      },
      (error) => {
        setLoginError(messageForError(error));
        setAuthLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setLive(null);
      setHistory([]);
      setHistoryLoaded(false);
      setBuzzerOn(false);
      setBuzzerAvailable(false);
      setBuzzerError(null);
      setFirebaseStatus("disconnected");
      return;
    }

    setBuzzerAvailable(false);
    setBuzzerError(null);
    setFirebaseStatus("connecting");

    const unsubscribeConnection = onValue(
      ref(db, ".info/connected"),
      (snapshot) =>
        setFirebaseStatus(
          snapshot.val() === true ? "connected" : "disconnected",
        ),
      (error) => {
        setFirebaseStatus("error");
        setNotice(messageForError(error));
      },
    );

    const unsubscribeLive = onValue(
      ref(db, "MiningHelmet/live"),
      (snapshot) => {
        const value = snapshot.val() as LiveHelmetTelemetry | null;
        setLive(value);
        if (!value)
          setNotice(
            "Connected to Firebase, but /MiningHelmet/live has no data yet.",
          );
      },
      (error) => {
        setFirebaseStatus("error");
        setNotice(`Live data read failed: ${messageForError(error)}`);
      },
    );

    const historyQuery = query(
      ref(db, "MiningHelmet/history"),
      orderByKey()
    );
    const unsubscribeHistory = onValue(
      historyQuery,
      (snapshot) => {
        setHistory(
          normalizeHistory(snapshot.val() as HelmetHistoryData | null),
        );
        setHistoryLoaded(true);
      },
      (error) => setNotice(`History read failed: ${messageForError(error)}`),
    );

    const unsubscribeBuzzer = onValue(
      ref(db, "MiningHelmet/commands/dashboardBuzzer"),
      (snapshot) => {
        setBuzzerOn(snapshot.val() === true);
        setBuzzerAvailable(true);
        setBuzzerError(null);
      },
      (error) => {
        const message = messageForError(error);
        setBuzzerAvailable(false);
        setBuzzerError(`Cannot read buzzer command: ${message}`);
        setNotice(`Buzzer command read failed: ${message}`);
      },
    );

    return () => {
      unsubscribeConnection();
      unsubscribeLive();
      unsubscribeHistory();
      unsubscribeBuzzer();
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoginError(messageForError(error));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setNotice(`Sign out failed: ${messageForError(error)}`);
    }
  }, []);

  const setDashboardBuzzer = useCallback(async (enabled: boolean) => {
    setBuzzerBusy(true);
    setBuzzerError(null);
    setBuzzerOn(enabled);
    try {
      await set(ref(db, "MiningHelmet/commands/dashboardBuzzer"), enabled);
      setNotice(`Dashboard buzzer command set to ${enabled ? "ON" : "OFF"}.`);
    } catch (error) {
      const message = messageForError(error);
      setBuzzerOn(!enabled);
      setBuzzerError(`Command failed: ${message}`);
      setNotice(`Could not change buzzer: ${message}`);
    } finally {
      setBuzzerBusy(false);
    }
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  return {
    user,
    authLoading,
    firebaseStatus,
    live,
    history,
    historyLoaded,
    buzzerOn,
    buzzerBusy,
    buzzerAvailable,
    buzzerError,
    loginError,
    notice,
    login,
    logout,
    setDashboardBuzzer,
    setNotice,
    clearNotice,
  };
}
