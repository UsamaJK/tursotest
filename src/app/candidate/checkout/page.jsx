"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

export default function BillingPage() {
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleProceed() {
    if (!region) return;
    setLoading(true);
    try {
      const res = await fetch("/api/candidate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create checkout");
      window.location.href = data.url; // Stripe takes over
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-semibold text-center text-gray-900">
          Choose Your <span className="text-indigo-600">Test Plan</span>
        </h1>
        <p className="text-center text-gray-500 mt-2">Secure payment with instant test access</p>

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {/* Left: plan card */}
          <div className="border rounded-2xl bg-white shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">English Proficiency Test</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">Popular</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Complete 30-minute assessment with instant results</p>

            <ul className="space-y-3 mt-6 text-sm text-gray-900">
              {[
                "30-minute comprehensive test",
                "Instant results & score breakdown",
                "Downloadable PDF certificate",
                "Grammar, vocabulary & reading section",
                "European job market recognized",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold">
                    ✓
                  </span>
                  <span className="text-gray-900">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <label className="text-sm font-medium text-gray-900">Select Your Region</label>
              <div className="mt-2 relative">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">Choose your region</option>
                  <option value="EU">Europe (EUR)</option>
                  <option value="UK">United Kingdom (GBP)</option>
                  <option value="US">United States (USD)</option>
                  {/* Add more, e.g. <option value="PK">Pakistan (PKR)</option> */}
                </select>
              </div>
            </div>
          </div>

          {/* Right: payment card */}
          <div className="border rounded-2xl bg-white shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
            <p className="text-sm text-gray-500">Secure payment powered by Stripe</p>

            <div className="mt-6 flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg border flex items-center justify-center">💳</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Pay with Stripe</p>
                  <p className="text-xs text-gray-500">Secure</p>
                </div>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">Secure</span>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-gray-900" />
                <h4 className="font-semibold text-sm text-gray-900">Secure Payment</h4>
              </div>
              <p className="text-xs text-gray-500">Your payment information is encrypted and secure. We use industry-standard security measures.</p>
            </div>

            <button
              disabled={!region || loading}
              onClick={handleProceed}
              className="mt-6 w-full rounded-full bg-indigo-400 text-white py-3 font-medium disabled:opacity-50 hover:bg-indigo-500 transition-colors"
            >
              {loading ? "Redirecting…" : "Proceed to Payment"}
            </button>

            <p className="text-[11px] text-gray-400 mt-4 text-center">By proceeding, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
