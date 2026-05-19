import Link from "next/link";

export default function MockupLanding() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">H</div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-none">Hitech Portal</div>
            <div className="text-xs text-gray-400 leading-none mt-0.5">Construction Ltd</div>
          </div>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">Activity Reporting System</span>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
          Daily Activity Management
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Welcome back 👋
        </h1>
        <p className="text-base text-gray-500 max-w-md mx-auto">
          Submit and track site activity reports, manage equipment, and review submissions — all in one place.
        </p>
      </div>

      {/* Role Cards */}
      <div className="max-w-3xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-2 gap-5">

        <Link href="/mockup/report" className="group bg-white rounded-2xl border border-gray-200 p-7 hover:border-violet-300 hover:shadow-lg transition-all duration-200 flex flex-col items-start gap-4">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-violet-600 transition-colors duration-200">
            <span className="group-hover:grayscale-0">📝</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-gray-900">Activity Report</h2>
              <span className="text-xs font-bold uppercase tracking-wide bg-violet-100 text-violet-600 px-2 py-0.5 rounded-md">Daily</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">Submit site activities, capture chainages, upload field photos.</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1.5 text-violet-600 text-sm font-semibold group-hover:gap-2.5 transition-all duration-200">
            Start report <span>›</span>
          </span>
        </Link>

        <Link href="/mockup/admin" className="group bg-white rounded-2xl border border-gray-200 p-7 hover:border-cyan-300 hover:shadow-lg transition-all duration-200 flex flex-col items-start gap-4">
          <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-2xl">📋</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-gray-900">Submissions</h2>
              <span className="text-xs font-bold uppercase tracking-wide bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-md">Records</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">Browse all submitted activity reports, filter by project or category.</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1.5 text-cyan-600 text-sm font-semibold group-hover:gap-2.5 transition-all duration-200">
            View all <span>›</span>
          </span>
        </Link>

        <Link href="#" className="group bg-white rounded-2xl border border-gray-200 p-7 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 flex flex-col items-start gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl">👷</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-gray-900">Employees</h2>
              <span className="text-xs font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">People</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">Manage workers, track roles, view personnel profiles.</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1.5 text-emerald-600 text-sm font-semibold group-hover:gap-2.5 transition-all duration-200">
            Manage <span>›</span>
          </span>
        </Link>

        <Link href="#" className="group bg-white rounded-2xl border border-gray-200 p-7 hover:border-pink-300 hover:shadow-lg transition-all duration-200 flex flex-col items-start gap-4">
          <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-2xl">🚜</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-bold text-gray-900">Equipment</h2>
              <span className="text-xs font-bold uppercase tracking-wide bg-pink-50 text-pink-600 px-2 py-0.5 rounded-md">Assets</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">Register machines and assign to project sections.</p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1.5 text-pink-600 text-sm font-semibold group-hover:gap-2.5 transition-all duration-200">
            Manage <span>›</span>
          </span>
        </Link>

      </div>

      <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">
        Hitech Construction Ltd &mdash; Activity Reporting System
      </div>
    </div>
  );
}
