"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Squares2X2Icon, Cog6ToothIcon, ArrowRightOnRectangleIcon, AcademicCapIcon } from "@heroicons/react/24/outline";

const NAV = [
  { href: "/admin/questions", label: "Questions", icon: Squares2X2Icon },
  { href: "/admin/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  const isActive = (href) => pathname.startsWith(href);

  return (
    <aside className="w-[248px] shrink-0 border-r bg-white flex flex-col sticky top-0 h-dvh z-10" aria-label="Admin">
      {/* Logo block */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-600 grid place-items-center shadow-sm">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-5 text-gray-600">EnglishTest Pro</div>
            <div className="text-xs text-gray-500 -mt-0.5">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                             transition-colors
                             ${active ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" : "text-gray-700 hover:bg-gray-50"}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-indigo-700" : "text-gray-500"}`} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User card */}
      <div className="mt-auto p-3 border-t ">
        <div className="rounded-lg bg-gray-50 p-3 text-gray-600">
          <div className="text-sm font-medium">{user?.name || "Admin"}</div>
          <div className="text-xs text-gray-500">{user?.role || "Administrator"}</div>

          <form action="/api/auth/logout" method="post" className="mt-3 text-gray-600">
            <button
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white border text-sm
                         px-3 py-2 hover:bg-gray-50"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
