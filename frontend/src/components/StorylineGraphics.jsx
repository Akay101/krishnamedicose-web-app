import { motion } from 'framer-motion';

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
            animate={{ 
              rotate: [0, 360],
              y: [0, -20, 0]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none"
          >
            <div 
              className="absolute bg-dark/80 backdrop-blur-xl p-3 border border-primary/20 rounded-2xl shadow-2xl"
              style={{ top: '0', left: '50%', transform: `translateX(-50%) rotate(${-i * 120}deg)` }}
            >
              <p className="text-[10px] font-bold text-primary whitespace-nowrap">
                {['Stock Alert: low', 'Revenue: +12%', 'Staff efficiency peak'][i]}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
