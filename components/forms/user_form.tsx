"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserForm({
  mode,
  user,
}: {
  mode: "create" | "edit" | "view";
  user?: any;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.business_role || "VIEWER");
  const [email, setEmail] = useState(user?.email || "");
  const [isActive, setIsActive] = useState(user?.isActive || true);
  const [confirmPassword, setConfirmPassword] = useState("");
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const isCreateMode = mode === "create";

  async function handleCreateUser() {
    if (isViewMode) return;

    try{
      const response = await fetch("/api/users",
        {
          method: "POST",

          headers: {
            "Content-Type":"application/json",
          },

          body: JSON.stringify({
            username,
            password,
            confirmPassword,
            role,
            email,
            isActive,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        router.push("/users");
      }
    } catch (error) {
      console.log(error);    }
  };

  async function handleUpdateUser() {
    if (isViewMode) return;

    try{
      const response = await fetch(`/api/users/${user?.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":"application/json",
          },

          body: JSON.stringify({
            username,
            password,
            confirmPassword,
            role,
            email,
            isActive,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        router.push("/users");
      }
    } catch (error) {
      console.log(error);    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="form-card">

        {/* User Information */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title">
              User Information
            </h2>

            <p className="form-section-description">
              Create a user account and assign their access level.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Username */}
            <div>
              <label className="form-label">
                Username <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. john.smith"
                autoComplete="username"
                required
                disabled={isViewMode}
              />
            </div>

            {/* Email */}
            <div>
              <label className="form-label">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. john@example.com"
                autoComplete="email"
                disabled={isViewMode}
              />
            </div>

            {/* Role */}
            <div>
              <label className="form-label">
                Role <span className="text-red-500">*</span>
              </label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-select disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                required
                disabled={isViewMode}
              >
                <option value="ADMIN">Administrator</option>
                <option value="STAFF">Staff</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            {/* Active */}
            <div className="flex items-end">
              <label className="flex h-10 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={isViewMode}
                />

                <span className="text-sm font-medium text-slate-700">
                  Active Account
                </span>
              </label>
            </div>

          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Security */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title">
              Security
            </h2>

            <p className="form-section-description">
              Set the password used to sign in to GreenOffice.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Password */}
            <div>
              <label className="form-label">
                Password
                {mode === "create" && (
                  <span className="text-red-500"> *</span>
                )}
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder={
                  mode === "edit"
                    ? "Leave blank to keep current password"
                    : "Enter password"
                }
                autoComplete={
                  mode === "edit"
                    ? "new-password"
                    : "new-password"
                }
                required={mode === "create"}
                disabled={isViewMode}
              />

              {mode === "edit" && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Leave blank to keep the existing password.
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="form-label">
                Confirm Password
                {mode === "create" && (
                  <span className="text-red-500"> *</span>
                )}
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Confirm password"
                autoComplete="new-password"
                required={mode === "create"}
                disabled={isViewMode}
              />
            </div>

          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push("/users")}
            className="form-secondary-button"
          >
            {isViewMode ? "Back" : "Cancel"}
          </button>

          {isViewMode && user && (
            <button
              type="button"
              onClick={() => router.push(`/users/${user.id}/edit`)}
              disabled={loading}
              className="form-primary-button"
            >
              Edit user
            </button>
          )}

          {isCreateMode && (
            <button
              type="button"
              onClick={handleCreateUser}
              disabled={loading}
              className="form-primary-button"
            >
              Create user
            </button>
          )}

          {isEditMode && user && (
            <button
              type="button"
              onClick={handleUpdateUser}
              disabled={loading}
              className="form-primary-button"
            >
              Update user
            </button>
          )}
          
        </div>

      </div>
    </div>
  );
}