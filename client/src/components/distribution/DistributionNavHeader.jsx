import React from 'react';
import {
  Network, MapPin, Receipt, Award, FileText, ShieldCheck, ChevronRight
} from 'lucide-react';

export default function DistributionNavHeader({ activeTab, onSelectTab }) {
  const tabs = [
    {
      id: 'distribution-network',
      label: 'Multi-Level Network',
      shortLabel: 'Network Tree',
      icon: Network,
      color: '#4f46e5',
      desc: 'Hierarchy & Accounts'
    },
    {
      id: 'geographical-management',
      label: 'Geographical Master',
      shortLabel: 'States & Districts',
      icon: MapPin,
      color: '#059669',
      desc: '28 States & 8 UTs'
    },
    {
      id: 'distribution-payments',
      label: 'Wholesale Settlements',
      shortLabel: 'Invoices & Billing',
      icon: Receipt,
      color: '#d97706',
      desc: 'Collections & Dues'
    },
    {
      id: 'reliability-scores',
      label: 'Payment Reliability',
      shortLabel: 'Reliability Engine',
      icon: Award,
      color: '#7c3aed',
      desc: '0-100 Score & Tiers'
    },
    {
      id: 'distribution-reports',
      label: 'Territory Reports',
      shortLabel: 'Reports & Export',
      icon: FileText,
      color: '#0284c7',
      desc: 'State-wise Analytics'
    },
    {
      id: 'distribution-audit',
      label: 'Distribution Audit Trail',
      shortLabel: 'Audit Logs',
      icon: ShieldCheck,
      color: '#475569',
      desc: 'System Security Trail'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-6">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Super Admin Central Authority</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-semibold">India National Distribution Ecosystem</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Multi-Level Distribution Command Hub</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200/60 uppercase tracking-wider">
              India Master
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Hierarchical governance: State Distributors &rarr; District Distributors &rarr; Area Distributors &rarr; Authorized Retailers with automated credit settlement & territory analytics.
          </p>
        </div>
      </div>

      {/* Navigation Pills Bar */}
      <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-b from-indigo-50/80 to-white border-indigo-300 shadow-sm ring-1 ring-indigo-200'
                  : 'bg-slate-50/50 hover:bg-slate-100/70 border-slate-200/60 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: tab.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </div>
              <div className={`text-xs font-bold truncate w-full ${isActive ? 'text-indigo-950 font-black' : 'text-slate-800 font-semibold'}`}>
                {tab.shortLabel}
              </div>
              <div className="text-[10px] text-slate-400 truncate w-full mt-0.5 font-medium">
                {tab.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

