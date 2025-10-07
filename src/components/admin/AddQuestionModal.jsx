"use client";
import { useEffect, useMemo, useState } from "react";
import { questionCreateSchema } from "@/lib/validation/question";

const TAGS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function AddQuestionModal({
  open,
  onClose, // onClose(didSave?: boolean)
  onSaved, // optional
  mode = "create", // "create" | "edit"
  question, // when editing: { id, text, tag, allowMultiple, options: [{text,isCorrect,order}] }
}) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("A1");
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [options, setOptions] = useState([
    { text: "", isCorrect: false, order: 0 },
    { text: "", isCorrect: false, order: 1 },
  ]);
  const [errors, setErrors] = useState({});

  // hydrate when opening (supports edit & add)
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && question) {
      setText(question.text || "");
      setTag(question.tag || "A1");
      setAllowMultiple(!!question.allowMultiple);
      const opts = (question.options ?? []).sort((a, b) => a.order - b.order).map((o, i) => ({ text: o.text, isCorrect: !!o.isCorrect, order: i }));
      setOptions(
        opts.length
          ? opts
          : [
              { text: "", isCorrect: false, order: 0 },
              { text: "", isCorrect: false, order: 1 },
            ]
      );
      setErrors({});
    } else {
      // reset for create
      setText("");
      setTag("A1");
      setAllowMultiple(false);
      setOptions([
        { text: "", isCorrect: false, order: 0 },
        { text: "", isCorrect: false, order: 1 },
      ]);
      setErrors({});
    }
  }, [open, mode, question]);

  const validForSave = useMemo(() => {
    const parsed = questionCreateSchema.safeParse({ text, tag, allowMultiple, options });
    if (!parsed.success) return false;
    const correctCount = options.filter((o) => o.isCorrect).length;
    return allowMultiple ? correctCount >= 1 : correctCount === 1;
  }, [text, tag, allowMultiple, options]);

  const addOption = () => {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, { text: "", isCorrect: false, order: prev.length }]);
  };

  const setOption = (idx, patch) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };

  const removeOption = (idx) => {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== idx).map((o, i) => ({ ...o, order: i }));
    setOptions(next);
  };

  const toggleAllowMultiple = (v) => {
    setAllowMultiple(v);
    if (!v) {
      // force exactly one if currently multiple
      setOptions((prev) => {
        const first = prev.findIndex((o) => o.isCorrect);
        return prev.map((o, i) => ({ ...o, isCorrect: i === first && first >= 0 }));
      });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const parsed = questionCreateSchema.safeParse({ text, tag, allowMultiple, options });
    if (!parsed.success) {
      setErrors(parsed.error.flatten());
      return;
    }
    setErrors({});

    const body = JSON.stringify(parsed.data);
    const url = mode === "edit" ? `/api/admin/questions/${question.id}` : "/api/admin/questions";
    const method = mode === "edit" ? "PUT" : "POST";

    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });

    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      alert(data?.error || "Failed to save");
      return;
    }
    onSaved?.();
    onClose?.(true); // tell parent it saved
  };

  if (!open) return null;

  const setSingleCorrect = (index) => setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-gray-700">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{mode === "edit" ? "Edit Question" : "Add New Question"}</h2>
          <button onClick={() => onClose?.(false)} className="text-gray-500 hover:text-black">
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question Text *</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter question…"
              style={{ borderColor: "darkgrey" }}
            />
            {errors?.fieldErrors?.text && <p className="text-red-600 text-sm mt-1">{errors.fieldErrors.text[0]}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Tag *</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                style={{ borderColor: "darkgrey" }}
              >
                {TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex items-end">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={allowMultiple} onChange={(e) => toggleAllowMultiple(e.target.checked)} />
                Allow multiple correct answers
              </label>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium mb-1">Options *</legend>
            {options.map((o, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {allowMultiple ? (
                  <input type="checkbox" checked={o.isCorrect} onChange={(e) => setOption(idx, { isCorrect: e.target.checked })} />
                ) : (
                  <input type="radio" name="correct" checked={o.isCorrect} onChange={() => setSingleCorrect(idx)} />
                )}
                <input
                  value={o.text}
                  onChange={(e) => setOption(idx, { text: e.target.value })}
                  className="flex-1 border rounded px-3 py-2"
                  style={{ borderColor: "darkgrey" }}
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="px-2 py-1 text-red-600 disabled:opacity-50"
                  disabled={options.length <= 2}
                >
                  Delete
                </button>
              </div>
            ))}
            <div className="pt-1">
              <button type="button" onClick={addOption} className="px-3 py-1 border rounded" style={{ borderColor: "darkgrey" }}>
                + Add Option
              </button>
            </div>
            {errors?.fieldErrors?.options && <p className="text-red-600 text-sm mt-1">{errors.fieldErrors.options[0]}</p>}
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onClose?.(false)} className="px-4 py-2 border rounded" style={{ borderColor: "darkgrey" }}>
              Cancel
            </button>
            <button type="submit" disabled={!validForSave} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
              {mode === "edit" ? "Save Changes" : "Save Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
