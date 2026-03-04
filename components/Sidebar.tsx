import React from 'react';
import { 
  LayoutDashboard, 
  Globe, 
  Settings, 
  Activity, 
  ShieldCheck, 
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Sessions', icon: Clock, href: '/dashboard/sessions' },
    // { name: 'Domain Activity', icon: Globe, href: '/dashboard/domainActivity' },
    // { name: 'Device Details', icon: Smartphone, href: '/dashboard/deviceDetails' },
    // { name: 'Security Logs', icon: ShieldCheck, href: '#' },
    // { name: 'Settings', icon: Settings, href: '#' },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className="bg-brand-card border-r border-brand-border flex flex-col relative z-20 shadow-xl h-full"
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-brand-accent/20">
          <Activity size={18} />
        </div>
        {isOpen && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-lg tracking-tight whitespace-nowrap"
          >
            INDIREX <span className="text-brand-accent font-normal">[router]</span>
          </motion.span>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-brand-accent/10 text-brand-accent" 
                  : "text-brand-muted hover:bg-brand-accent/5 hover:text-brand-text"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0 transition-colors",
                isActive ? "text-brand-accent" : "group-hover:text-brand-text"
              )} />
              {isOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brand-border">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-brand-accent/10 text-brand-muted hover:text-brand-accent transition-colors"
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>
    </motion.aside>
  );
};
