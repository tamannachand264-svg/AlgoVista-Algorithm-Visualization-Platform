import React, { useState } from 'react';
import { TabType } from '../types';
import { 
  Network, 
  BarChart2, 
  Cpu, 
  Database, 
  Activity,
  Award,
  Sliders,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
}

export default function Navbar({ currentTab, setCurrentTab }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'home', label: 'Overview', icon: <Sparkles className="w-4 h-4" />, color: 'from-blue-400 to-cyan-400' },
    { id: 'pathfinder', label: 'Pathfinder', icon: <Network className="w-4 h-4" />, color: 'from-cyan-400 to-blue-500' },
    { id: 'sorting', label: 'Sorting', icon: <BarChart2 className="w-4 h-4" />, color: 'from-purple-400 to-pink-500' },
    { id: 'cpu', label: 'CPU Sim', icon: <Cpu className="w-4 h-4" />, color: 'from-emerald-400 to-cyan-400' },
    { id: 'memory', label: 'Memory', icon: <Database className="w-4 h-4" />, color: 'from-orange-400 to-rose-500' },
    { id: 'comparison', label: 'Arena', icon: <Award className="w-4 h-4" />, color: 'from-pink-400 to-purple-600' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-header px-6 py-4 flex flex-col relative">
      <div className="w-full flex items-center justify-between">
        {/* Brand Logo */}
        <button 
          onClick={() => {
            setCurrentTab('home');
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 group cursor-pointer text-left"
          id="btn-logo"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#0a0a0c] rounded-[11px] flex items-center justify-center">
              <Activity className="w-4 h-4 text-cyan-400 group-hover:text-purple-400 transition-colors duration-300" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-xl blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-300 -z-10" />
          </div>
          <div className="text-left">
            <span className="font-display font-medium text-lg leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AlgoVista
            </span>
            <span className="block font-mono text-[9px] text-cyan-400/80 tracking-widest leading-none mt-0.5">
              ALGORITHM DECK
            </span>
          </div>
        </button>

        {/* Desktop Navigation Floating Dock-like bar */}
        <nav className="hidden md:flex items-center bg-[#13131a]/60 border border-white/[0.04] rounded-full p-1.5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                id={`nav-tab-${tab.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs font-medium cursor-pointer transition-all duration-300 relative ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                {isActive && (
                  <div 
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${tab.color} opacity-[0.12]`} 
                  />
                )}
                {isActive && (
                  <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" 
                  />
                )}
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* CTA and Hamburger Controls */}
        <div className="flex items-center gap-3">
          {/* Desktop CTA */}
          <a 
            href="#visualizers" 
            onClick={(e) => {
              e.preventDefault();
              if (currentTab === 'home') {
                setCurrentTab('pathfinder');
              }
            }}
            className="hidden sm:inline-flex relative items-center justify-center p-0.5 overflow-hidden text-xs font-mono font-medium rounded-lg group bg-gradient-to-br from-cyan-500 to-purple-600 text-white focus:ring-4 focus:outline-none focus:ring-cyan-800 cursor-pointer"
            id="btn-navbar-cta"
          >
            <span className="relative px-4 py-2 transition-all ease-in duration-75 bg-[#0a0a0c] rounded-md group-hover:bg-opacity-0">
              LAUNCH CONTROLS
            </span>
          </a>

          {/* Hamburger Menu Icon for Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="md:hidden flex items-center justify-center p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/10 text-cyan-400 transition-all duration-200 cursor-pointer"
            id="btn-mobile-hamburger"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-purple-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="w-full flex flex-col gap-2.5 mt-4 pt-4 border-t border-white/[0.05] animate-in fade-in slide-in-from-top-4 duration-200 md:hidden pb-2">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                id={`mobile-nav-tab-${tab.id}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-sans text-xs font-medium cursor-pointer transition-all duration-200 text-left w-full ${
                  isActive 
                    ? 'text-white bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border border-cyan-500/15' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.02] border border-transparent'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'bg-white/[0.02] text-slate-450'}`}>
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
