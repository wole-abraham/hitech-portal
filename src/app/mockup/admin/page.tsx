"use client";

import Link from "next/link";
import { useState } from "react";

const REPORTS = [
  { id: 1, date: "2026-05-12", project: "Ikorodu–Sagamu", section: "Section A", category: "Earthworks", type: "Excavation", reporter: "Ade Bello", chainage: "1+250 → 1+500", status: "Ongoing" },
  { id: 2, date: "2026-05-12", project: "Ikorodu–Sagamu", section: "Section B", category: "Pavement", type: "Asphalt Overlay", reporter: "Kunle Femi", chainage: "2+100 → 2+350", status: "Completed" },
  { id: 3, date: "2026-05-11", project: "Abeokuta Bypass", section: "Section A", category: "Drainage", type: "Culvert", reporter: "Tunde Okafor", chainage: "0+400 → 0+600", status: "Completed" },
  { id: 4, date: "2026-05-11", project: "Ikorodu–Sagamu", section: "Section A", category: "Structures", type: "Bridge Abutment", reporter: "Amaka Chidi", chainage: "3+200 → 3+250", status: "Suspended" },
  { id: 5, date: "2026-05-10", project: "Abeokuta Bypass", section: "Section B", category: "Earthworks", type: "Fill Compaction", reporter: "Emeka Ugo", chainage: "1+050 → 1+200", status: "Ongoing" },
  { id: 6, date: "2026-05-09", project: "Ikorodu–Sagamu", section: "Section B", category: "Pavement", type: "Sub-base Laying", reporter: "Bisi Adeyemi", chainage: "4+000 → 4+300", status: "Completed" },
];

const STATUS_STYLE: Record<string, string> = {
  Ongoing:   "bg-amber-50 text-amber-700 border border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Suspended: "bg-red-50 text-red-600 border border-red-200",
  Planned:   "bg-blue-50 text-blue-700 border border-blue-200",
};

export default function MockupAdmin() {
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("All");
  const [selected, setSelected] = useState<typeof REPORTS[0] | null>(null);

  const projects = ["All", ...Array.from(new Set(REPORTS.map(r => r.project)))];

  const filtered = REPORTS.filter(r => {
    const q = search.toLowerCase();
    const match = r.reporter.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.project.toLowerCase().includes(q);
    const proj = project === "All" || r.project === project;
    return match && proj;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/mockup" className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-sm">←</Link>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-none">Submissions</div>
            <div className="text-xs text-gray-400 leading-none mt-0.5">{filtered.length} reports</div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4">

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by reporter, project, activity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
          />
        </div>

        {/* Project filter */}
        <div className="flex gap-2 flex-wrap">
          {projects.map(p => (
            <button key={p} onClick={() => setProject(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${project === p ? "bg-violet-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              {p}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No reports found.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <button key={r.id} onClick={() => setSelected(r)} className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-gray-300 hover:shadow-sm transition-all shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📋</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-gray-900">{r.project}</span>
                      {r.section && <span className="text-xs text-gray-400">/ {r.section}</span>}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{r.category} › {r.type}</div>
                    <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                      <span>📅 {r.date}</span>
                      <span>👤 {r.reporter}</span>
                      <span>📍 {r.chainage}</span>
                    </div>
                  </div>
                  <span className="text-gray-300 text-lg flex-shrink-0">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail drawer / modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 z-10 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900">Report Detail</h3>
              <button onClick={() => setSelected(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg hover:bg-gray-200">×</button>
            </div>
            <div className="flex flex-col gap-3">
              {[
                ["Date", selected.date],
                ["Reporter", selected.reporter],
                ["Project", selected.project],
                ["Section", selected.section],
                ["Category", selected.category],
                ["Activity Type", selected.type],
                ["Chainage", selected.chainage],
                ["Status", selected.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</span>
                  <span className="text-sm text-gray-800 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
