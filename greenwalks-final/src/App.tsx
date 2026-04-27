import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, MapPin, User, Flame, Loader2, Home } from 'lucide-react';
import { cn } from './lib/utils';
import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Auth from './components/Auth';
import { UserStats, User as UserType, Trip, Challenge } from './types';
import { BADGES_DATA } from './constants';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { EcoSuggestion } from './services/geminiService';

const INITIAL_STATS: UserStats = {
  user: null,
  totalDistance: 0,
  totalCO2Saved: 0,
  streakDays: 0,
  lastActive: Date.now(),
  level: 1,
  experience: 0,
  ecoScore: 50,
  ecoCredits: 0,
  badges: [],
  theme: 'light',
  challenges: [
    { id: '1', title: 'Early Bird', description: 'Walk 2km this week', goal: 2000, current: 0, points: 100, type: 'DISTANCE' },
    { id: '2', title: 'Carbon Cutter', description: 'Save 500g of CO2', goal: 500, current: 0, points: 150, type: 'CO2' },
    { id: '3', title: 'Eco Streak', description: 'Maintain a 3-day streak', goal: 3, current: 0, points: 200, type: 'STREAK' },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'track' | 'leaderboard' | 'profile'>('home');
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const privateDocRef = doc(db, 'users', firebaseUser.uid, 'private', 'info');
        const tripsColRef = collection(db, 'users', firebaseUser.uid, 'trips');
        const tripsQuery = query(tripsColRef, orderBy('timestamp', 'desc'), limit(50));
        
        let statsData: any = null;
        let privateData: any = null;

        const mergeAndSetStats = () => {
          if (!statsData || !privateData) return;

          setStats(prev => ({
            ...INITIAL_STATS,
            ...statsData,
            theme: privateData.theme || 'light',
            user: {
              name: statsData.name || firebaseUser.displayName || 'Eco Runner',
              email: privateData.email || firebaseUser.email || '',
              avatar: firebaseUser.photoURL || undefined
            }
          }));
          setLoading(false);
        };

        // Listen for stats changes
        const unsubsStats = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            statsData = docSnap.data();
            mergeAndSetStats();
          } else {
            // New user, initialize public doc
            const newStats = {
              ...INITIAL_STATS,
              name: firebaseUser.displayName || 'Eco Runner',
            };
            delete (newStats as any).user;
            delete (newStats as any).theme;
            
            setDoc(userDocRef, newStats).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}`));
            statsData = newStats;
            mergeAndSetStats();
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        });

        // Listen for private info
        const unsubsPrivate = onSnapshot(privateDocRef, (docSnap) => {
          if (docSnap.exists()) {
            privateData = docSnap.data();
            mergeAndSetStats();
          } else {
            // New user, initialize private doc
            const newPrivate = {
              email: firebaseUser.email || '',
              theme: 'light'
            };
            setDoc(privateDocRef, newPrivate).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${firebaseUser.uid}/private/info`));
            privateData = newPrivate;
            mergeAndSetStats();
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/private/info`);
        });

        // Listen for trips
        const unsubsTrips = onSnapshot(tripsQuery, (snap) => {
          const tripData = snap.docs.map(d => ({ ...d.data() } as Trip));
          setTrips(tripData);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/trips`);
        });

        return () => {
          unsubsStats();
          unsubsPrivate();
          unsubsTrips();
        };
      } else {
        setStats(INITIAL_STATS);
        setTrips([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      const isDark = stats.theme === 'dark' || (stats.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
    };

    applyTheme();

    if (stats.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [stats.theme]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Check for newly unlocked badges
    const newlyUnlocked = BADGES_DATA.filter(badge => 
      badge.requirement(stats) && !stats.badges.includes(badge.id)
    ).map(b => b.id);

    if (newlyUnlocked.length > 0) {
      const updatedBadges = [...stats.badges, ...newlyUnlocked];
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      setDoc(userDocRef, { badges: updatedBadges }, { merge: true })
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}`));

      // Simple alert as "notification" for now
      newlyUnlocked.forEach(id => {
        const badge = BADGES_DATA.find(b => b.id === id);
        if (badge) {
          alert(`🎊 Achievement Unlocked: ${badge.name}!\n${badge.description}`);
        }
      });
    }

    // Update challenges current values
    const updatedChallenges = stats.challenges.map(c => {
      let current = c.current;
      if (c.type === 'DISTANCE') current = stats.totalDistance;
      if (c.type === 'CO2') current = stats.totalCO2Saved;
      if (c.type === 'STREAK') current = stats.streakDays;
      return { ...c, current };
    });

    if (JSON.stringify(updatedChallenges) !== JSON.stringify(stats.challenges)) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      setDoc(userDocRef, { challenges: updatedChallenges }, { merge: true })
        .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}`));
    }
  }, [stats.totalDistance, stats.totalCO2Saved, stats.streakDays]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleReset = async () => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const privateDocRef = doc(db, 'users', auth.currentUser.uid, 'private', 'info');
    
    const resetStats = { ...INITIAL_STATS };
    delete (resetStats as any).user;
    delete (resetStats as any).theme;
    
    const resetPrivate = {
      email: auth.currentUser.email || '',
      theme: 'light'
    };

    await Promise.all([
      setDoc(userDocRef, resetStats).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}`)),
      setDoc(privateDocRef, resetPrivate).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}/private/info`))
    ]);
  };

  const handleUpdateProfile = async (user: UserType) => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const privateDocRef = doc(db, 'users', auth.currentUser.uid, 'private', 'info');
    
    await Promise.all([
      setDoc(userDocRef, { name: user.name }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}`)),
      setDoc(privateDocRef, { email: user.email }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}/private/info`))
    ]);
  };

  const handleStatsUpdate = async (newStats: Partial<UserStats>) => {
    if (!auth.currentUser) return;
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, newStats, { merge: true })
      .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}`));
  };

  const handleAddChallenge = async (suggestion: EcoSuggestion) => {
    if (!auth.currentUser) return;
    const newChallenge: Challenge = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${suggestion.type} Challenge`,
      description: suggestion.description,
      goal: suggestion.co2Savings,
      current: 0,
      points: suggestion.xpReward,
      type: 'CO2',
      isSuggested: true
    };

    const updatedChallenges = [...(stats.challenges || []), newChallenge];
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userDocRef, { challenges: updatedChallenges }, { merge: true })
      .catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}`));
    
    alert('🚀 Challenge Accepted! Check your challenge list.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-eco-500 animate-spin" />
      </div>
    );
  }

  if (!stats.user) {
    return <Auth />;
  }

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'track', icon: MapPin, label: 'Track' },
    { id: 'leaderboard', icon: Trophy, label: 'Ranks' },
    { id: 'profile', icon: User, label: 'Me' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col md:max-w-md mx-auto relative overflow-hidden shadow-2xl transition-colors duration-300">
      {/* Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0">
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(#166534 1px, transparent 0)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Top Banner */}
      <header className="p-6 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-2">
          <Logo />
          <h1 className="font-display font-bold text-xl tracking-tight text-slate-800 dark:text-white">GreenWalks</h1>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-900/30">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{stats.streakDays}🔥</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, type: 'spring', damping: 25, stiffness: 300 }}
            className="p-6"
          >
            {activeTab === 'home' && <Dashboard stats={stats} trips={trips} onAddChallenge={handleAddChallenge} />}
            {activeTab === 'track' && <Tracker stats={stats} trips={trips} onUpdateStats={handleStatsUpdate} />}
            {activeTab === 'leaderboard' && <Leaderboard />}
            {activeTab === 'profile' && (
              <Profile 
                stats={stats} 
                trips={trips}
                onLogout={handleLogout} 
                onReset={handleReset} 
                onUpdateProfile={handleUpdateProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:max-w-md mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 p-2 flex justify-around items-center h-20 z-50 transition-colors">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-all duration-300",
              activeTab === tab.id 
                ? "text-eco-600 dark:text-eco-400 bg-eco-50 dark:bg-eco-900/20 scale-105" 
                : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
            )}
          >
            {typeof tab.icon === 'function' ? <tab.icon className={cn("w-5 h-5", activeTab === tab.id && "fill-eco-600/10")} /> : <tab.icon className={cn("w-5 h-5", activeTab === tab.id && "fill-eco-600/10")} />}
            <span className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

