"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import LoadingButton from "@/components/buttons/loading_button";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  async function handleLogin() {
    if (!username || !password) {
      toast.error("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.success);
        router.push("/");
      } else if (result.code === "EMAIL_NOT_VERIFIED") {
        setResendMessage("");
        setResendError("");
        setVerificationEmail("");
        setShowVerificationModal(true);
      } else {
        toast.error(result.error || "Unable to sign in.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    const email = verificationEmail.trim().toLowerCase();

    if (!email) {
      setResendError("Please enter your email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setResendError("Please enter a valid email address.");
      return;
    }

    try {
      setResending(true);
      setResendError("");
      setResendMessage("");

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setResendError(
          response.status === 429
            ? "Too many requests. Please wait a little while before trying again."
            : result.error || "Unable to request a verification email. Please try again."
        );
        return;
      }

      setResendMessage(
        result.message ||
          "If your account needs verification, a verification email will be sent."
      );
    } catch (error) {
      console.error(error);
      setResendError("Unable to connect to the server. Please try again.");
    } finally {
      setResending(false);
    }
  }

  function closeVerificationModal() {
    if (resending) return;

    setShowVerificationModal(false);
    setResendMessage("");
    setResendError("");
    setVerificationEmail("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Login card */}
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
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to your Green Office account
            </p>
          </div>

          {/* Username */}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Username
            </label>

            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div className="mb-6 flex">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Login button */}
          <LoadingButton
            onClick={handleLogin}
            loading={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Login
          </LoadingButton>

          <p className="mt-6 text-center text-sm text-slate-500">
            New to Green Office?{" "}
            <Link
              href="/signup"
              className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Green Office Management System
        </p>
      </div>

      {/* Email verification modal */}
      {showVerificationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeVerificationModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-6 w-6 text-amber-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 8.25v8.25A2.25 2.25 0 0 1 19.5 18.75h-15A2.25 2.25 0 0 1 2.25 16.5V8.25m19.5 0A2.25 2.25 0 0 0 19.5 6h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0-8.69 5.36a2.25 2.25 0 0 1-2.36 0L2.25 8.25"
                />
              </svg>
            </div>

            <h2
              id="verification-modal-title"
              className="text-xl font-semibold text-slate-900"
            >
              Verify your email address
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your account needs email verification before you can sign in.
              Enter the email address associated with your account and we&apos;ll
              send you a verification link.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleResendVerification();
              }}
              className="mt-6"
            >
              <label
                htmlFor="verification-email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <input
                id="verification-email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={verificationEmail}
                onChange={(event) => {
                  setVerificationEmail(event.target.value);
                  setResendError("");
                  setResendMessage("");
                }}
                disabled={resending || Boolean(resendMessage)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
              />

              {resendError && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {resendError}
                </p>
              )}

              {resendMessage && (
                <div
                  role="status"
                  className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-800"
                >
                  {resendMessage}
                  <p className="mt-2">
                    Check your inbox and spam folder. If an email arrives, open
                    the link and complete verification before signing in.
                  </p>
                </div>
              )}

              {!resendMessage && (
                <button
                  type="submit"
                  disabled={resending}
                  className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={closeVerificationModal}
              disabled={resending}
              className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resendMessage ? "Close" : "Cancel"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}