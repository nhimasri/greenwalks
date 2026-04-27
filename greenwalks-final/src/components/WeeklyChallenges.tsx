import { Challenge } from '../types';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { Progress } from './ui/Progress';
import { formatDistance, formatCO2 } from '../lib/utils';

export default function WeeklyChallenges({ challenges, title = "Weekly Challenges" }: { challenges: Challenge[], title?: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">{title}</h3>
        <span className="text-[10px] font-bold text-eco-600 dark:text-eco-400 bg-eco-50 dark:bg-eco-900/30 px-2 py-0.5 rounded-full uppercase">Expiring in 2d</span>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge) => {
          const isCompleted = challenge.current >= challenge.goal;
          const progress = (challenge.current / challenge.goal) * 100;
          
          return (
            <div key={challenge.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isCompleted ? 'bg-eco-100 dark:bg-eco-900/30 text-eco-600 dark:text-eco-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600'}`}>
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{challenge.title}</h4>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">{challenge.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-eco-600 dark:text-eco-400 font-bold text-xs">+{challenge.points} XP</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-eco-500 dark:text-eco-400 mt-1 ml-auto" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-200 dark:text-slate-700 mt-1 ml-auto" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                  <span>Progress</span>
                  <span>
                    {challenge.type === 'DISTANCE' && `${formatDistance(challenge.current)} / ${formatDistance(challenge.goal)}`}
                    {challenge.type === 'CO2' && `${formatCO2(challenge.current)} / ${formatCO2(challenge.goal)}`}
                    {challenge.type === 'STREAK' && `${challenge.current} / ${challenge.goal} days`}
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
