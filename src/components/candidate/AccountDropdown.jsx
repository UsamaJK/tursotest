"use client";
import { LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AccountDropdown({ email }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  // Close on click outside & on Escape
  useEffect(() => {
    function onDocClick(e) {
      if (open && panelRef.current && !panelRef.current.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 focus:outline-none"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="text-sm">Account</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          <div className="px-4 py-3">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="mt-1 text-sm font-medium text-gray-900 truncate">{email}</p>
          </div>

          <div className="h-px bg-gray-200" />
          <form action="/api/auth/logout" method="post">
            <button className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-gray-50 focus:bg-gray-50 flex gap-2 " role="menuitem">
              <div className="flex items-center">
                <LogOut size={15} />
              </div>
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
