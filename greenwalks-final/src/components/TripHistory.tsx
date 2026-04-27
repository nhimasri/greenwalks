import { Trip } from '../types';
import { formatDistance, formatCO2 } from '../lib/utils';
import { Calendar, Clock, MapPin, Footprints, Bike, Car } from 'lucide-react';
import { motion } from 'motion/react';

export default function TripHistory({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
        <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">No trips recorded yet.</p>
        <p className="text-slate-300 dark:text-slate-700 text-xs mt-1">Start tracking to see your impact!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip, idx) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          key={trip.id}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4"
        >
          <div className={`p-3 rounded-xl flex-shrink-0 ${
            trip.activity === 'WALK' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' :
            trip.activity === 'CYCLE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
            'bg-slate-50 text-slate-600 dark:bg-slate-800'
          }`}>
            {trip.activity === 'WALK' && <Footprints className="w-5 h-5" />}
            {trip.activity === 'CYCLE' && <Bike className="w-5 h-5" />}
            {trip.activity === 'VEHICLE' && <Car className="w-5 h-5" />}
            {trip.activity === 'STILL' && <MapPin className="w-5 h-5" />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-slate-900 dark:text-white truncate">
                {trip.activity === 'WALK' ? 'Walk Session' : 
                 trip.activity === 'CYCLE' ? 'Cycling Trip' : 
                 trip.activity === 'VEHICLE' ? 'Vehicle Trip' : 'Paused Activity'}
              </h4>
              <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">
                {new Date(trip.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase">
                <Clock className="w-3 h-3" />
                {Math.floor(trip.duration / 60)}m {trip.duration % 60}s
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase">
                <MapPin className="w-3 h-3" />
                {formatDistance(trip.distance)}
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-eco-600 dark:text-eco-400 font-display font-bold">+{formatCO2(trip.co2Saved)}</p>
            <p className="text-[9px] text-slate-300 dark:text-slate-700 font-bold uppercase tracking-widest">CO2 SAVED</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
