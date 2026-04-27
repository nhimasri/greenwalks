import { UserStats, User as UserType } from '../types';
import { BADGES_DATA } from '../constants';
import { Settings, LogOut, Award, MapPin, Calendar, ShieldCheck, Flame, Bike, Footprints, ChevronRight, Moon, Sun, Monitor, Save, X, History } from 'lucide-react';
import { cn } from '../lib/utils';
import { useMemo, useState } from 'react';
import TripHistory from './TripHistory';

const ICON_MAP = {
  ShieldCheck: ShieldCheck,
  Flame: Flame,
  Bike: Bike,
  Footprints: Footprints
};

export default function Profile({ 
  stats, 
  trips,
  onLogout, 
  onReset,
  onUpdateProfile
}: { 
  stats: UserStats, 
  trips: any[],
  onLogout: () => void,
  onReset: () => void,
  onUpdateProfile: (user: UserType) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [editedName, setEditedName] = useState(stats.user?.name || '');
  const [editedEmail, setEditedEmail] = useState(stats.user?.email || '');

  const unlockedBadgesCount = useMemo(() => {
    return BADGES_DATA.filter(badge => badge.requirement(stats)).length;
  }, [stats]);

  const handleSave = () => {
    onUpdateProfile({
      ...stats.user!,
      name: editedName,
      email: editedEmail,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header Profile */}
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-eco-500 to-emerald-400 rounded-full p-1.5 shadow-xl shadow-eco-100 mb-4 relative">
          <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
            <UserAvatarIcon className="w-12 h-12 text-eco-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-1.5 rounded-xl border-4 border-white dark:border-slate-900 shadow-sm">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3 w-full max-w-[240px]">
            <input 
              type="text" 
              value={editedName} 
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-4 text-center font-bold text-slate-900 dark:text-white"
              placeholder="Name"
            />
            <input 
              type="email" 
              value={editedEmail} 
              onChange={(e) => setEditedEmail(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2 px-4 text-center text-sm text-slate-500"
              placeholder="Email"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="flex-1 bg-eco-600 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">{stats.user?.name || 'Eco Warrior'}</h2>
            <p className="text-slate-400 text-sm mb-4">{stats.user?.email}</p>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-eco-600 text-xs font-bold uppercase tracking-widest bg-eco-50 dark:bg-eco-900/30 px-4 py-2 rounded-full"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>

      {/* Grid Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-xl text-slate-900 dark:text-white font-display font-bold">{stats.streakDays} Days</p>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Streak</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center">
          <MapPin className="w-6 h-6 text-eco-500 mx-auto mb-2" />
          <p className="text-xl text-slate-900 dark:text-white font-display font-bold">{(stats.totalDistance / 1000).toFixed(1)} km</p>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Distance</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">Achievements</h3>
            <p className="text-slate-400 text-xs mt-0.5">Collect markers for eco-actions</p>
          </div>
          <div className="bg-eco-50 dark:bg-eco-900/30 px-3 py-1.5 rounded-full">
            <p className="text-xs font-bold text-eco-600 dark:text-eco-400">{unlockedBadgesCount} / {BADGES_DATA.length}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {BADGES_DATA.map((badge) => {
            const Icon = (ICON_MAP as any)[badge.icon] || Award;
            const isUnlocked = badge.requirement(stats);
            
            return (
              <div key={badge.id} className="flex flex-col items-center gap-3">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                  isUnlocked 
                    ? "bg-eco-500 text-white scale-100 shadow-lg shadow-eco-200 border-none" 
                    : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 opacity-40 grayscale"
                )}>
                  <Icon className={cn("w-7 h-7", isUnlocked && "animate-pulse")} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold text-center leading-tight transition-colors",
                  isUnlocked ? "text-slate-900 dark:text-slate-100" : "text-slate-300 dark:text-slate-700"
                )}>
                  {badge.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
            activeTab === 'settings' 
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-400 dark:text-slate-600"
          )}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all",
            activeTab === 'history' 
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" 
              : "text-slate-400 dark:text-slate-600"
          )}
        >
          <History className="w-4 h-4" /> Trip History
        </button>
      </div>

      {activeTab === 'history' ? (
        <TripHistory trips={trips} />
      ) : (
        <div className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white px-2 mb-2 mt-4">Account</h3>
            
            <button className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <Settings className="w-5 h-5 text-slate-500" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight">Account Notifications</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Stay updated on your eco-progress</span>
                </div>
              </div>
              <div className="w-11 h-6 bg-eco-500 rounded-full relative p-1 transition-colors">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm absolute right-1" />
              </div>
            </button>

            <button 
              onClick={() => {
                if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
                  onReset();
                }
              }}
              className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block leading-tight">Reset All Stats</span>
                  <span className="text-xs text-red-400 dark:text-red-500 font-medium italic">This action is irreversible</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-700" />
            </button>

            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 p-6 text-red-500 font-bold justify-center bg-red-50/50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30 active:scale-[0.98] transition-transform mt-4"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UserAvatarIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

