import React from 'react';
import { Cpu } from 'lucide-react';

export function InventoryVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      {/* CSS Stylesheet inline to keep it self-contained and run on the compositor thread */}
      <style>{`
        @keyframes flowPkg {
          0% { transform: translateX(-60px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(260px); opacity: 0; }
        }
        .animate-pkg-0 { animation: flowPkg 4s linear infinite; }
        .animate-pkg-1 { animation: flowPkg 4s linear infinite 0.7s; }
        .animate-pkg-2 { animation: flowPkg 4s linear infinite 1.4s; }
        .animate-pkg-3 { animation: flowPkg 4s linear infinite 2.1s; }
        .animate-pkg-4 { animation: flowPkg 4s linear infinite 2.8s; }
        .animate-pkg-5 { animation: flowPkg 4s linear infinite 3.5s; }
      `}</style>
      
      <div className="relative w-72 h-80 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-md">
        {/* Grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.25]" 
          style={{ 
            backgroundImage: 'linear-gradient(#0d9488 1px, transparent 1px), linear-gradient(90deg, #0d9488 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }} 
        />
        
        {/* Moving Boxes/Items */}
        {[
          { id: 'PKG-108', y: 70, anim: 'animate-pkg-0' },
          { id: 'PKG-402', y: 110, anim: 'animate-pkg-1' },
          { id: 'PKG-931', y: 150, anim: 'animate-pkg-2' },
          { id: 'PKG-215', y: 190, anim: 'animate-pkg-3' },
          { id: 'PKG-504', y: 230, anim: 'animate-pkg-4' },
          { id: 'PKG-872', y: 270, anim: 'animate-pkg-5' }
        ].map((pkg, idx) => (
          <div
            key={idx}
            style={{ top: `${pkg.y}px` }}
            className={`absolute w-14 h-8 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg flex items-center justify-center text-[9px] font-black shadow-sm ${pkg.anim}`}
          >
            {pkg.id}
          </div>
        ))}

        <div className="absolute top-6 left-6 z-10">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 mb-1">Inventory Flow</p>
          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-black font-outfit text-slate-900">1,402</span>
            <span className="text-[10px] pb-1 font-bold text-slate-500">Items/h</span>
          </div>
        </div>

        {/* Live Syncing Card */}
        <div className="absolute bottom-6 right-6 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm z-10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black text-slate-700">Live Syncing</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIScanningVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <style>{`
        @keyframes scanMove {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes scaleBadge {
          0%, 100% { transform: scale(0.9); opacity: 0.4; }
          50% { transform: scale(1); opacity: 1; }
        }
        .animate-scan-line { animation: scanMove 4s ease-in-out infinite; }
        .animate-badge-0 { animation: scaleBadge 2.5s infinite; }
        .animate-badge-1 { animation: scaleBadge 2.5s infinite 0.6s; }
        .animate-badge-2 { animation: scaleBadge 2.5s infinite 1.2s; }
        .animate-badge-3 { animation: scaleBadge 2.5s infinite 1.8s; }
      `}</style>
      
      <div className="relative w-80 h-72">
        {/* The "Box" being scanned */}
        <div className="absolute inset-0 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center">
          <div className="w-48 h-32 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col p-6 gap-3">
            <div className="w-full h-2.5 bg-slate-200 rounded" />
            <div className="w-1/2 h-2.5 bg-slate-200 rounded" />
            <div className="w-3/4 h-2.5 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Scanning Ray */}
        <div className="absolute left-[-5%] right-[-5%] h-1 bg-gradient-to-r from-transparent via-teal-600 to-transparent shadow-[0_0_12px_rgba(13,148,136,0.5)] z-10 animate-scan-line" />

        {/* Data points popping up */}
        {[
          { label: 'BATCH_OK', top: '15%', left: '-10%', anim: 'animate-badge-0' },
          { label: 'EXP: 2029', top: '35%', left: '72%', anim: 'animate-badge-1' },
          { label: 'GENUINE', top: '55%', left: '-8%', anim: 'animate-badge-2' },
          { label: 'PRICE: ₹120', top: '75%', left: '70%', anim: 'animate-badge-3' }
        ].map((badge, i) => (
          <div
            key={i}
            style={{ top: badge.top, left: badge.left }}
            className={`absolute px-3.5 py-1.5 rounded-full bg-teal-600 text-white text-[9px] font-black shadow-md ${badge.anim}`}
          >
            {badge.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <style>{`
        @keyframes slowSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes agentPulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.08); opacity: 0.25; }
        }
        .animate-spin-slow-custom { animation: slowSpin 16s linear infinite; }
        .animate-spin-slow-reverse { animation: slowSpin 16s linear infinite reverse; }
        .animate-agent-pulse { animation: agentPulse 5s ease-in-out infinite; }
      `}</style>
      
      <div className="relative flex items-center justify-center">
        {/* Core Agent Sphere */}
        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-teal-500 to-sky-500 blur-3xl opacity-20 animate-agent-pulse" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full border-2 border-slate-200 flex items-center justify-center bg-white shadow-md">
            <div className="w-32 h-32 rounded-full border border-dashed border-teal-400 animate-spin-slow-custom flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500" style={{ transform: 'translate(0, -64px)' }} />
            </div>
          </div>
          
          {/* Pulsing Core */}
          <div className="absolute w-12 h-12 rounded-full bg-teal-600 shadow-md flex items-center justify-center z-10">
            <div className="w-4 h-4 bg-white rounded-full animate-ping" />
          </div>
        </div>

        {/* Orbiting Insight Bubbles (Static placement for performance, rotating ring overlay) */}
        <div className="absolute w-60 h-60 pointer-events-none">
          {[
            { label: 'Stock Alert: Low', top: '0%', left: '50%', x: '-50%' },
            { label: 'Revenue: +12%', top: '75%', left: '5%', x: '0' },
            { label: 'Fast Billing', top: '70%', left: '60%', x: '0' }
          ].map((bubble, idx) => (
            <div 
              key={idx}
              style={{ top: bubble.top, left: bubble.left, transform: `translateX(${bubble.x})` }}
              className="absolute bg-white/95 border border-slate-200 py-2 px-3.5 rounded-xl shadow-lg"
            >
              <p className="text-[10px] font-extrabold text-teal-800 whitespace-nowrap">
                {bubble.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AIInsightsVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <style>{`
        @keyframes chipPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 10px rgba(13,148,136,0.1); }
          50% { transform: scale(1.03); box-shadow: 0 0 20px rgba(13,148,136,0.25); }
        }
        @keyframes streamHeight {
          0%, 100% { height: 18px; opacity: 0.15; }
          50% { height: 75px; opacity: 0.85; }
        }
        @keyframes ringGrow {
          0% { transform: scale(0.95); opacity: 0.5; }
          100% { transform: scale(1.85); opacity: 0; }
        }
        .animate-chip { animation: chipPulse 3s ease-in-out infinite; }
        .animate-ring-0 { animation: ringGrow 2.5s infinite; }
        .animate-ring-1 { animation: ringGrow 2.5s infinite 0.8s; }
        .animate-ring-2 { animation: ringGrow 2.5s infinite 1.6s; }
        .animate-stream-0 { animation: streamHeight 1.5s infinite 0s; }
        .animate-stream-1 { animation: streamHeight 1.5s infinite 0.2s; }
        .animate-stream-2 { animation: streamHeight 1.5s infinite 0.4s; }
        .animate-stream-3 { animation: streamHeight 1.5s infinite 0.6s; }
        .animate-stream-4 { animation: streamHeight 1.5s infinite 0.8s; }
        .animate-stream-5 { animation: streamHeight 1.5s infinite 1s; }
        .animate-stream-6 { animation: streamHeight 1.5s infinite 1.2s; }
        .animate-stream-7 { animation: streamHeight 1.5s infinite 1.4s; }
      `}</style>
      
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Chip Center */}
        <div className="relative w-28 h-28 bg-teal-50 border-2 border-teal-200 rounded-3xl flex items-center justify-center z-10 animate-chip">
          <Cpu className="w-12 h-12 text-teal-600" />
          
          {/* Faux expanding pulse waves */}
          <div className="absolute inset-0 border border-teal-400 rounded-3xl animate-ring-0" />
          <div className="absolute inset-0 border border-teal-400 rounded-3xl animate-ring-1" />
          <div className="absolute inset-0 border border-teal-400 rounded-3xl animate-ring-2" />
        </div>

        {/* Data Streams radiating out - CSS animated heights and rotations */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <div
            key={i}
            className="absolute w-1 origin-bottom"
            style={{ 
              transform: `rotate(${angle}deg)`, 
              bottom: '50%',
              height: '80px'
            }}
          >
            <div 
              className={`w-full bg-gradient-to-t from-teal-500 to-transparent rounded-full animate-stream-${i}`} 
              style={{ width: '3px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportingVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <div className="relative w-full max-w-sm aspect-video bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Monthly Analytics</span>
        </div>
        
        <div className="space-y-4 pt-1">
          {[
            { label: 'Inventory Turnover', val: '84%', color: 'bg-teal-500' },
            { label: 'Customer Retention', val: '92%', color: 'bg-sky-500' },
            { label: 'Operational Speed', val: '76%', color: 'bg-emerald-500' }
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-[10px] font-extrabold">
                <span className="text-slate-500">{item.label}</span>
                <span className="text-slate-900">{item.val}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                {/* CSS Transition for load animation, runs immediately on mount */}
                <div 
                  className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: item.val }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FinancialVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <div className="relative w-full max-w-sm aspect-[4/3] bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col gap-6 overflow-hidden shadow-md">
        <div className="flex justify-between items-start z-10">
          <div>
            <p className="text-[10px] uppercase font-extrabold text-slate-500 tracking-widest mb-1">Total Revenue</p>
            <h4 className="text-3xl font-black font-outfit text-slate-900">₹4,82,900</h4>
          </div>
          <div className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-[10px] font-black">+14.2%</div>
        </div>

        <div className="flex-1 flex items-end gap-2 px-2 z-10 border-b border-slate-100 pb-1">
          {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className="flex-1 bg-gradient-to-t from-teal-400 to-teal-600 rounded-t-md relative group transition-all duration-1000 ease-out"
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {h}k
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 z-10">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[8px] uppercase font-extrabold text-slate-500 mb-1">Net Profit</p>
            <p className="text-lg font-black text-teal-600 font-outfit">₹1.2L</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[8px] uppercase font-extrabold text-slate-500 mb-1">Expenses</p>
            <p className="text-lg font-black text-red-500 font-outfit">₹3.6L</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CashflowVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <style>{`
        @keyframes floatCash {
          0% { transform: translateY(70px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-70px); opacity: 0; }
        }
        .animate-cash-0 { animation: floatCash 3s linear infinite; }
        .animate-cash-1 { animation: floatCash 3s linear infinite 0.75s; }
        .animate-cash-2 { animation: floatCash 3s linear infinite 1.5s; }
        .animate-cash-3 { animation: floatCash 3s linear infinite 2.25s; }
      `}</style>
      
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Central Wallet/Bank Icon circle */}
        <div className="w-28 h-28 rounded-full bg-slate-50 border border-slate-200 shadow-md flex items-center justify-center relative z-10">
          <div className="w-20 h-20 rounded-full bg-teal-50 border border-teal-150 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xl font-outfit">₹</span>
            </div>
          </div>
        </div>

        {/* Orbiting supplier/customer nodes */}
        {[
          { label: 'Suppliers', top: '15px', left: '15px', color: 'bg-sky-50 text-sky-700 border-sky-200' },
          { label: 'Retail', top: '15px', right: '15px', color: 'bg-teal-50 text-teal-700 border-teal-200' },
          { label: 'Receivables', bottom: '15px', left: '10px', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'GST', bottom: '15px', right: '10px', color: 'bg-slate-100 text-slate-800 border-slate-200' }
        ].map((node, i) => (
          <div 
            key={i}
            style={{ 
              position: 'absolute', 
              top: node.top, 
              left: node.left, 
              right: node.right, 
              bottom: node.bottom 
            }}
            className={`px-4 py-2 bg-white border rounded-2xl shadow-sm z-10 flex items-center gap-2 ${node.color}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">{node.label}</span>
            
            {/* Money flowing elements */}
            <div className={`absolute left-1/2 -translate-x-1/2 font-extrabold text-[12px] text-teal-600 animate-cash-${i}`}>
              ₹
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
