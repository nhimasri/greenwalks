import { UserStats, Trip } from '../types';
import { formatCO2, cn } from '../lib/utils';
import { Award, Zap, TrendingUp, MapPin, Sparkles } from 'lucide-react';
import { Progress } from './ui/Progress';
import WeeklyChallenges from './WeeklyChallenges';
import Logo from './Logo';
import { useState, useEffect } from 'react';
import { getSustainabilityTip, getEcoSuggestions, EcoSuggestion } from '../services/geminiService';

export default function Dashboard({ stats, trips, onAddChallenge }: { stats: UserStats, trips: Trip[], onAddChallenge: (suggestion: EcoSuggestion) => void }) {
  const [tip, setTip] = useState<string>('Every step counts towards a greener planet!');
  const [suggestions, setSuggestions] = useState<EcoSuggestion[]>([]);
  const nextLevelXP = 1000 * stats.level;
  const progress = (stats.experience / nextLevelXP) * 100;

  useEffect(() => {
    getSustainabilityTip().then(setTip);
    
    // Use last 5 trips for suggestions if available
    const history = trips.slice(0, 5).map(t => `${t.activity} trip of ${Number(t.distance || 0).toFixed(0)}m`);
    const finalHistory = history.length > 0 ? history : ['car trip to work', 'short drive to grocery'];
    
    getEcoSuggestions(finalHistory).then(setSuggestions);
  }, [trips]);

  return (
    <div className="space-y-8">
      {/* Level Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <TrendingUp className="w-32 h-32" />
        </div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Eco Level</p>
            <h2 className="text-4xl font-display font-bold text-eco-600 dark:text-eco-400">{stats.level}</h2>
          </div>
          <div className="text-right text-slate-400 dark:text-slate-500 text-xs font-bold tracking-widest uppercase">
            {stats.experience.toFixed(0)} / {nextLevelXP} XP
          </div>
        </div>
        <Progress value={progress} className="h-3 bg-eco-50 dark:bg-eco-900/10" />
      </div>

      {/* Score & Credits Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-xl">
           <div className="relative z-10">
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Eco Score</p>
             <h3 className="text-3xl font-display font-bold text-eco-400">{stats.ecoScore}</h3>
             <p className="text-[9px] text-slate-500 mt-2 font-medium">Sustainable travel rating</p>
           </div>
           <Award className="absolute -bottom-2 -right-2 w-16 h-16 text-white/5" />
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
           <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Eco Credits</p>
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
               <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
             </div>
             <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase">{stats.ecoCredits}</h3>
           </div>
           <p className="text-slate-400 text-[9px] mt-2 font-medium">Redeemable for rewards</p>
        </div>
      </div>

      <WeeklyChallenges challenges={stats.challenges.filter(c => !c.isSuggested)} />

      {stats.challenges.some(c => !!c.isSuggested) && (
        <WeeklyChallenges 
          challenges={stats.challenges.filter(c => !!c.isSuggested)} 
          title="Additional Challenges" 
        />
      )}

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={() => <Logo className="w-5 h-5 !bg-transparent !p-0 !border-0" />} 
          label="CO2 Saved" 
          value={formatCO2(stats.totalCO2Saved)} 
          color="bg-emerald-500" 
        />
        <StatCard 
          icon={Zap} 
          label="Energy" 
          value={`${(stats.totalCO2Saved * 0.4).toFixed(0)}Wh`} 
          color="bg-amber-500" 
        />
      </div>

      {/* Smart Nudge */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="w-4 h-4 text-eco-500" />
          <h3 className="font-display font-bold text-slate-900 dark:text-white">Eco-Suggestions</h3>
        </div>
        
        {suggestions.length > 0 ? suggestions.map((suggestion, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-eco-50 dark:bg-eco-900/20 rounded-2xl flex-shrink-0">
              <MapPin className="w-6 h-6 text-eco-600 dark:text-eco-400" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Replace: {suggestion.originalTripDesc}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-3">
                {suggestion.description}. You'll save <span className="text-eco-600 dark:text-eco-400 font-bold">{suggestion.co2Savings}g CO2</span> and earn {suggestion.xpReward} XP!
              </p>
              <button 
                onClick={() => onAddChallenge(suggestion)}
                className="text-eco-600 dark:text-eco-400 font-bold text-sm flex items-center gap-1 hover:underline underline-offset-4"
              >
                Accept Challenge <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        )) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <p className="text-slate-400 text-sm italic">Analyzing your travel patterns for suggestions...</p>
          </div>
        )}
      </div>

      {/* Hero Tip */}
      <div className="bg-eco-900 text-white p-6 rounded-3xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-display font-bold text-lg mb-2 text-eco-200 flex items-center gap-2">
            Tips <Sparkles className="w-4 h-4 text-eco-300" />
          </h3>
          <p className="text-eco-50/80 text-sm leading-relaxed italic">
            "{tip}"
          </p>
          <p className="text-eco-100/50 text-[10px] mt-4 font-bold uppercase tracking-widest">
            Current Impact: { (stats.totalCO2Saved / 57).toFixed(1) } days of a tree's work
          </p>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-10 transform rotate-12">
          <Logo className="w-48 h-48 !bg-transparent !border-0 !shadow-none" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className={cn("inline-flex p-2.5 rounded-2xl mb-4", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-slate-900 dark:text-white font-display font-bold text-xl">{value}</p>
    </div>
  );
}
