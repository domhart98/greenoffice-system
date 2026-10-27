"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token || !/^[a-fA-F0-9]{64}$/.test(token)) {
      setError(
        "This password reset link is invalid. Please request a new one."
      );
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Your password must not exceed 72 bytes.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.error ||
            "Unable to reset your password. Please request a new link."
        );
        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password reset failed:", err);
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
              Reset your password
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose a new password for your Green Office account.
            </p>
          </div>

          {success ? (
            <div>
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
              >
                Your password has been reset successfully. You can now sign in
                using your new password.
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* New password */}
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  New password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your new password"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
                />
              </div>

              {/* Confirm password */}
              <div className="mb-5">
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Confirm new password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
                />
              </div>

              {error && (
                <p role="alert" className="mb-5 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Resetting password..." : "Reset password"}
              </button>
            </form>
          )}

          {!success && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Back to login
              </Link>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Green Office Management System
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <p className="text-sm text-slate-500">Loading...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}