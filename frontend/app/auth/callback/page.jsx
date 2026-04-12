"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "../../utils/api.js";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setToken(token);
      router.replace("/");
    } else {
      router.replace("/login?error=oauth");
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0e1a",
      }}
    >
      <p style={{ color: "#4a5570", fontFamily: "'Syne', sans-serif" }}>
        Signing in…
      </p>
    </div>
  );
}
