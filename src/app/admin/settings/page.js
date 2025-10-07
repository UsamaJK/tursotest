"use client";
import { useEffect, useMemo, useState } from "react";

const TAGS = ["A1","A2","B1","B2","C1","C2"];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [durationMin, setDurationMin] = useState(30);
  const [criteria, setCriteria] = useState({ A1:0,A2:0,B1:0,B2:0,C1:0,C2:0 });
  const [available, setAvailable] = useState({ A1:0,A2:0,B1:0,B2:0,C1:0,C2:0 });
  const [resultCriteria, setResultCriteria] = useState({ A1:60,A2:60,B1:60,B2:60,C1:60,C2:60 });
  const [errors, setErrors] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/settings", { credentials: "include" });
      const j = await r.json();
      setDurationMin(j.durationMin ?? 30);
      setCriteria(j.criteria ?? {});
      setResultCriteria(j.resultCriteria ?? { A1:60,A2:60,B1:60,B2:60,C1:60,C2:60 }); // ⬅️
      setAvailable(j.available ?? {});
      setLoading(false);
    })();
  }, []);

  

  const totalSelected = useMemo(
    () => TAGS.reduce((s,t)=> s + (Number(criteria[t])||0), 0),
    [criteria]
  );

  const canSave = useMemo(() => {
    if (!durationMin || Number(durationMin) <= 0) return false;
    if (totalSelected <= 0) return false;
    for (const t of TAGS) {
      const val = Number(criteria[t]) || 0;
      const max = Number(available[t]) || 0;
      if (val < 0 || val > max) return false;
  
      const pct = Number(resultCriteria[t]);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) return false; // ⬅️
    }
    return true;
  }, [durationMin, criteria, available, totalSelected, resultCriteria]);
  

  const setTagVal = (tag, val) => {
    const n = Math.max(0, Number(val || 0));
    setCriteria(prev => ({ ...prev, [tag]: n }));
  };

  const save = async () => {
    setSaving(true);
    setErrors(null);
    const r = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        durationMin: Number(durationMin),
        criteria,
        resultCriteria,                    // ⬅️ NEW
      }),
    });
    const j = await r.json().catch(()=> ({}));
    setSaving(false);
    if (!r.ok) { setErrors(j); return; }
    alert("Settings saved");
  };
  

  const setResultVal = (tag, val) => {
    const n = Math.max(0, Math.min(100, Number(val || 0)));
    setResultCriteria(prev => ({ ...prev, [tag]: n }));
  };

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Test Settings</h1>
          <p className="text-sm text-gray-500">Configure duration and how many questions to draw from each tag.</p>
        </div>

        <div className="px-6 py-5 space-y-8">
          {/* Duration */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              className="w-full rounded-md border px-3 py-2 text-gray-900"
              style={{ borderColor: "darkgrey" }}
              value={durationMin}
              onChange={(e)=>setDurationMin(e.target.value)}
              placeholder="e.g. 30"
            />
            {errors?.details?.fieldErrors?.durationMin?.[0] && (
              <p className="mt-1 text-sm text-red-600">{errors.details.fieldErrors.durationMin[0]}</p>
            )}
          </section>

          {/* Criteria */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Question Selection Criteria
              </label>
              <span className="text-sm text-gray-600">
                Total selected: <strong>{totalSelected}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TAGS.map(tag => {
                const val = Number(criteria[tag]) || 0;
                const max = Number(available[tag]) || 0;
                const err = errors?.fieldErrors?.[tag];
                return (
                  <div key={tag}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{tag}</span>
                      <span className="text-xs text-gray-500">Available: {max}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={max}
                      className={`w-full rounded-md border px-3 py-2 text-gray-900 ${val>max ? "border-red-500" : ""}`}
                      style={{ borderColor: "darkgrey" }}
                      value={val}
                      onChange={(e)=>setTagVal(tag, e.target.value)}
                      placeholder="0"
                    />
                    {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
                  </div>
                );
              })}
            </div>
            {errors?.fieldErrors?._total && (
              <p className="mt-2 text-sm text-red-600">{errors.fieldErrors._total}</p>
            )}
          </section>

          {/* Result Criteria (%) */}
<section>
  <div className="mb-2 flex items-center justify-between">
    <label className="block text-sm font-medium text-gray-700">
      Result Criteria (per tag, in %)
    </label>
    <span className="text-sm text-gray-600">Range: 0–100%</span>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {TAGS.map(tag => {
      const pct = Number(resultCriteria[tag] ?? 0);
      return (
        <div key={tag}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{tag}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              className="w-full rounded-md border px-3 py-2 text-gray-900"
              style={{ borderColor: "darkgrey" }}
              value={pct}
              onChange={(e)=>setResultVal(tag, e.target.value)}
              placeholder="e.g. 60"
            />
            <span className="text-sm text-gray-600">%</span>
          </div>
          {errors?.details?.fieldErrors?.[`resultCriteria.${tag}`]?.[0] && (
            <p className="mt-1 text-sm text-red-600">
              {errors.details.fieldErrors[`resultCriteria.${tag}`][0]}
            </p>
          )}
        </div>
      );
    })}
  </div>
</section>


          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={save}
              disabled={!canSave || saving}
              className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}