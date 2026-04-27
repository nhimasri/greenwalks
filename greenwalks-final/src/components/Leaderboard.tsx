import { Trophy, TrendingUp, User, Leaf, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalCO2Saved', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Global Ranks</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-eco-100 dark:bg-eco-900/30 rounded-full text-eco-700 dark:text-eco-400 text-xs font-bold">
          <TrendingUp className="w-3 h-3" />
          Live
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-eco-500 animate-spin" />
          </div>
        ) : users.length > 0 ? users.map((user, index) => (
          <div 
            key={user.id} 
            className={cn(
              "flex items-center gap-4 p-5 transition-colors active:bg-slate-50 dark:active:bg-slate-800",
              index !== users.length - 1 && "border-b border-slate-50 dark:border-slate-800"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm",
              index === 0 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
              index === 1 ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" :
              index === 2 ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
              "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            )}>
              {index + 1}
            </div>
            
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white">{user.name || 'Anonymous'}</h4>
              <p className="text-slate-400 dark:text-slate-500 text-xs">Level {user.level || 1}</p>
            </div>

            <div className="text-right">
              <p className="text-eco-600 dark:text-eco-400 font-display font-bold">{((user.totalCO2Saved || 0) / 1000).toFixed(1)}kg</p>
              <p className="text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-wider">Saved</p>
            </div>
          </div>
        )) : (
          <div className="p-12 text-center text-slate-400 italic text-sm">
            No rankings yet. Start walking!
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 rounded-3xl text-center">
        <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h4 className="text-white font-bold mb-1">Weekly Challenge</h4>
        <p className="text-slate-400 text-xs leading-relaxed">
          The top 3 performers receive the "Mega Tree" digital badge and 500 XP.
        </p>
      </div>
    </div>
  );
}
