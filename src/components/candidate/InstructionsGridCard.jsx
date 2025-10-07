import { BookOpen, Clock } from "lucide-react";
import React from "react";

function InstructionsGridCard({ type, typeText, typeInformation }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 text-center border-[#E4E9F1] border-1">
      <div className="inline-flex items-center justify-center   mb-3">
        {type === 1 ? (
          <Clock className="text-[#4E58BC]" size={50} strokeWidth={2} />
        ) : (
          <BookOpen className="text-[#21C45D]" size={50} strokeWidth={1} />
        )}
      </div>
      <div className="text-3xl font-semibold mb-1">{typeText}</div>
      <div className="text-gray-600">{typeInformation}</div>
    </div>
  );
}

export default InstructionsGridCard;
