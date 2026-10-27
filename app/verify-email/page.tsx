"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleVerify() {
    if (!token || !/^[a-fA-F0-9]{64}$/.test(token)) {
      setStatus("error");
      setMessage("This verification link is invalid or incomplete.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus("error");
        setMessage(
          data.error || "Unable to verify your email. Please try again."
        );
        return;
      }

      setStatus("success");
      setMessage(
        data.message || "Your email has been verified successfully."
      );
    } catch {
      setStatus("error");
      setMessage(
        "We couldn't reach the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const invalidToken = !token || !/^[a-fA-F0-9]{64}$/.test(token);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Verify your email
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Verify your email address to finish setting up your Green Office
            account.
          </p>
        </div>

        {status === "idle" && (
          <>
            {invalidToken ? (
              <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                This verification link is invalid or incomplete. Please use
                the link from your verification email.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading}
                className="w-full rounded-md bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify Email Address"}
              </button>
            )}
          </>
        )}

        {status !== "idle" && (
          <div
            role="status"
            className={`rounded-md p-4 text-sm ${
              status === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {status === "success" && (
          <a
            href="/login"
            className="mt-6 block w-full rounded-md bg-green-700 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-800"
          >
            Continue to Login
          </a>
        )}

        {status === "error" && (
          <a
            href="/login"
            className="mt-6 block text-center text-sm font-medium text-green-800 underline"
          >
            Return to Login
          </a>
        )}

        <p className="mt-8 text-center text-xs text-gray-500">
          Green Office
        </p>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-600">Loading verification page...</p>
        </main>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}