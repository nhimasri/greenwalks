import { useState, FormEvent } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { User } from '../types';
import Logo from './Logo';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        
        // Initialize user doc if it doesn't exist
        const userDocRef = doc(db, 'users', userCred.user.uid);
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          await setDoc(userDocRef, {
            name,
            email,
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
            ]
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center">
      <div className="mb-12 text-center">
        <div className="flex justify-center">
          <Logo size="large" />
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">GreenWalks</h1>
        <p className="text-slate-500">Your steps save the planet.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100 mb-4">
            {error}
          </div>
        )}
        {!isLogin && (
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Full Name"
              required
              className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-eco-500 transition-all font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-eco-500 transition-all font-medium"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-eco-500 transition-all font-medium"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-eco-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-eco-700 active:scale-[0.98] transition-all shadow-xl shadow-eco-100 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-slate-500 font-medium"
        >
          {isLogin ? (
            <>Don't have an account? <span className="text-eco-600 font-bold">Sign Up</span></>
          ) : (
            <>Already have an account? <span className="text-eco-600 font-bold">Sign In</span></>
          )}
        </button>
      </div>

      <div className="mt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200 transition-colors gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserIcon className="w-5 h-5 text-slate-400" />}
            Google
          </button>
        </div>
      </div>
    </div>
  );
}
