"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  Search,
  Plus,
  ChevronDown,
  FileText,
  UsersRound,
  Package,
  Receipt,
  ShoppingCart,
  Settings,
  Building2,
  Calculator,
  Warehouse,
  UserCircle,
  LogOut,
} from "lucide-react";

interface NavbarProps {
  user: {
    username: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  const initial = user.username.charAt(0).toUpperCase();

  const navbarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target as Node)
      ) {
        setNewMenuOpen(false);
        setSettingsMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const closeMenus = () => {
    setNewMenuOpen(false);
    setSettingsMenuOpen(false);
    setProfileMenuOpen(false);
  };

  return (
    <header
      ref={navbarRef}
      className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-6 print:hidden"
    >
      <div className="flex w-64 shrink-0 items-center">
        <Link href="/">
          <Image
            src="/images/icons/greenoffice-logo.webp"
            alt="GreenOffice"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <div className="flex min-w-0 flex-1">
        <div className="relative flex w-full max-w-xl items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />

          <input
            type="text"
            placeholder="Search GreenOffice..."
            className="
              h-9 w-full
              rounded-lg
              border border-slate-200
              bg-slate-50
              pl-9 pr-4
              text-sm text-slate-700
              outline-none
              placeholder:text-slate-400
              transition
              focus:border-emerald-500
              focus:bg-white
              focus:ring-1
              focus:ring-emerald-500
            "
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNewMenuOpen((prev) => !prev);
              setProfileMenuOpen(false);
              setSettingsMenuOpen(false);
            }}
            className="
              inline-flex h-9
              items-center gap-2
              rounded-lg
              bg-emerald-600
              px-3.5
              text-sm font-medium
              text-white
              transition
              hover:bg-emerald-700
              focus:outline-none
              focus:ring-2
              focus:ring-emerald-500
              focus:ring-offset-1
            "
          >
            <Plus className="h-4 w-4" />

            <span>New</span>

            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ${
                newMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {newMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">

              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Create New
              </div>

              <Link
                href="/invoices/new"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span>Invoice</span>
              </Link>

              <Link
                href="/customers/new"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <UsersRound className="h-4 w-4 text-slate-400" />
                <span>Customer</span>
              </Link>

              <Link
                href="/products/new"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Package className="h-4 w-4 text-slate-400" />
                <span>Product</span>
              </Link>

              <Link
                href="/expenses/new"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Receipt className="h-4 w-4 text-slate-400" />
                <span>Expense</span>
              </Link>
              
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setSettingsMenuOpen((prev) => !prev);
              setNewMenuOpen(false);
              setProfileMenuOpen(false);
            }}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-800
            "
            aria-label="Settings"
            aria-expanded={settingsMenuOpen}
          >
            <Settings className="h-5 w-5" />
          </button>

          {settingsMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">

              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Settings
              </div>

              <Link
                href="/settings/business"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>Business Settings</span>
              </Link>

              <Link
                href="/settings/invoices"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FileText className="h-4 w-4 text-slate-400" />
                <span>Invoice Settings</span>
              </Link>

              <Link
                href="/settings/taxes"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Calculator className="h-4 w-4 text-slate-400" />
                <span>Tax Settings</span>
              </Link>

              <Link
                href="/settings/inventory"
                onClick={closeMenus}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Warehouse className="h-4 w-4 text-slate-400" />
                <span>Inventory Settings</span>
              </Link>
            </div>
          )}
        </div>

        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen((prev) => !prev);
              setNewMenuOpen(false);
              setSettingsMenuOpen(false);
            }}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-full
              bg-emerald-100
              text-sm font-semibold
              text-emerald-700
              transition
              hover:bg-emerald-200
            "
            aria-label="Profile"
            aria-expanded={profileMenuOpen}
          >
            {initial}
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">

              {/* User */}
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                    {initial}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {user.username}
                    </div>

                    <div className="mt-0.5 text-xs text-slate-500">
                      Account
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="p-1.5">

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <UserCircle className="h-4 w-4 text-slate-400" />
                  Profile
                </button>

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  Account Settings
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                  onClick={async () => {
                    await fetch("/api/logout", {
                      method: "POST",
                    });

                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}