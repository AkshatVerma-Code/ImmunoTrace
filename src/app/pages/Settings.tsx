import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { Bell, Lock, Smartphone, User, Shield, Check, Globe } from 'lucide-react';

export function Settings() {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
    { id: 'integrations', label: 'Connected Devices', icon: Smartphone },
  ];

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28">
      <Header />
      <main className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-12">
            <h1 className="text-4xl font-heading font-extrabold text-slate-900 tracking-tighter mb-1">Preferences & Settings</h1>
            <p className="text-sm text-slate-500">Manage your account configurations, privacy, and connected integrations.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Tabs */}
            <div className="lg:w-64 shrink-0">
              <nav className="flex flex-col gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-[#0F3D3E] text-white shadow-lg shadow-[#0F3D3E]/20' 
                        : 'text-slate-500 hover:bg-white/80 hover:text-slate-800 border border-transparent hover:border-white shadow-sm hover:shadow-[0_4px_20px_rgb(0,0,0,0.02)]'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-[#2EC4B6]' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white p-8 md:p-10 min-h-[500px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 'account' && (
                      <div>
                        <h3 className="text-2xl font-heading font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100">Account Preferences</h3>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                            <input type="text" defaultValue="Sarah Mitchell" className="w-full max-w-md px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-[14px] text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]/20 focus:bg-white transition-all" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Email</label>
                            <input type="email" defaultValue="sarah.mitchell@example.com" className="w-full max-w-md px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-[14px] text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]/20 focus:bg-white transition-all" />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Time Zone</label>
                            <div className="relative max-w-md">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <select className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-[14px] text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]/20 focus:bg-white transition-all appearance-none">
                                <option>Pacific Time (PT)</option>
                                <option>Eastern Time (ET)</option>
                                <option>Central Time (CT)</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="pt-8 mt-8 border-t border-slate-100">
                            <button className="px-8 py-3 bg-[#0F3D3E] hover:bg-[#1A595A] text-white rounded-full text-sm font-medium shadow-lg shadow-[#0F3D3E]/20 transition-all">
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'notifications' && (
                      <div>
                        <h3 className="text-2xl font-heading font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100">Notification Settings</h3>
                        <div className="space-y-4">
                          {[
                            { title: 'Medication Reminders', desc: 'Push notifications for scheduled doses.' },
                            { title: 'Appointment Alerts', desc: 'Email and SMS reminders 24 hours before.' },
                            { title: 'AI Health Insights', desc: 'Weekly digest of pattern detection and summaries.' },
                            { title: 'Document Uploads', desc: 'Notify when new lab results are synced.' }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-4 p-5 rounded-[24px] bg-slate-50/50 border border-transparent hover:border-slate-200 transition-all">
                              <div>
                                <div className="text-sm font-medium text-slate-800 mb-0.5">{item.title}</div>
                                <div className="text-xs text-slate-500">{item.desc}</div>
                              </div>
                              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#2EC4B6] shadow-inner transition-colors cursor-pointer shrink-0">
                                <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white shadow-sm transition-transform" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'integrations' && (
                      <div>
                        <h3 className="text-2xl font-heading font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100">Connected Devices & Apps</h3>
                        <div className="space-y-4">
                          {[
                            { name: 'Apple Health', status: 'Connected', sync: 'Synced 10m ago' },
                            { name: 'Oura Ring', status: 'Connected', sync: 'Synced 2h ago' },
                            { name: 'Google Fit', status: 'Not Connected', sync: '' }
                          ].map((app, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[24px] bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:border-[#2EC4B6]/30 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-[#EAF7F6] flex items-center justify-center">
                                  <Smartphone className="w-5 h-5 text-[#2EC4B6]" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-slate-800">{app.name}</div>
                                  {app.sync && <div className="text-[11px] text-slate-500 mt-1">{app.sync}</div>}
                                </div>
                              </div>
                              <button className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all ${
                                app.status === 'Connected' 
                                  ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' 
                                  : 'bg-[#0F3D3E] text-white shadow-md shadow-[#0F3D3E]/20 hover:bg-[#1A595A]'
                              }`}>
                                {app.status === 'Connected' ? 'Disconnect' : 'Connect'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'privacy' && (
                      <div>
                        <h3 className="text-2xl font-heading font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100 flex items-center gap-3">
                          <Shield className="w-5 h-5 text-[#2EC4B6]" /> Privacy & Security
                        </h3>
                        
                        <div className="space-y-8">
                          <div className="p-6 rounded-2xl border border-[#2EC4B6]/20 bg-[#EAF7F6]/50">
                            <h4 className="text-sm font-bold text-[#0F3D3E] mb-2 flex items-center gap-2">
                              <Check className="w-4 h-4 text-[#2EC4B6]" /> HIPAA Compliant
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                              Your health data is encrypted at rest and in transit. HealthWise strictly adheres to HIPAA guidelines for data protection and privacy.
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Data Sharing Preferences</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between gap-4 p-4 rounded-xl hover:bg-slate-50/50 transition-colors">
                                <div>
                                  <div className="text-sm font-medium text-slate-800">Allow AI Pattern Analysis</div>
                                  <div className="text-xs text-slate-500 mt-1">Enable HealthWise to process your data for insights.</div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#2EC4B6] transition-colors cursor-pointer">
                                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition-transform" />
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-4 p-4 rounded-xl hover:bg-slate-50/50 transition-colors">
                                <div>
                                  <div className="text-sm font-medium text-slate-800">Share with Primary Care Provider</div>
                                  <div className="text-xs text-slate-500 mt-1">Automatically send summaries to Dr. Sarah Chen.</div>
                                </div>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors cursor-pointer">
                                  <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white transition-transform" />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-8 border-t border-slate-100">
                            <button className="px-6 py-2.5 bg-red-50 text-red-600 rounded-full text-sm font-medium hover:bg-red-100 transition-all">
                              Export My Data
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}