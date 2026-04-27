import { useState, useEffect, useRef } from 'react';
import { UserStats, ActivityType } from '../types';
import { SPEED_THRESHOLDS, EMISSION_FACTORS, XP_PER_GRAM_CO2 } from '../constants';
import { MapPin, Navigation, StopCircle, Play, Timer, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistance, formatCO2, calculateDistance } from '../lib/utils';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

export default function Tracker({ stats, trips, onUpdateStats }: { stats: UserStats, trips: any[], onUpdateStats: (s: Partial<UserStats>) => void }) {
  const [isTracking, setIsTracking] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [sessionCO2, setSessionCO2] = useState(0);
  const [activity, setActivity] = useState<ActivityType>('STILL');
  const [duration, setDuration] = useState(0);
  const [path, setPath] = useState<[number, number][]>([]);
  const lastCoords = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    let interval: any;
    if (isTracking) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  useEffect(() => {
    if (!isTracking) {
      lastCoords.current = null;
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: currentSpeedRaw } = pos.coords;
        const currentSpeed = currentSpeedRaw || 0; // m/s
        setSpeed(currentSpeed);
        setPath(prev => [...prev, [latitude, longitude]]);

        // Activity detection based on speed
        if (currentSpeed < SPEED_THRESHOLDS.STILL) setActivity('STILL');
        else if (currentSpeed < SPEED_THRESHOLDS.WALK) setActivity('WALK');
        else if (currentSpeed < SPEED_THRESHOLDS.CYCLE) setActivity('CYCLE');
        else setActivity('VEHICLE');

        // Distance calculation
        if (lastCoords.current) {
          const deltaDist = calculateDistance(
            lastCoords.current.lat, 
            lastCoords.current.lon, 
            latitude, 
            longitude
          );
          
          if (deltaDist > 1) { 
            setDistance(prev => prev + deltaDist);

            if (currentSpeed < SPEED_THRESHOLDS.CYCLE && currentSpeed > SPEED_THRESHOLDS.STILL) {
              const deltaCO2 = (deltaDist / 1000) * EMISSION_FACTORS.CAR_PER_KM;
              setSessionCO2(prev => prev + deltaCO2);
            }
          }
        }
        
        lastCoords.current = { lat: latitude, lon: longitude };
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTracking]);

  const stopTracking = async () => {
    setIsTracking(false);
    if (!auth.currentUser) return;
    
    const tripId = Math.random().toString(36).substr(2, 9);
    const newTrip = {
      id: tripId,
      timestamp: Date.now(),
      distance,
      co2Saved: sessionCO2,
      duration,
      activity
    };

    // Save trip to subcollection
    const tripDocRef = doc(db, 'users', auth.currentUser.uid, 'trips', tripId);
    setDoc(tripDocRef, newTrip).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${auth.currentUser?.uid}/trips/${tripId}`));

    // Update global stats
    const newTotalCO2 = stats.totalCO2Saved + sessionCO2;
    const newTotalDistance = stats.totalDistance + distance;
    const xpGain = sessionCO2 * XP_PER_GRAM_CO2;
    const newExperience = stats.experience + xpGain;
    
    const currentLevelXP = 1000 * stats.level;
    let newLevel = stats.level;
    let finalExperience = newExperience;
    while (finalExperience >= currentLevelXP) {
      newLevel += 1;
      finalExperience -= (1000 * (newLevel - 1));
    }

    const nonVehicleTrips = [...trips, newTrip].filter(t => t.activity !== 'VEHICLE');
    const totalDistCombined = [...trips, newTrip].reduce((acc, t) => acc + t.distance, 0);
    const ecoDistCombined = nonVehicleTrips.reduce((acc, t) => acc + t.distance, 0);
    const newEcoScore = totalDistCombined > 0 ? Math.round((ecoDistCombined / totalDistCombined) * 100) : 50;
    const creditsGain = Math.floor(sessionCO2 / 100);

    onUpdateStats({
      totalDistance: newTotalDistance,
      totalCO2Saved: newTotalCO2,
      experience: finalExperience,
      level: newLevel,
      ecoScore: newEcoScore,
      ecoCredits: stats.ecoCredits + creditsGain,
      lastActive: Date.now(),
    });

    setDistance(0);
    setSessionCO2(0);
    setDuration(0);
    setPath([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
        {isTracking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className="absolute inset-0 bg-eco-500 animate-pulse pointer-events-none" 
          />
        )}
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-500 mb-6">
            <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-red-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
            {isTracking ? 'LISTENING TO SENSORS' : 'IDLE'}
          </div>

          <div className="mb-6">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Current Activity</p>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
              {activity === 'STILL' && 'Resting 🧘'}
              {activity === 'WALK' && 'Walking 🚶'}
              {activity === 'CYCLE' && 'Cycling 🚴'}
              {activity === 'VEHICLE' && 'Driving 🚗'}
            </h2>
          </div>

          {/* Map Section */}
          <div className="h-64 mb-6 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 relative z-0">
            {path.length > 0 ? (
              <MapContainer 
                center={path[path.length - 1]} 
                zoom={16} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <RecenterMap position={path[path.length - 1]} />
                <Polyline positions={path} color="#22c55e" weight={5} opacity={0.6} />
                <CircleMarker center={path[path.length - 1]} radius={8} color="#fff" fillColor="#22c55e" fillOpacity={1} weight={3} />
              </MapContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                <MapPin className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Location</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Speed</p>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{(speed * 3.6).toFixed(1)} <span className="text-sm font-normal text-slate-400">km/h</span></p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">CO2 Saved</p>
              <p className="text-2xl font-display font-bold text-eco-600 dark:text-eco-400">{formatCO2(sessionCO2)}</p>
            </div>
          </div>

          <button
            onClick={() => isTracking ? stopTracking() : setIsTracking(true)}
            className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 ${
              isTracking 
                ? 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white shadow-xl shadow-slate-200 dark:shadow-none' 
                : 'bg-eco-600 text-white shadow-xl shadow-eco-200 dark:shadow-none'
            }`}
          >
            {isTracking ? (
              <>
                <StopCircle className="w-6 h-6" />
                Finish Trip
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-white" />
                Start Earth Saver
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isTracking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-eco-50 dark:bg-eco-900/10 p-6 rounded-3xl border border-eco-100 dark:border-eco-900/30 flex items-center gap-4">
              <Timer className="w-6 h-6 text-eco-600 dark:text-eco-400" />
              <div>
                <p className="text-eco-700/60 dark:text-eco-400/60 text-[10px] font-bold uppercase">Timer</p>
                <p className="text-lg font-display font-bold text-eco-900 dark:text-eco-100">
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
            <div className="bg-eco-50 dark:bg-eco-900/10 p-6 rounded-3xl border border-eco-100 dark:border-eco-900/30 flex items-center gap-4">
              <Navigation className="w-6 h-6 text-eco-600 dark:text-eco-400" />
              <div>
                <p className="text-eco-700/60 dark:text-eco-400/60 text-[10px] font-bold uppercase">Traveled</p>
                <p className="text-lg font-display font-bold text-eco-900 dark:text-eco-100">{formatDistance(distance)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
