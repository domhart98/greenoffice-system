"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage(
          result.message ||
            "If an account exists for that email address, a password reset link will be sent."
        );
      } else {
        setError(
          result.error || "Unable to process your request. Please try again."
        );
      }
    } catch (err) {
      console.error("Forgot password request failed:", err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/images/icons/greenoffice-logo.webp"
              alt="Green Office"
              width={220}
              height={63}
              className="h-auto w-52"
              priority
            />
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Forgot your password?
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter the email address associated with your account. If an
              account matches, we&apos;ll send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="Enter your email address"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage("");
                  setError("");
                }}
                disabled={loading || Boolean(message)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
              />
            </div>

            {message && (
              <div
                role="status"
                className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"
              >
                {message}
                <p className="mt-2">
                  Check your inbox and spam folder. If the email arrives, open
                  the link to choose a new password.
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="mb-5 text-sm text-red-600">
                {error}
              </p>
            )}

            {!message && (
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending request..." : "Send reset link"}
              </button>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Green Office Management System
        </p>
      </div>
    </main>
  );
}