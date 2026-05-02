import { motion } from 'framer-motion';
import { Pill, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Vision', href: '#vision' },
    { name: 'Customers', href: '#customers' },
    { name: 'The Owner', href: '#owner' },
  ];

  return (
    <nav className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
      <div className="glass-morphism rounded-full px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-full shadow-lg shadow-primary/50">
            <Pill className="text-dark w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight font-outfit">
            Krishna <span className="text-primary">Medicose</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <motion.a
              key={link.name}
              href={link.href}
              className="text-sm font-medium hover:text-primary transition-colors relative group"
              whileHover={{ y: -2 }}
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </motion.a>
          ))}
          <button className="btn-primary py-2 text-sm">
            Contact Us
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2">
            {isOpen ? <X className="text-primary" /> : <Menu className="text-primary" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-4 glass-morphism rounded-3xl p-6 flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium hover:text-primary transition-colors border-b border-white/5 pb-2"
            >
              {link.name}
            </a>
          ))}
          <button className="btn-primary w-full">Contact Us</button>
        </motion.div>
      )}
    </nav>
  );
}
