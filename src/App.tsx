/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie 
} from 'recharts';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Compass, 
  History, 
  Settings, 
  TrendingUp, 
  Clock, 
  Share2, 
  Flame,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  Zap,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MOCK_REELS } from './mockData';
import { ReelLog, Platform } from './types';
import { STATS_SYSTEM_PROMPT } from './constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'discovery' | 'chat'>('analytics');
  const [reels, setReels] = useState<ReelLog[]>(MOCK_REELS);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: "You spent about 47 minutes scrolling yesterday. Your peak hour is usually 11:14 PM. Just an observation, not a lecture." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [goal, setGoal] = useState<number | null>(50);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stats Calculations
  const stats = useMemo(() => {
    const now = new Date();
    const today = reels.filter(r => new Date(r.timestamp).toDateString() === now.toDateString());
    const todayCount = today.length;
    const todayMinutes = Math.round(today.reduce((acc, r) => acc + r.durationSeconds, 0) / 60);
    
    const platforms = reels.reduce((acc, r) => {
      acc[r.platform] = (acc[r.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const platformBreakdown = Object.entries(platforms).map(([name, value]) => ({ 
      name, 
      value: value as number,
      color: name === 'Instagram' ? '#E4405F' : name === 'TikTok' ? '#FFFFFF' : '#FF0000'
    })).sort((a, b) => (b.value as number) - (a.value as number));

    const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      const daysBack = 6 - i;
      d.setDate(d.getDate() - daysBack);
      const count = reels.filter(r => new Date(r.timestamp).toDateString() === d.toDateString()).length;
      return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), count };
    });

    return {
      todayCount,
      todayMinutes,
      platformBreakdown,
      weeklyTrend,
      goalStatus: goal ? {
        limit: goal,
        current: todayCount,
        percent: Math.round((todayCount / goal) * 100)
      } : null
    };
  }, [reels, goal]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e?: any) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    // Goal extraction logic
    if (userMessage.toLowerCase().includes('limit') || userMessage.toLowerCase().includes('goal')) {
      const match = userMessage.match(/\d+/);
      if (match) {
        setGoal(parseInt(match[0]));
      }
    }

    try {
      const context = `Context: Today: ${stats.todayCount} reels, Goal: ${stats.goalStatus ? `${stats.goalStatus.current}/${stats.goalStatus.limit}` : 'None set'}`;
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        config: { systemInstruction: STATS_SYSTEM_PROMPT },
        contents: [{ role: 'user', parts: [{ text: `${context}\n\nUser Question: ${userMessage}` }] }]
      });
      setMessages(prev => [...prev, { role: 'model', content: response.text || "Thinking..." }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Connection issue. Check your API key or network." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateDiscovery = async () => {
    setIsTyping(true);
    setActiveTab('discovery');
    try {
      const context = `Discovery Context: Platforms: ${JSON.stringify(stats.platformBreakdown)}, Weekly trend: ${JSON.stringify(stats.weeklyTrend)}`;
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Please generate 3 proactive discovery insights for the user's Discovery dashboard. Include one creator suggestion (tech/design), one unusual pattern insight, and one content trend prediction.",
        config: {
          systemInstruction: `${STATS_SYSTEM_PROMPT}\n\n${context}`
        }
      });
      setMessages(prev => [...prev, { role: 'model', content: result.text || "Unable to generate insights at this moment." }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A] text-zinc-100 flex flex-col font-sans overflow-hidden selection:bg-white selection:text-black">
      {/* Top Navigation */}
      <nav className="max-w-7xl w-full mx-auto p-8 lg:p-12 flex justify-between items-center bg-[#0A0A0A]/50 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('analytics')}>
          <div className="w-3 h-3 bg-white rounded-full group-hover:scale-125 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)]"></div>
          <span className="font-serif text-3xl tracking-tighter hover:tracking-normal transition-all duration-500">Stats.</span>
        </div>
        <div className="flex gap-6 lg:gap-10 text-[10px] lg:text-[11px] uppercase tracking-[0.2em] text-zinc-500 font-bold items-center">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'discovery', label: 'Discovery' },
            { id: 'chat', label: 'Stats AI' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => tab.id === 'discovery' ? generateDiscovery() : setActiveTab(tab.id as any)}
              className={cn(
                "hover:text-zinc-300 transition-all relative pb-1 focus:outline-none",
                activeTab === tab.id ? "text-white border-b border-white" : ""
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-8 lg:px-12 pb-12 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col lg:flex-row gap-12 lg:gap-20"
            >
              {/* Left Column: Big Stats */}
              <div className="lg:w-5/12 flex flex-col h-full">
                <div className="mb-20">
                  <span className="text-[11px] uppercase tracking-[0.4em] text-zinc-600 block mb-6">Daily Intake</span>
                  <div className="flex items-baseline gap-4">
                    <h1 className="text-[140px] lg:text-[180px] font-serif leading-[0.8] tracking-tighter">{stats.todayCount}</h1>
                    {stats.goalStatus && (
                      <div className="mb-6 flex flex-col items-center">
                         <div className={cn(
                           "w-12 h-12 rounded-full border flex items-center justify-center text-[10px] font-mono",
                           stats.goalStatus.percent >= 100 ? "border-red-500/50 text-red-400" : "border-white/20 text-zinc-400"
                         )}>
                           {stats.goalStatus.percent}%
                         </div>
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-400 font-serif italic text-2xl mt-4">Reels watched today</p>
                </div>

                <div className="mt-auto bg-zinc-900/30 border border-white/5 p-10 rounded-[48px] relative group hover:border-white/20 transition-all">
                  <div className="absolute -top-3 left-10 bg-white text-black text-[10px] px-4 py-1 font-black uppercase tracking-[0.1em] rounded-full">Assistant</div>
                  <div className="font-serif text-2xl leading-relaxed text-zinc-200">
                    {stats.goalStatus ? (
                      <>
                        "You've watched <span className="text-white border-b border-zinc-800 pb-0.5">{stats.goalStatus.current}</span> of your <span className="text-white border-b border-zinc-800 pb-0.5">{stats.goalStatus.limit}</span> reel limit. {stats.goalStatus.percent >= 100 ? 'Take a breather?' : 'Looking good today.'}"
                      </>
                    ) : (
                      <>
                        "You spent about <span className="text-white border-b border-zinc-800 pb-0.5">{stats.todayMinutes}</span> minutes scrolling today. Should we set a daily limit?"
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Visuals */}
              <div className="lg:w-7/12 flex flex-col gap-10">
                <div className="bg-zinc-900/20 border border-white/5 rounded-[48px] p-10 backdrop-blur-3xl">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-10">Platform Breakdown</h3>
                  <div className="space-y-10">
                    {stats.platformBreakdown.map((platform) => (
                      <div key={platform.name} className="group cursor-default">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-20 group-hover:opacity-100 transition-all" />
                            <span className="font-serif text-2xl tracking-tight text-zinc-400 group-hover:text-white transition-all">{platform.name}</span>
                          </div>
                          <span className="font-mono text-zinc-600 group-hover:text-zinc-400 transition-all">{platform.value} <span className="text-[10px] opacity-40 uppercase tabular-nums">units</span></span>
                        </div>
                        <div className="w-full h-[1px] bg-white/5 relative overflow-hidden">
                          <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '0%' }}
                            transition={{ duration: 1, ease: 'circOut' }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 bg-zinc-900/20 border border-white/5 rounded-[48px] p-10 flex flex-col min-h-[250px]">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-auto">Weekly Volume</h3>
                  <div className="flex items-end justify-between h-40 gap-4 mt-8">
                    {stats.weeklyTrend.map((day, i) => (
                      <div key={day.day} className="flex flex-col items-center gap-4 flex-1 group">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${(day.count / 112) * 100}%` }}
                          transition={{ delay: i * 0.05, duration: 0.8, ease: 'backOut' }}
                          className={cn(
                            "w-full rounded-full transition-all duration-500",
                            day.count === 94 ? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-zinc-800 group-hover:bg-zinc-700"
                          )}
                        />
                        <span className={cn(
                          "text-[9px] uppercase tracking-widest font-mono",
                          day.count === 94 ? "text-white font-bold" : "text-zinc-600"
                        )}>{day.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {(activeTab === 'chat' || activeTab === 'discovery') && (
            <motion.div
              key="chat-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-zinc-900/10 border border-white/5 rounded-[60px] overflow-hidden"
            >
              <div className="p-8 lg:p-12 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-[24px] flex items-center justify-center text-black shadow-2xl">
                    {activeTab === 'chat' ? <Sparkles size={28} /> : <Compass size={28} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif">{activeTab === 'chat' ? 'Ai Assistant' : 'Discovery Engine'}</h3>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-bold">Analyzing consumption vectors</p>
                  </div>
                </div>
                {stats.goalStatus && activeTab === 'chat' && (
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Adherence</p>
                    <p className="font-mono text-xl">{stats.goalStatus.percent}%</p>
                  </div>
                )}
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 scrollbar-hide">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col max-w-[90%] lg:max-w-[80%]",
                      m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-8 lg:p-10 rounded-[48px] text-xl font-serif leading-relaxed",
                      m.role === 'user' 
                        ? "bg-white text-black rounded-tr-none shadow-xl" 
                        : "bg-zinc-900/50 border border-white/10 text-zinc-200 rounded-tl-none backdrop-blur-xl"
                    )}>
                      {m.content.split('\n').map((line, idx) => (
                        <p key={idx} className={idx > 0 ? "mt-4" : ""}>{line}</p>
                      ))}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-3 text-zinc-600 font-serif italic text-lg px-8">
                    <Loader2 size={18} className="animate-spin" />
                    Crunching your scroll patterns...
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-8 lg:p-12 border-t border-white/5 flex gap-6 bg-[#0B0B0B]/80 backdrop-blur-xl">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Stats, set a daily limit, or discover trends..."
                  className="flex-1 px-10 py-6 bg-zinc-900/50 border border-white/10 rounded-full focus:outline-none focus:border-white/30 transition-all font-serif italic text-xl text-white placeholder:text-zinc-800"
                />
                <button
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-20"
                >
                  <Send size={28} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl w-full mx-auto p-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 opacity-30 hover:opacity-100 transition-opacity duration-700">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
          <span className="text-[10px] uppercase tracking-widest font-black">Sync Active: 3 Channels</span>
        </div>
        <div className="flex gap-10">
          <span className="text-[10px] uppercase tracking-widest font-bold">Privacy: On-Device Only</span>
          <span className="text-[10px] uppercase tracking-widest font-bold">Version: 2.1 Savant</span>
        </div>
      </footer>

      {/* Goal Guard Overlay (Optional micro-interaction) */}
      {stats.goalStatus && stats.goalStatus.percent >= 80 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed last:bottom-12 right-12 p-8 bg-zinc-100 text-black rounded-[40px] shadow-2xl flex items-center gap-6 z-50 border border-black/5"
        >
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-white",
            stats.goalStatus.percent >= 100 ? "bg-red-600" : "bg-zinc-800"
          )}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-50">Threshold Alert</p>
            <p className="font-serif text-xl leading-tight">
              {stats.goalStatus.percent >= 100 
                ? "Daily limit reached. Log out?" 
                : "Approaching your set daily limit."}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
