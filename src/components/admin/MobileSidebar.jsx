"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon, Squares2X2Icon, Cog6ToothIcon, AcademicCapIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const NAV = [
  { href: "/admin/questions", label: "Questions", icon: Squares2X2Icon },
  { href: "/admin/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default function MobileSidebar({ user }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href) => pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 bg-white border-b h-14 flex items-center px-3">
        <button aria-label="Open menu" className="p-2 rounded-md hover:bg-gray-100" onClick={() => setOpen(true)}>
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="ml-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-indigo-600 grid place-items-center">
            <AcademicCapIcon className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-semibold">EnglishTest Pro</span>
        </div>
      </header>

      {/* Sheet */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute left-0 top-0 h-full w-[260px] bg-white shadow-xl flex flex-col">
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-600 grid place-items-center">
                  <AcademicCapIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold">EnglishTest Pro</span>
              </div>
              <button aria-label="Close" className="p-2 rounded-md hover:bg-gray-100" onClick={() => setOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <nav className="p-3 flex-1">
              <ul className="space-y-1">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                                   ${active ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" : "text-gray-700 hover:bg-gray-50"}`}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon className={`h-5 w-5 ${active ? "text-indigo-700" : "text-gray-500"}`} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-auto p-3 border-t">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-sm font-medium">{user?.name || "Admin"}</div>
                <div className="text-xs text-gray-500">{user?.role || "Administrator"}</div>
                <form action="/api/auth/logout" method="post" className="mt-3">
                  <button className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-white border text-sm px-3 py-2 hover:bg-gray-50">
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
