import React from "react";
import { Link } from "wouter";
import { ArrowLeft, Info, ClipboardList, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

const projectDetails = {
  updateSummary: [
    "Pending Items: Awaiting confirmation on critical showstopper items:",
    "UI Component Library",
    "CMS (Content Management System)",
    "Maps",
    "These delays are impacting the schedule and project scope.",
    "Had a Customer Connect with Saad and Asim.",
    "Expecting update by 15th July.",
    "If no update is received, there may be a complete hold on project activities.",
  ],
  tasks: [
    { task: "Follow up with Calx team and Ministry on pending confirmations", priority: "🔴 High", owner: "Internal team", status: "Planned" },
    { task: "Gather confirmation/update by July 15", priority: "🔴 High", owner: "Saad/Asim/Ministry", status: "In Progress" },
    { task: "Prepare contingency plan if items are not confirmed", priority: "🔴 High", owner: "Project Manager / Tech Lead", status: "To be discussed" },
    { task: "Update timeline and scope after confirmation", priority: "🟡 Medium", owner: "PMO / Project Lead", status: "Next" },
  ],
  issues: [
    "Dependency on external confirmations (Calx / Ministry) leading to:",
    "Delays in execution",
    "Risk of complete halt in project work",
    "Unclear ownership or response timelines from stakeholders",
    "Schedule slippage due to showstopper components",
  ],
  mitigation: [
    "Escalate pending items formally via email or call to Calx / Ministry",
    "Setup a checkpoint call post July 15 regardless of update to force alignment",
    "Define a revised project plan including alternate dates / buffers",
    "Document the impact of each delayed item (UI lib, CMS, Maps) on delivery and share with stakeholders",
    "Prepare temporary fallback or mock solution for UI/CMS if feasible to continue work in parallel",
  ],
  nextSteps: [
    "Coordinate with PM to list out the exact dependencies within UI, CMS, and Maps.",
    "Join the discussion with Calx team to drive clarity.",
    "Ask your lead if fallback options are technically possible to reduce idle time.",
    "Start preparing a tracker/log of all pending confirmations and updates for transparency.",
  ],
};

export default function ProjectDetailsPage() {
  // Get project id from URL (works in Vite/React SPA)
  const id = window.location.pathname.split("/").pop();

  return (
    <div className="min-h-[calc(100vh-0px)] w-full flex flex-col items-stretch bg-gradient-to-br from-blue-50 to-indigo-50 animate-fade-in">
      {/* Sticky Back Button */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-blue-50 to-indigo-50/80 py-4 px-2 sm:px-6 md:px-12 lg:px-24 xl:px-32 shadow-sm flex items-center">
        <Link href="/projects">
          <a className="flex items-center text-blue-600 hover:text-blue-800 font-semibold text-lg transition">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Projects
          </a>
        </Link>
      </div>
      <div className="flex flex-col flex-grow items-center justify-center py-8 px-2 sm:px-6 md:px-12 lg:px-24 xl:px-32">
        <div className="w-full flex flex-col gap-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3 tracking-tight">
              <Info className="h-7 w-7 text-indigo-500" /> Project #{id} <span className="text-lg font-semibold text-indigo-700">AI Analysis & Details</span>
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Update Summary */}
            <section className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 flex flex-col hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <ClipboardList className="h-5 w-5 text-blue-500 mr-2" />
                <h2 className="text-lg font-bold text-blue-900 tracking-tight">Current Update Summary</h2>
              </div>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm leading-relaxed">
                {projectDetails.updateSummary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>
            {/* Tasks Identified */}
            <section className="bg-white rounded-2xl shadow-lg border border-yellow-100 p-6 flex flex-col hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <ClipboardList className="h-5 w-5 text-yellow-500 mr-2" />
                <h2 className="text-lg font-bold text-yellow-900 tracking-tight">Tasks Identified</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm rounded-lg overflow-hidden">
                  <thead className="bg-yellow-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Task</th>
                      <th className="px-3 py-2 text-left">Priority</th>
                      <th className="px-3 py-2 text-left">Owner</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectDetails.tasks.map((t, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2 font-medium text-gray-900">{t.task}</td>
                        <td className="px-3 py-2">{t.priority}</td>
                        <td className="px-3 py-2">{t.owner}</td>
                        <td className="px-3 py-2">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            {/* Key Issues / Challenges */}
            <section className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <h2 className="text-lg font-bold text-red-900 tracking-tight">Key Issues / Challenges</h2>
              </div>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm leading-relaxed">
                {projectDetails.issues.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>
            {/* Mitigation & Path to Green Plan */}
            <section className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <h2 className="text-lg font-bold text-green-900 tracking-tight">Mitigation & “Path to Green” Plan</h2>
              </div>
              <ol className="list-decimal pl-6 text-gray-700 space-y-1 text-sm leading-relaxed">
                {projectDetails.mitigation.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </section>
            {/* Next Steps for You */}
            <section className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-6 flex flex-col md:col-span-2 hover:shadow-2xl transition-shadow">
              <div className="flex items-center mb-3">
                <RefreshCw className="h-5 w-5 text-indigo-500 mr-2" />
                <h2 className="text-lg font-bold text-indigo-900 tracking-tight">Next Steps for You</h2>
              </div>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm leading-relaxed">
                {projectDetails.nextSteps.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 