import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  const navLinks = [
    { name: "Vision", href: isHome ? "#vision" : "/#vision" },
    { name: "Products", href: isHome ? "#offers" : "/#offers" },
    { name: "The Owner", href: isHome ? "#owner" : "/#owner" },
    { name: "Medicine Data", href: isHome ? "#medicine-data" : "/#medicine-data" },
  ];

  return (
    <nav className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
      <div className="glass-morphism rounded-full px-6 py-3 flex items-center justify-between">
        <Logo size="sm" />

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            if (!isHome) {
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-extrabold text-slate-600 hover:text-slate-900 transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all group-hover:w-full" />
                </Link>
              );
            }
            return (
              <motion.a
                key={link.name}
                href={link.href}
                className="text-sm font-extrabold text-slate-600 hover:text-slate-900 transition-colors relative group"
                whileHover={{ y: -1 }}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-teal-600 transition-all group-hover:w-full" />
              </motion.a>
            );
          })}
          <a href="#footer" className="btn-primary py-2 text-sm">Contact Us</a>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="p-2">
            {isOpen ? (
              <X className="text-slate-800" />
            ) : (
              <Menu className="text-slate-800" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mt-4 glass-morphism rounded-3xl p-6 flex flex-col gap-4 shadow-lg"
        >
          {navLinks.map((link) => {
            if (!isHome) {
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-bold text-slate-700 hover:text-teal-600 transition-colors border-b border-slate-100 pb-2"
                >
                  {link.name}
                </Link>
              );
            }
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold text-slate-700 hover:text-teal-600 transition-colors border-b border-slate-100 pb-2"
              >
                {link.name}
              </a>
            );
          })}
          <a 
            href="#footer" 
            onClick={() => setIsOpen(false)}
            className="btn-primary w-full text-center"
          >
            Contact Us
          </a>
        </motion.div>
      )}
    </nav>
  );
}

