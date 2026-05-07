import { motion } from 'framer-motion';
import { Youtube, Instagram, MessageSquare, ArrowUpRight, Send, Briefcase } from 'lucide-react';
import { useState } from 'react';
import CollaborationModal from './CollaborationModal';

export default function OwnerSection({ content }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const ownerData = content || {
    name: "Krishna Pandit",
    title: "Pharmacist | Content Creator",
    bio: "With a passion for health education, Krishna Pandit has built a digital family of 75,000+ members. At Krishna Medicose, he ensures that every person receives not just medicines, but the right knowledge for their wellbeing.",
    socials: [
      { name: "YouTube", handle: "@krishnamedicos12", url: "https://www.youtube.com/@krishnamedicos12" },
      { name: "Instagram", handle: "@krishna1211pandit", url: "https://www.instagram.com/krishna1211pandit/?hl=en" }
    ],
    social_family: "75K+"
  };

  const iconMap = {
    YouTube: () => (
      <svg viewBox="0 0 24 24" fill="#FF0000" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    Instagram: () => (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#f09433', stopOpacity: 1 }} />
            <stop offset="25%" style={{ stopColor: '#e6683c', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#dc2743', stopOpacity: 1 }} />
            <stop offset="75%" style={{ stopColor: '#cc2366', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#bc1888', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.976.975 1.246 2.242 1.308 3.607.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.976-2.242 1.246-3.607 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.976-.975-1.246-2.242-1.308-3.607-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.976 2.242-1.246 3.607-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.28.072-1.689.072-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.28-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  };

  return (
    <section id="owner" className="section-padding bg-dark-lighter/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold font-outfit mb-4"
          >
            Meet the <span className="text-primary italic">Visionary</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-slate-400 max-w-2xl mx-auto"
          >
            Bridging the gap between pharmaceutical expertise and digital content creation.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center"
          >
            <div className="glass-morphism p-8 md:p-12 rounded-[3.5rem] relative">
              <div className="absolute top-8 right-8 text-primary/20">
                <MessageSquare className="w-16 h-16" />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold font-outfit mb-2">{ownerData.name}</h3>
              <p className="text-primary font-bold text-lg mb-6 uppercase tracking-wider">{ownerData.title}</p>
              
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                {ownerData.bio}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {ownerData.socials.map((social) => {
                  const Icon = iconMap[social.name] || MessageSquare;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center gap-4 p-4 glass rounded-2xl transition-all duration-300 group ${
                        social.name === 'YouTube' ? 'hover:bg-red-500/20 hover:text-red-500' : 'hover:bg-pink-500/20 hover:text-pink-500'
                      }`}
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">{social.name}</div>
                        <div className="font-outfit font-bold truncate text-sm">{social.handle}</div>
                      </div>
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </motion.a>
                  );
                })}
              </div>

              {/* Business Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="w-full relative group overflow-hidden rounded-[2rem] p-px"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-x" />
                <div className="relative bg-dark/90 rounded-[1.95rem] py-5 px-8 flex items-center justify-center gap-3 transition-colors group-hover:bg-transparent">
                  <Briefcase className="w-5 h-5 text-primary group-hover:text-dark transition-colors" />
                  <span className="font-bold text-lg group-hover:text-dark transition-colors">Collaborate / Business</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-dark/20 group-hover:text-dark transition-all">
                    <Send className="w-4 h-4" />
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-[3rem] overflow-hidden group border-8 border-white/5 shadow-2xl">
              <img 
                src={ownerData.image || "/assets/owner-krishna.png"} 
                alt="Krishna Pandit" 
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-10 md:translate-x-0 w-[90%] md:w-auto">
                <div className="glass-morphism px-6 py-4 rounded-3xl border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute inset-0" />
                      <div className="w-3 h-3 bg-green-500 rounded-full relative" />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">{ownerData.social_family} Social Family</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Always Growing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <CollaborationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
