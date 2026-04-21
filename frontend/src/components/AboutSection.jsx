import { motion } from 'framer-motion';
import { Eye, TrendingUp, Users, CheckCircle2 } from 'lucide-react';

export default function AboutSection({ content }) {
  const aboutData = content || {
    vision_title: "Our Vision & Commitment",
    vision_description: "At Krishna Medicose, our vision stretches beyond providing pharmaceuticals. We strive to create a holistic wellness ecosystem where every customer feels valued and every medical need is met with precision and care.",
    stats: [
      { label: 'Happy Customers', value: '10K+', icon: Users },
      { label: 'Medicines Available', value: '15K+', icon: CheckCircle2 },
      { label: 'Years of Trust', value: '25+', icon: TrendingUp },
    ],
    satisfaction_rate: "99%"
  };

  const stats = aboutData.stats;

  return (
    <section id="vision" className="section-padding relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="md:order-2"
          >
            <div className="relative rounded-[3rem] overflow-hidden group">
              <img 
                src={aboutData.image || "/assets/happy-customers.png"} 
                alt="Happy Customers" 
                className="w-full h-auto object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay group-hover:bg-transparent transition-colors duration-700" />
              
              {/* Floating Stat Card */}
              <motion.div 
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 -right-4 glass-morphism p-6 rounded-2xl border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-primary">{aboutData.satisfaction_rate}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Satisfaction<br/>Rate</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <div className="md:order-1">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold font-outfit mb-8 relative"
            >
              {aboutData.vision_title.includes(' & ') ? (
                <>
                  {aboutData.vision_title.split(' & ')[0]} & <span className="text-secondary">{aboutData.vision_title.split(' & ')[1]}</span>
                </>
              ) : aboutData.vision_title}
              <div className="absolute -top-10 -left-6 text-primary/10 text-8xl font-black -z-10 select-none uppercase tracking-tighter">VISION</div>
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-slate-400 mb-10 leading-relaxed"
            >
              {aboutData.vision_description}
            </motion.p>

            <div className="space-y-6 mb-12">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl glass flex items-center justify-center text-primary border border-primary/20">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1 font-outfit">Modern Vision</h3>
                  <p className="text-slate-400">Integrating latest medical technologies for faster and more accurate pharmaceutical services.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl glass flex items-center justify-center text-secondary border border-secondary/20">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1 font-outfit">Customer First</h3>
                  <p className="text-slate-400">Trusted by over 10,000+ families across Bharatpur for genuine medicines and expert advice.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-outfit">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
