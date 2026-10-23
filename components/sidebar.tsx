"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Warehouse,
  Package,
  ClipboardList,
  FileText,
  UsersRound,
  Receipt,
  ContactRound,
  BriefcaseBusiness,
  HandCoins,
  CreditCard,
  UserRoundCog,
  ChevronDown,
  ShoppingCart,
} from "lucide-react";

import "@/app/globals.css";

type SidebarProps = {
  role: string;
};

type NavChild = {
  label: string;
  href: string;
  roles?: string[];
};

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  children?: NavChild[];
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"],
    },
    {
      label: "Sales",
      icon: ShoppingCart,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"],
      children: [
        {
          label: "Invoices",
          href: "/invoices",
          roles: ["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"],
        },
        {
          label: "Customers",
          href: "/customers",
          roles: ["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"],
        },
        {
          label: "Accounts Receivable",
          href: "/accounts-receivable",
          roles: ["ADMIN", "MANAGER"],
        },
        {
          label: "Payments",
          href: "/payments",
          roles: ["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"],
        },
      ],
    },
    {
      label: "Inventory",
      icon: Warehouse,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"],
      children: [
        {
          label: "Products",
          href: "/products",
          roles: ["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"],
        },
        {
          label: "Purchase Orders",
          href: "/purchase-orders",
          roles: ["ADMIN", "MANAGER", "VIEWER"],
        },
      ],
    },
    {
      label: "Expenses",
      icon: Receipt,
      roles: ["ADMIN", "MANAGER", "VIEWER"],
      children: [
        {
          label: "Expenses",
          href: "/expenses",
          roles: ["ADMIN", "MANAGER", "VIEWER"],
        },
        {
          label: "Payees",
          href: "/payees",
          roles: ["ADMIN", "MANAGER", "VIEWER"],
        },
      ],
    },
    {
      label: "People",
      icon: UsersRound,
      roles: ["ADMIN", "MANAGER", "VIEWER"],
      children: [
        {
          label: "Employees",
          href: "/employees",
          roles: ["ADMIN", "MANAGER", "VIEWER"],
        },
      ],
    },
    {
      label: "Users",
      href: "/users",
      icon: UserRoundCog,
      roles: ["ADMIN"],
    },
    {
      label: "Reports",
      href: "/reports",
      icon: FileText,
      roles: ["ADMIN", "VIEWER"],
    },
  ];

  const isActive = (href: string) => {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  };

  const hasActiveChild = (item: NavItem) => {
    return item.children?.some((child) => isActive(child.href)) ?? false;
  };

  useEffect(() => {
    const activeMenus = navItems
      .filter((item) => hasActiveChild(item))
      .map((item) => item.label);

    setOpenMenus((current) => [
      ...new Set([...current, ...activeMenus]),
    ]);
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    );
  };

  const navItemClassName = (href: string) => {
    const active = isActive(href);

    return `
      flex items-center
      rounded-lg
      px-4 py-2.5
      text-sm font-medium
      transition-colors duration-150
      ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
      }
    `;
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white print:hidden">

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">

        <div className="space-y-2">

          {navItems
            .filter(
              (item) =>
                !item.roles ||
                item.roles.includes(role)
            )
            .map((item) => {
              const Icon = item.icon;

              if (!item.children) {
                return (
                  <Link
                    key={item.label}
                    href={item.href!}
                    className={navItemClassName(item.href!)}
                  >
                    <Icon className="mr-3 h-5 w-5 shrink-0" />

                    <span>
                      {item.label}
                    </span>
                  </Link>
                );
              }

              const isOpen = openMenus.includes(item.label);
              const activeChild = hasActiveChild(item);

              const visibleChildren = item.children.filter(
                (child) =>
                  !child.roles ||
                  child.roles.includes(role)
              );

              if (visibleChildren.length === 0) {
                return null;
              }

              return (
                <div key={item.label} className="space-y-1">

                  {/* Parent */}
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    aria-expanded={isOpen}
                    className={`
                      flex w-full items-center justify-between
                      rounded-lg
                      px-4 py-2.5
                      text-sm font-medium
                      transition-colors duration-150
                      ${
                        activeChild
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }
                    `}
                  >
                    <span className="flex items-center">
                      <Icon className="mr-3 h-5 w-5 shrink-0" />

                      {item.label}
                    </span>

                    <ChevronDown
                      className={`
                        h-4 w-4
                        transition-transform duration-200
                        ${isOpen ? "rotate-180" : ""}
                      `}
                    />
                  </button>

                  {/* Children */}
                  {isOpen && (
                    <div className="ml-5 space-y-1 border-l border-slate-200 pl-4">

                      {visibleChildren.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`
                            block
                            rounded-lg
                            px-3 py-2
                            text-sm
                            transition-colors duration-150
                            ${
                              isActive(child.href)
                                ? "bg-emerald-50 font-medium text-emerald-700"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }
                          `}
                        >
                          {child.label}
                        </Link>
                      ))}

                    </div>
                  )}
                </div>
              );
            })}

        </div>
      </nav>

      {/* Bottom user information */}
      <div className="border-t border-slate-200 p-4">

        <div className="mb-3 text-sm text-slate-600">
          Logged in as:

          <span className="ml-1 font-semibold text-slate-900">
            {role}
          </span>
        </div>

        <button
          type="button"
          onClick={async () => {
            await fetch("/api/logout", {
              method: "POST",
            });

            window.location.href = "/login";
          }}
          className="w-full rounded-lg bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
        >
          Logout
        </button>

      </div>
    </aside>
  );
}