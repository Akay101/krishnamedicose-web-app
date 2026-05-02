import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export function InventoryVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <div className="relative w-72 h-80 bg-primary/20 rounded-[2.5rem] border-2 border-primary/30 backdrop-blur-3xl overflow-hidden shadow-2xl">
        {/* Animated Grid lines */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#2dd4bf 1px, transparent 1px), linear-gradient(90deg, #2dd4bf 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        {/* Moving Boxes/Items */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: -100, y: 50 + (i * 40), opacity: 0 }}
            animate={{ x: 300, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.8, ease: "linear" }}
            className="absolute w-12 h-8 bg-primary/40 rounded-lg flex items-center justify-center text-[8px] font-black"
          >
            PKG-{Math.floor(Math.random() * 900) + 100}
          </motion.div>
        ))}

        <div className="absolute top-8 left-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Inventory Flow</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold font-outfit">1,402</span>
            <span className="text-[10px] pb-1 text-slate-400">Items/h</span>
          </div>
        </div>

        {/* Floating Stat Card */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute bottom-8 right-8 bg-dark/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300">Live Syncing...</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function AIScanningVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <div className="relative w-80 h-72">
        {/* The "Box" being scanned */}
        <div className="absolute inset-0 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center">
          <div className="w-48 h-32 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col p-6 gap-3">
            <div className="w-full h-2 bg-primary/20 rounded" />
            <div className="w-1/2 h-2 bg-primary/20 rounded" />
            <div className="w-3/4 h-2 bg-primary/20 rounded" />
          </div>
        </div>

        {/* Scanning Ray */}
        <motion.div
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-10%] right-[-10%] h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_#2dd4bf] z-10"
        />

        {/* Data points popping up */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
            className={`absolute px-3 py-1 rounded-full bg-primary text-dark text-[8px] font-black whitespace-nowrap shadow-lg`}
            style={{ 
              top: `${20 + (i * 15)}%`, 
              left: `${i % 2 === 0 ? '-10' : '60'}%` 
            }}
          >
            {['BATCH_OK', 'EXP: 2026', 'GENUINE', 'PRICE: 120'][i]}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function AgentVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <div className="relative">
        {/* Core Agent Sphere */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary blur-3xl opacity-20" 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-40 h-40 rounded-full border-2 border-primary/30 flex items-center justify-center overflow-hidden">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 rounded-full border-t-4 border-primary shadow-[0_0_15px_#2dd4bf]" 
            />
          </div>
          
          {/* Pulsing Core */}
          <div className="absolute w-12 h-12 rounded-full bg-primary shadow-[0_0_30px_#2dd4bf] flex items-center justify-center">
            <div className="w-4 h-4 bg-dark rounded-full animate-ping" />
          </div>
        </div>

        {/* Orbiting Insight Bubbles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ 
              scale: 1,
              rotate: 360,
            }}
            transition={{ 
              scale: { duration: 0.8, delay: 1 + (i * 0.6), ease: "backOut" },
              rotate: { duration: 20, repeat: Infinity, ease: "linear", delay: 2 + (i * 0.6) }
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none"
          >
            <motion.div 
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: [0, -20, 0], opacity: 1 }}
              transition={{ 
                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 + (i * 0.6) },
                opacity: { duration: 0.5, delay: 1 + (i * 0.6) }
              }}
              className="absolute bg-dark/80 backdrop-blur-xl p-3 border border-primary/20 rounded-2xl shadow-2xl"
              style={{ top: '0', left: '50%', transform: 'translateX(-50%)' }}
            >
              <div 
                style={{ transform: `rotate(${- (2 + (i * 0.6)) * 18}deg)` }} // Compensate for initial rotation if needed
              >
                <p className="text-[10px] font-bold text-primary whitespace-nowrap">
                  {['Stock Alert: low', 'Revenue: +12%', 'Staff efficiency peak'][i]}
                </p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function AIInsightsVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Brain/Chip Center */}
        <div className="relative w-32 h-32 bg-primary/20 rounded-3xl border border-primary/40 flex items-center justify-center backdrop-blur-xl">
          <Cpu className="w-16 h-16 text-primary animate-pulse" />
          
          {/* Pulse Rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              className="absolute inset-0 border border-primary rounded-3xl"
            />
          ))}
        </div>

        {/* Data Streams */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-20 bg-gradient-to-t from-primary/50 to-transparent rounded-full"
            style={{ rotate: `${i * 45}deg`, transformOrigin: 'bottom center', bottom: '50%' }}
            animate={{ height: [20, 100, 20], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ReportingVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <div className="relative w-full max-w-sm aspect-video bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
            <div className="w-3 h-3 rounded-full bg-green-400/50" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly Analytics</span>
        </div>
        
        <div className="space-y-4 pt-2">
          {[
            { label: 'Inventory Turnover', val: '84%', color: 'bg-primary' },
            { label: 'Customer Retention', val: '92%', color: 'bg-secondary' },
            { label: 'Operational Speed', val: '76%', color: 'bg-green-400' }
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-slate-400">{item.label}</span>
                <span className="text-white">{item.val}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: item.val }}
                  transition={{ duration: 1, delay: i * 0.2 }}
                  className={`h-full ${item.color} shadow-[0_0_10px_currentColor]`}
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
      <div className="relative w-full max-w-sm aspect-[4/3] bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col gap-6 overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Total Revenue</p>
            <h4 className="text-3xl font-bold font-outfit text-white">₹4,82,900</h4>
          </div>
          <div className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-[10px] font-black">+14.2%</div>
        </div>

        <div className="flex-1 flex items-end gap-2 px-2">
          {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className="flex-1 bg-gradient-to-t from-primary/20 to-primary rounded-t-lg relative group"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-dark text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {h}k
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[8px] uppercase font-bold text-slate-500 mb-1">Net Profit</p>
            <p className="text-lg font-bold text-primary font-outfit">₹1.2L</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[8px] uppercase font-bold text-slate-500 mb-1">Expenses</p>
            <p className="text-lg font-bold text-red-400 font-outfit">₹3.6L</p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>
    </div>
  );
}

export function CashflowVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-12">
      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Central Wallet/Bank Icon circle */}
        <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center relative z-10">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_#2dd4bf]">
              <div className="w-6 h-1 bg-dark rounded-full rotate-90 absolute" />
              <div className="w-6 h-1 bg-dark rounded-full" />
            </div>
          </motion.div>
        </div>

        {/* Orbiting supplier/customer nodes */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: i * -3.75 }}
            className="absolute w-full h-full flex items-center justify-center pointer-events-none"
          >
            <div 
              className="absolute w-12 h-12 bg-dark border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ transform: `translateY(-140px)` }}
            >
              <div className={`w-6 h-6 rounded-lg ${i % 2 === 0 ? 'bg-secondary' : 'bg-primary'} opacity-40`} />
              
              {/* Money flow arrows */}
              <motion.div
                animate={{ 
                  y: i % 2 === 0 ? [0, 80] : [80, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                className="absolute text-primary font-black text-[14px]"
              >
                ₹
              </motion.div>
            </div>
          </motion.div>
        ))}

        {/* Text labels */}
        <div className="absolute top-0 left-0 bg-secondary/10 border border-secondary/20 px-3 py-1 rounded-full text-[10px] font-bold text-secondary -translate-y-4 -translate-x-4">Suppliers</div>
        <div className="absolute bottom-0 right-0 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold text-primary translate-y-4 translate-x-4">Receivables</div>
      </div>
    </div>
  );
}
