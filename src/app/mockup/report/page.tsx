"use client";

import Link from "next/link";
import { useState } from "react";

export default function MockupReport() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-sm w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Report Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">Your activity report has been received and is pending review.</p>
          <button onClick={() => setSubmitted(false)} className="w-full bg-violet-600 text-white font-semibold py-2.5 rounded-xl hover:bg-violet-700 transition-colors text-sm mb-2">
            Submit another
          </button>
          <Link href="/mockup" className="block text-sm text-gray-400 hover:text-gray-600 py-1">Back to portal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3.5 flex items-center gap-3 sticky top-0 z-50">
        <Link href="/mockup" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-sm">←</Link>
        <div>
          <div className="text-sm font-bold text-gray-900 leading-none">Activity Report</div>
          <div className="text-xs text-gray-400 leading-none mt-0.5">Hitech Construction</div>
        </div>
      </header>

      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5 pb-28">

        {/* Card: Activity Info */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-sm">📋</div>
            <span className="text-sm font-bold text-gray-800">Activity Information</span>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" required><input type="date" defaultValue={new Date().toISOString().split("T")[0]} required className={inp} /></Field>
              <Field label="Weather">
                <select className={inp}><option value="">Select…</option>{["Sunny","Cloudy","Rainy","Windy","Overcast","Foggy"].map(w=><option key={w}>{w}</option>)}</select>
              </Field>
            </div>
            <Field label="Reporter Name" required><input placeholder="Your name" required className={inp} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Project" required><select required className={inp}><option value="">Select…</option><option>Ikorodu–Sagamu</option><option>Abeokuta Bypass</option></select></Field>
              <Field label="Section"><select className={inp}><option value="">Select…</option><option>Section A</option><option>Section B</option></select></Field>
            </div>
          </div>
        </section>

        {/* Card: Activity Type */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-sm">🏗️</div>
            <span className="text-sm font-bold text-gray-800">Activity Type</span>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <Field label="Category" required><select required className={inp}><option value="">Select category…</option><option>Earthworks</option><option>Drainage</option><option>Pavement</option><option>Structures</option></select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type"><select className={inp}><option value="">Select…</option></select></Field>
              <Field label="Sub-type"><select className={inp}><option value="">Sub-type…</option></select></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Side"><select className={inp}><option value="">Select…</option>{["Left","Right","Both","N/A"].map(s=><option key={s}>{s}</option>)}</select></Field>
              <Field label="Status"><select className={inp}><option>Ongoing</option><option>Completed</option><option>Suspended</option><option>Planned</option></select></Field>
            </div>
          </div>
        </section>

        {/* Card: Chainage */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-sm">📍</div>
            <span className="text-sm font-bold text-gray-800">Chainage</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <Field label="Start Chainage" required><input placeholder="e.g. 1+250" required className={inp} /></Field>
            <Field label="End Chainage" required><input placeholder="e.g. 1+500" required className={inp} /></Field>
          </div>
        </section>

        {/* Card: Notes */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-sm">📝</div>
            <span className="text-sm font-bold text-gray-800">Notes & Conformance</span>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <Field label="Comment"><textarea rows={3} placeholder="Describe observations…" className={`${inp} resize-none`} /></Field>
            <Field label="Not Conforming?">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-violet-400 hover:text-violet-600 transition-colors">Yes</button>
                <button type="button" className="py-2.5 rounded-xl border-2 border-violet-500 bg-violet-50 text-sm font-semibold text-violet-700 transition-colors">No</button>
              </div>
            </Field>
          </div>
        </section>

        {/* Card: Photos */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-sm">📷</div>
            <span className="text-sm font-bold text-gray-800">Photos & Video — min 1 required</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2.5">
              {[1,2,3,4,5].map(i => (
                <label key={i} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-violet-300 hover:bg-violet-50 transition-colors">
                  <input type="file" accept="image/*" className="hidden" />
                  <span className="text-xl opacity-40">📷</span>
                  <span className="text-xs text-gray-400 font-medium">Photo {i}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

      </form>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 shadow-lg">
        <button type="submit" form="" onClick={(e) => { e.preventDefault(); setSubmitted(true); }}
          className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-violet-700 text-white font-bold text-sm rounded-xl shadow-md hover:from-violet-700 hover:to-violet-800 transition-all">
          Submit Report →
        </button>
      </div>
    </div>
  );
}

const inp = "w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
        {label}{required && <span className="text-violet-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
