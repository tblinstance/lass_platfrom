import React, { useState } from 'react';
import { Settings, Bell, Globe, Save, CheckCircle2, Layers, BarChart3, CreditCard, User, Rocket } from 'lucide-react';

import MemberBillingView from '../billing';
import MemberProjectView from '../project';
import MemberUsageView from '../usage';
import MemberProfileView from '../profiles';

interface MemberSettingsProps {
  user: any;
  refreshUser: () => Promise<void>;
  instancesCount: number;
}

export default function MemberSettingsView({ user, refreshUser, instancesCount }: MemberSettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'quotas' | 'usage' | 'billing' | 'profile'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [workspaceName, setWorkspaceName] = useState('My Sandbox Workspace');
  const [region, setRegion] = useState('us-west');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <Settings className="text-teal-400 w-8 h-8" />
            Workspace Settings
          </h2>
          <p className="text-gray-400 mt-1">Configure your sandbox preferences, notifications, and default region settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition cursor-pointer text-sm ${
              activeTab === 'general'
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                : 'text-gray-400 hover:text-app-text-h hover:bg-app-card border border-transparent'
            }`}
          >
            <Globe className="w-4.5 h-4.5" />
            General
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition cursor-pointer text-sm ${
              activeTab === 'notifications'
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                : 'text-gray-400 hover:text-app-text-h hover:bg-app-card border border-transparent'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('quotas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition cursor-pointer text-sm ${
              activeTab === 'quotas'
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                : 'text-gray-400 hover:text-app-text-h hover:bg-app-card border border-transparent'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            Quotas
          </button>

          <button
            onClick={() => setActiveTab('usage')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition cursor-pointer text-sm ${
              activeTab === 'usage'
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                : 'text-gray-400 hover:text-app-text-h hover:bg-app-card border border-transparent'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            Metrics
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition cursor-pointer text-sm ${
              activeTab === 'billing'
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                : 'text-gray-400 hover:text-app-text-h hover:bg-app-card border border-transparent'
            }`}
          >
            <CreditCard className="w-4.5 h-4.5" />
            Billing & Plan
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition cursor-pointer text-sm ${
              activeTab === 'profile'
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                : 'text-gray-400 hover:text-app-text-h hover:bg-app-card border border-transparent'
            }`}
          >
            <User className="w-4.5 h-4.5" />
            User Profile
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'general' || activeTab === 'notifications' ? (
          <div className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-6">
            <h3 className="text-xl font-bold text-app-text-h mb-6">
              {activeTab === 'general' && 'General Preferences'}
              {activeTab === 'notifications' && 'Notification Preferences'}
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              {activeTab === 'general' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 block">Workspace Name</label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-bg text-sm text-app-text-h focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500">This name will be displayed in your navigation bar.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300 block">Default Deployment Region</label>
                    <div className="relative">
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-bg text-sm text-app-text-h focus:outline-none focus:border-teal-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="us-west">US West (Oregon)</option>
                        <option value="us-east">US East (Virginia)</option>
                        <option value="eu-central">EU Central (Frankfurt)</option>
                        <option value="ap-south">AP South (Mumbai)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">New instances will default to this geographic region.</p>
                  </div>
                </>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-app-border-dim bg-app-bg/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-app-text-h text-sm">System Alerts</h4>
                      <p className="text-xs text-gray-400 mt-1">Receive emails when resources exceed 80% usage limits.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
                      <div className="w-11 h-6 bg-app-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </label>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-app-border-dim bg-app-bg/50 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-app-text-h text-sm">Product Updates</h4>
                      <p className="text-xs text-gray-400 mt-1">Receive emails about new templates, marketplace apps, and platform features.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={marketingEmails} onChange={() => setMarketingEmails(!marketingEmails)} />
                      <div className="w-11 h-6 bg-app-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </label>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>Settings updated successfully!</span>
                </div>
              )}

              <div className="pt-4 border-t border-app-border-dim flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition cursor-pointer shadow-lg shadow-teal-500/10"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
          ) : activeTab === 'quotas' ? (
            <MemberProjectView instancesCount={instancesCount} />
          ) : activeTab === 'usage' ? (
            <MemberUsageView />
          ) : activeTab === 'billing' ? (
            <MemberBillingView />
          ) : activeTab === 'profile' ? (
            <MemberProfileView user={user} refreshUser={refreshUser} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
