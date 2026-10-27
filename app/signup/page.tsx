"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import LoadingButton from "@/components/buttons/loading_button";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (
      !username.trim() ||
      !email.trim() ||
      !businessName.trim() ||
      !password ||
      !confirmPassword
    ) {
      toast.error("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Your passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Your password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          businessName,
          businessType,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || "Unable to create your account.");
        return;
      }

      toast.success(result.message || "Account created successfully.");

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Signup request failed:", error);
      toast.error("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-7 flex justify-center">
            <Image
              src="/images/icons/greenoffice-logo.webp"
              alt="Green Office"
              width={220}
              height={63}
              className="h-auto w-52"
              priority
            />
          </div>

          <div className="mb-7 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Get started with Green Office
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="username" className={labelClass}>
              Username
            </label>

            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              maxLength={100}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className={labelClass}>
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              maxLength={255}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="businessName" className={labelClass}>
              Business name
            </label>

            <input
              id="businessName"
              type="text"
              autoComplete="organization"
              placeholder="Your business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={inputClass}
              maxLength={255}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="businessName" className={labelClass}>
              Business Type
            </label>

            <input
              id="businessType"
              type="text"
              autoComplete="type"
              placeholder="type of business"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={inputClass}
              maxLength={255}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm password
            </label>

            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSignup();
                }
              }}
              className={inputClass}
            />
          </div>

          <LoadingButton
            onClick={handleSignup}
            loading={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create Account
          </LoadingButton>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Sign in
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