import React from "react";
import AccountDropdown from "./AccountDropdown";
import { Globe } from "lucide-react";

function Header({ email }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4E58BC] rounded-full flex items-center justify-center">
            <Globe className="text-white" />
          </div>
          <span className="text-[1rem] font-semibold text-gray-900">EnglishETS</span>
        </div>
        <AccountDropdown email={email} />
      </div>
    </header>
  );
}

export default Header;
