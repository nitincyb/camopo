import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Navigation, Clock, CreditCard, ChevronRight, User, Settings, LogOut, Car, Bell, ArrowUpDown, HelpCircle, ShieldAlert, Users, Phone, Home, Star, History, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import Map from '../shared/Map';
import Logo from '../shared/Logo';
import { NotificationsPanel } from '../shared/NotificationsPanel';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import { auth, db } from '../../firebase';
import { doc, updateDoc, collection, addDoc, onSnapshot, query, where, serverTimestamp, getDoc as getDocFromFirestore } from 'firebase/firestore';
import { useGeolocation } from '../../hooks/useGeolocation';
import { mapService } from '../../services/mapService';
import { sendPushNotification } from '../../services/notificationService';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { format, addHours, isAfter, isBefore, addDays } from 'date-fns';

const translations = {
  en: {
    rru_name: 'Rashtriya Raksha University',
    rru_address: 'Lavad, Dahegam, Gandhinagar, Gujarat 382305',
    gate1_name: 'RRU(Gate-1)',
    gate1_address: 'Main Entrance, RRU Campus',
    gate2_name: 'RRU(Gate-2)',
    gate2_address: 'Secondary Entrance, RRU Campus',
    dahegam_name: 'Dahegam Bus Stand',
    dahegam_address: 'Dahegam, Gandhinagar, Gujarat',
    search_pickup: 'Search for pickup...',
    search_destination: 'Search for destination...',
    searching_ride: 'Searching for your ride...',
    finding_driver: 'Finding the best driver for you',
    ride_active: 'Ride Active',
    otp: 'OTP',
    cancel: 'CANCEL',
    sos: 'SOS',
    trip_directions: 'Trip Directions',
    emergency_sos: 'Emergency SOS',
    sos_description: 'This will immediately alert the campus security team with your live location and ride details. Use only in emergencies.',
    trigger_sos: 'TRIGGER SOS NOW',
    got_it: 'GOT IT',
    no_locations: 'No locations found in Gujarat',
    type_to_search: 'Type to search locations',
    quick_selection: 'Quick Selection',
    current_location: 'Current Location',
    pickup_label: 'PICKUP',
    destination_label: 'DESTINATION',
    confirm_ride: 'CONFIRM RIDE',
    searching: 'SEARCHING',
    ride_details: 'RIDE DETAILS',
    driver_arriving: 'Driver is arriving',
    driver_arrived: 'Driver has arrived',
    ride_started: 'Ride in progress',
    ride_completed: 'Ride completed',
    ride_cancelled: 'Ride cancelled',
    where_to: 'Where to?',
    welcome_back: 'Welcome back,',
    request_ride: 'REQUEST RIDE',
    choose_ride: 'Choose Ride',
    finding_ride: 'Finding your ride...',
    cancel_request: 'CANCEL REQUEST',
    driver_coming: 'Driver is coming',
    en_route: 'En route to destination',
    history: 'History',
    support: 'Support',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Logout',
    your_trips: 'Your Trips',
    wallet: 'Wallet',
    sign_out: 'Sign Out',
    locating: 'Locating...',
    rider_profile: 'Rider Profile',
    auto_ricksaw: 'Auto Ricksaw',
    economy_cab: 'Economy Cab (4 seater)',
    premium_cab: 'Premium Cab (6 seater)',
    no_directions: 'No detailed directions',
    schedule_ride: 'Schedule Ride',
    select_time: 'Select Pickup Time',
    schedule_confirm: 'Schedule for',
    invalid_time: 'Please select a future time (up to 24h)',
    ride_scheduled: 'Ride Scheduled Successfully',
    view_scheduled: 'View Scheduled Rides',
    scheduled_info: 'Your ride has been successfully scheduled.',
    scheduled_for: 'Scheduled for',
    share_ride: 'Share Ride',
    available_seats: 'Available Seats',
    ride_sharing: 'Ride Sharing',
    join_ride: 'Join Ride',
    no_shared_rides: 'No shared rides available',
    joined_riders: 'Joined Riders',
    waiting_for_others: 'Waiting for others to join...'
  },
  hi: {
    rru_name: 'राष्ट्रीय रक्षा विश्वविद्यालय',
    rru_address: 'लवाड, दहेगाम, गांधीनगर, गुजरात 382305',
    gate1_name: 'आरआरयू (गेट-1)',
    gate1_address: 'मुख्य प्रवेश द्वार, आरआरयू कैंपस',
    gate2_name: 'आरआरयू (गेट-2)',
    gate2_address: 'द्वितीयक प्रवेश द्वार, आरआरयू कैंपस',
    dahegam_name: 'दहेगाम बस स्टैंड',
    dahegam_address: 'दहेगाम, गांधीनगर, गुजरात',
    search_pickup: 'पिकअप खोजें...',
    search_destination: 'गंतव्य खोजें...',
    searching_ride: 'आपकी सवारी की तलाश है...',
    finding_driver: 'आपके लिए सबसे अच्छा ड्राइवर ढूंढ रहे हैं',
    ride_active: 'सवारी सक्रिय है',
    joined_riders: 'शामिल हुए यात्री',
    waiting_for_others: 'दूसरों के शामिल होने की प्रतीक्षा कर रहे हैं...',
    otp: 'ओटीपी',
    cancel: 'रद्द करें',
    sos: 'एसओएस',
    trip_directions: 'यात्रा के निर्देश',
    emergency_sos: 'आपातकालीन एसओएस',
    sos_description: 'यह तुरंत आपके लाइव स्थान और सवारी विवरण के साथ परिसर सुरक्षा टीम को सचेत करेगा। केवल आपात स्थिति में उपयोग करें।',
    trigger_sos: 'अभी एसओएस ट्रिगर करें',
    got_it: 'समझ गया',
    no_locations: 'गुजरात में कोई स्थान नहीं मिला',
    type_to_search: 'स्थान खोजने के लिए टाइप करें',
    quick_selection: 'त्वरित चयन',
    current_location: 'वर्तमान स्थान',
    pickup_label: 'पिकअप',
    destination_label: 'गंतव्य',
    confirm_ride: 'सवारी की पुष्टि करें',
    searching: 'खोज रहे हैं',
    ride_details: 'सवारी विवरण',
    driver_arriving: 'ड्राइवर आ रहा है',
    driver_arrived: 'ड्राइवर पहुंच गया है',
    ride_started: 'सवारी प्रगति पर है',
    ride_completed: 'सवारी पूरी हुई',
    ride_cancelled: 'सवारी रद्द कर दी गई',
    where_to: 'कहाँ जाना है?',
    welcome_back: 'स्वागत है,',
    request_ride: 'सवारी का अनुरोध करें',
    choose_ride: 'सवारी चुनें',
    finding_ride: 'आपकी सवारी ढूंढ रहे हैं...',
    cancel_request: 'अनुरोध रद्द करें',
    driver_coming: 'ड्राइवर आ रहा है',
    en_route: 'गंतव्य के रास्ते में',
    history: 'इतिहास',
    support: 'सहायता',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',
    your_trips: 'आपकी यात्राएं',
    wallet: 'वॉलेट',
    sign_out: 'साइन आउट',
    locating: 'ढूंढ रहे हैं...',
    rider_profile: 'राइडर प्रोफ़ाइल',
    auto_ricksaw: 'ऑटो रिक्शा',
    economy_cab: 'इकोनॉमी कैब (4 सीटर)',
    premium_cab: 'प्रीमियम कैब (6 सीटर)',
    no_directions: 'कोई विस्तृत निर्देश नहीं',
    schedule_ride: 'सवारी शेड्यूल करें',
    select_time: 'पिकअप समय चुनें',
    schedule_confirm: 'के लिए शेड्यूल करें',
    invalid_time: 'कृपया भविष्य का समय चुनें (24 घंटे तक)',
    ride_scheduled: 'सवारी सफलतापूर्वक शेड्यूल की गई',
    view_scheduled: 'शेड्यूल की गई सवारी देखें',
    scheduled_info: 'आपकी सवारी सफलतापूर्वक शेड्यूल कर दी गई है।',
    scheduled_for: 'के लिए शेड्यूल किया गया',
    share_ride: 'सवारी साझा करें',
    available_seats: 'उपलब्ध सीटें',
    ride_sharing: 'सवारी साझा करना',
    join_ride: 'सवारी में शामिल हों',
    no_shared_rides: 'कोई साझा सवारी उपलब्ध नहीं है'
  },
  gu: {
    rru_name: 'રાષ્ટ્રીય રક્ષા યુનિવર્સિટી',
    rru_address: 'લવાડ, દહેગામ, ગાંધીનગર, ગુજરાત 382305',
    gate1_name: 'આરઆરયુ (ગેટ-1)',
    gate1_address: 'મુખ્ય પ્રવેશ દ્વાર, આરઆરયુ કેમ્પસ',
    gate2_name: 'આરઆરયુ (ગેટ-2)',
    gate2_address: 'ગૌણ પ્રવેશ દ્વાર, આરઆરયુ કેમ્પસ',
    dahegam_name: 'દહેગામ બસ સ્ટેન્ડ',
    dahegam_address: 'દહેગામ, ગાંધીનગર, ગુજરાત',
    search_pickup: 'પિકઅપ શોધો...',
    search_destination: 'ગંતવ્ય શોધો...',
    searching_ride: 'તમારી સવારી શોધી રહ્યા છીએ...',
    finding_driver: 'તમારા માટે શ્રેષ્ઠ ડ્રાઈવર શોધી રહ્યા છીએ',
    ride_active: 'સવારી સક્રિય છે',
    otp: 'ઓટીપી',
    cancel: 'રદ કરો',
    sos: 'એસઓએસ',
    trip_directions: 'મુસાફરીની દિશાઓ',
    emergency_sos: 'ઇમરજન્સી એસઓએસ',
    sos_description: 'આ તરત જ તમારા લાઇવ લોકેશન અને રાઇડ વિગતો સાથે કેમ્પસ સિક્યુરિટી ટીમને એલર્ટ કરશે. માત્ર કટોકટીમાં જ ઉપયોગ કરો.',
    trigger_sos: 'હમણાં એસઓએસ ટ્રિગર કરો',
    got_it: 'સમજાઈ ગયું',
    no_locations: 'ગુજરાતમાં કોઈ સ્થાનો મળ્યા નથી',
    type_to_search: 'સ્થાનો શોધવા માટે ટાઇપ કરો',
    quick_selection: 'ઝડપી પસંદગી',
    current_location: 'વર્તમાન સ્થાન',
    pickup_label: 'પિકઅપ',
    destination_label: 'ગંતવ્ય',
    confirm_ride: 'રાઇડ કન્ફર્મ કરો',
    searching: 'શોધી રહ્યા છીએ',
    ride_details: 'રાઇડ વિગતો',
    driver_arriving: 'ડ્રાઈવર આવી રહ્યો છે',
    driver_arrived: 'ડ્રાઈવર આવી ગયો છે',
    ride_started: 'સવારી ચાલુ છે',
    ride_completed: 'સવારી પૂર્ણ થઈ',
    ride_cancelled: 'સવારી રદ કરવામાં આવી',
    where_to: 'ક્યાં જવું છે?',
    welcome_back: 'સ્વાગત છે,',
    request_ride: 'રાઇડની વિનંતી કરો',
    choose_ride: 'રાઇડ પસંદ કરો',
    finding_ride: 'તમારી રાઇડ શોધી રહ્યા છીએ...',
    cancel_request: 'વિનંતી રદ કરો',
    driver_coming: 'ડ્રાઈવર આવી રહ્યો છે',
    en_route: 'ગંતવ્યના માર્ગ પર',
    history: 'ઇતિહાસ',
    support: 'સપોર્ટ',
    profile: 'પ્રોફાઇલ',
    settings: 'સેટિંગ્સ',
    logout: 'લોગઆઉટ',
    your_trips: 'તમારી ટ્રિપ્સ',
    wallet: 'વોલેટ',
    sign_out: 'સાઇન આઉટ',
    locating: 'શોધી રહ્યા છીએ...',
    rider_profile: 'રાઇડર પ્રોફાઇલ',
    auto_ricksaw: 'ઓટો રિક્ષા',
    economy_cab: 'ઇકોનોમી કેબ (4 સીટર)',
    premium_cab: 'પ્રીમિયમ કેબ (6 સીટર)',
    no_directions: 'કોઈ વિગતવાર દિશાઓ નથી',
    schedule_ride: 'સવારી શેડ્યૂલ કરો',
    select_time: 'પિકઅપ સમય પસંદ કરો',
    schedule_confirm: 'માટે શેડ્યૂલ કરો',
    invalid_time: 'કૃપા કરીને ભવિષ્યનો સમય પસંદ કરો (24 કલાક સુધી)',
    ride_scheduled: 'સવારી સફળતાપૂર્વક શેડ્યૂલ કરવામાં આવી',
    view_scheduled: 'શેડ્યૂલ કરેલી સવારી જુઓ',
    scheduled_info: 'તમારી સવારી સફળતાપૂર્વક શેડ્યૂલ કરવામાં આવી છે.',
    scheduled_for: 'માટે શેડ્યૂલ કરેલ',
    share_ride: 'સવારી શેર કરો',
    available_seats: 'ઉપલબ્ધ બેઠકો',
    ride_sharing: 'રાઇડ શેરિંગ',
    join_ride: 'સવારીમાં જોડાઓ',
    no_shared_rides: 'કોઈ શેર કરેલી સવારી ઉપલબ્ધ નથી',
    joined_riders: 'જોડાયેલા સવારો',
    waiting_for_others: 'અન્ય લોકો જોડાવાની રાહ જોઈ રહ્યા છે...'
  }
};

const RIDE_TYPES = [
  { id: 'Auto', nameKey: 'auto_ricksaw', price: 40, time: '2 min', iconId: 'auto' },
  { id: 'Economy', nameKey: 'economy_cab', price: 80, time: '3 min', iconId: 'economy' },
  { id: 'Premium', nameKey: 'premium_cab', price: 150, time: '5 min', iconId: 'premium' },
];

const getRideIcon = (iconId: string) => {
  switch (iconId) {
    case 'auto': return <img src="https://img.icons8.com/fluency/256/auto-rickshaw.png" alt="Auto" className="w-[54px] h-[54px] object-contain drop-shadow-md" />;
    case 'economy': return <img src="https://img.icons8.com/fluency/256/car.png" alt="Car" className="w-[54px] h-[54px] object-contain drop-shadow-md" />;
    case 'premium': return <img src="https://img.icons8.com/fluency/256/suv.png" alt="Premium SUV" className="w-[54px] h-[54px] object-contain drop-shadow-md" />;
    default: return <img src="https://img.icons8.com/fluency/256/car.png" alt="Car" className="w-[54px] h-[54px] object-contain drop-shadow-md" />;
  }
};

const LOCATIONS = {
  RRU: { nameKey: 'rru_name', lat: 23.15457840755294, lng: 72.88497367116464, addressKey: 'rru_address' },
  GATE1: { nameKey: 'gate1_name', lat: 23.156126049358633, lng: 72.88457494201678, addressKey: 'gate1_address' },
  GATE2: { nameKey: 'gate2_name', lat: 23.15204555996699, lng: 72.88004845953762, addressKey: 'gate2_address' },
  DAHEGAM: { nameKey: 'dahegam_name', lat: 23.1691, lng: 72.8124, addressKey: 'dahegam_address' }
};

// --- CinematicScramble: Smooth scramble + depth animation ---
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function CinematicScramble({ text, className = '' }: { text: string; className?: string }) {
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState<'scramble' | 'done'>('scramble');
  const frameRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (!text) return;

    const totalDuration = 1200;
    const resolveStart = 300;

    // Generate a stable random seed per character
    const seed = text.split('').map(() => Math.floor(Math.random() * SCRAMBLE_CHARS.length));

    startRef.current = performance.now();
    setPhase('scramble');

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / totalDuration, 1);

      if (progress >= 1) {
        setDisplay(text);
        setPhase('done');
        return;
      }

      let result = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          result += ' ';
          continue;
        }

        // Each character has a resolve threshold based on its position
        const charThreshold = resolveStart / totalDuration + (i / text.length) * 0.5;

        if (progress > charThreshold) {
          result += text[i];
        } else {
          // Cycle through chars deterministically using time, not pure random
          const cycleSpeed = 4;
          const idx = (seed[i] + Math.floor(elapsed / (50 + i * 8)) * cycleSpeed) % SCRAMBLE_CHARS.length;
          result += SCRAMBLE_CHARS[idx];
        }
      }

      setDisplay(result);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [text]);

  return (
    <motion.p
      className={className}
      initial={{ opacity: 0, scale: 1.03, filter: 'blur(6px)' }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
      }}
      transition={{
        duration: 1.0,
        ease: [0.22, 1, 0.36, 1],
        opacity: { duration: 0.5 },
        filter: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
    >
      {display}
    </motion.p>
  );
}

// --- SlideToBook: Gesture-based slider (green accent) ---
function SlideToBook({ onComplete, label = 'Slide to request ride' }: { onComplete: () => void; label?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const threshold = 0.75;

  const handleDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !trackRef.current || completed) return;
    const track = trackRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - track.left - 28, track.width - 56));
    setDragX(x);

    if (x / (track.width - 56) >= threshold) {
      setCompleted(true);
      setIsDragging(false);
      setDragX(track.width - 56);
      setTimeout(onComplete, 200);
    }
  }, [isDragging, completed, onComplete]);

  const handleEnd = useCallback(() => {
    if (!completed) {
      setDragX(0);
    }
    setIsDragging(false);
  }, [completed]);

  const progress = trackRef.current ? dragX / (trackRef.current.getBoundingClientRect().width - 56) : 0;

  return (
    <div
      ref={trackRef}
      className="relative h-[56px] bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden select-none touch-none"
      onMouseMove={handleDrag}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={handleDrag}
      onTouchEnd={handleEnd}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-none"
        style={{ width: dragX + 56, backgroundColor: `rgba(16, 185, 129, ${0.1 + progress * 0.15})` }}
      />
      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="text-sm font-medium text-zinc-500 transition-opacity"
          style={{ opacity: Math.max(0, 1 - progress * 2.5) }}
        >
          {label}
        </span>
      </div>
      {/* Thumb */}
      <div
        className="absolute top-1 bottom-1 left-1 w-12 rounded-full bg-emerald-500 flex items-center justify-center cursor-grab active:cursor-grabbing transition-none"
        style={{ transform: `translateX(${dragX}px)` }}
        onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); setCompleted(false); }}
        onTouchStart={() => { setIsDragging(true); setCompleted(false); }}
      >
        <ChevronRight size={20} className="text-black" />
      </div>
    </div>
  );
}

export default function RiderHome() {
  const { profile, user } = useAuth();
  const { initiateCall } = useCall();
  const lang = (profile?.language as 'en' | 'hi' | 'gu') || 'en';
  const t = translations[lang];

  const navigate = useNavigate();
  const locationRouter = useLocation();

  useEffect(() => {
    if (locationRouter.state?.destination) {
      setDestination(locationRouter.state.destination);
      if (locationRouter.state?.intent === 'select_ride') {
        setStep('selecting');
      }
      navigate('.', { replace: true, state: {} });
    }
  }, [locationRouter.state, navigate]);

  // Safety redirect if role changed to driver
  useEffect(() => {
    if (profile?.role === 'driver') {
      navigate('/', { replace: true });
    }
  }, [profile?.role, navigate]);

  const { location, path, loading: locationLoading } = useGeolocation();
  const [step, setStep] = useState<'home' | 'searching' | 'selecting' | 'ride' | 'scheduled_success'>('home');
  const [pickup, setPickup] = useState(t[LOCATIONS.RRU.nameKey]);
  const [destination, setDestination] = useState(t[LOCATIONS.DAHEGAM.nameKey]);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number, lng: number }>({ lat: LOCATIONS.RRU.lat, lng: LOCATIONS.RRU.lng });
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number, lng: number }>({ lat: LOCATIONS.DAHEGAM.lat, lng: LOCATIONS.DAHEGAM.lng });
  const [selectedRide, setSelectedRide] = useState(RIDE_TYPES[0]);
  const [showBooking, setShowBooking] = useState(false);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [driverPath, setDriverPath] = useState<Array<{ lat: number, lng: number }>>([]);
  const [predefinedPath, setPredefinedPath] = useState<Array<{ lat: number, lng: number }>>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchingFor, setSearchingFor] = useState<'pickup' | 'destination' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [distanceInfo, setDistanceInfo] = useState<{ distance: string, duration: string } | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [availableSeats, setAvailableSeats] = useState(1);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [onlineDrivers, setOnlineDrivers] = useState<any[]>([]);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isSOSLoading, setIsSOSLoading] = useState(false);
  const [joinedRiderProfiles, setJoinedRiderProfiles] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [completedRideInfo, setCompletedRideInfo] = useState<any>(null);

  // Listen for unread notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch joined rider profiles for shared rides
  useEffect(() => {
    if (!activeRide?.joinedRiders || activeRide.joinedRiders.length === 0) {
      setJoinedRiderProfiles([]);
      return;
    }

    const fetchProfiles = async () => {
      try {
        const profiles = await Promise.all(
          activeRide.joinedRiders.map(async (uid: string) => {
            const userSnap = await getDocFromFirestore(doc(db, 'users', uid));
            if (userSnap.exists()) {
              return { id: uid, ...userSnap.data() };
            }
            return { id: uid, displayName: 'Unknown Rider' };
          })
        );
        setJoinedRiderProfiles(profiles);
      } catch (error) {
        console.error("Error fetching joined rider profiles:", error);
      }
    };

    fetchProfiles();
  }, [activeRide?.joinedRiders]);

  const handleTriggerSOS = async () => {
    if (!profile || !activeRide) return;
    setIsSOSLoading(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: profile.uid,
        userEmail: profile.email,
        type: 'sos',
        priority: 'critical',
        subject: 'EMERGENCY SOS TRIGGERED',
        description: `Rider triggered SOS during active ride. Ride ID: ${currentRideId}. Driver ID: ${activeRide.driverId || 'N/A'}. Location: Lat ${location?.lat || pickupCoords.lat}, Lng ${location?.lng || pickupCoords.lng}`,
        status: 'open',
        rideId: currentRideId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        location: location || pickupCoords
      });
      // Also send a push notification to admin topic if configured
      await sendPushNotification('admin_sos', 'EMERGENCY SOS', `SOS Triggered by ${profile.displayName || 'Rider'}!`);
      
      // Trigger Twilio Call
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/sos-call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            userId: profile.uid,
            userName: profile.displayName,
            location: location || pickupCoords,
            rideId: currentRideId
          }),
        });
        
        if (!response.ok) {
           const errorText = await response.text();
           console.error("Failed to trigger Twilio call:", errorText);
           alert(`SOS Alert sent, but automated phone call failed: ${errorText}`);
        } else {
           console.log("Twilio SOS call triggered successfully.");
           alert('SOS Alert and automated phone call sent to administrators immediately.');
        }
      } catch (callError) {
        console.error("Error calling SOS endpoint:", callError);
        alert('SOS Alert sent, but automated phone call failed.');
      }

      setIsSOSModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'support_tickets');
      alert('Failed to send SOS. Please call emergency services directly.');
    } finally {
      setIsSOSLoading(false);
    }
  };

  // Handle search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const results = await mapService.autosuggest(searchQuery);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (suggestion: any) => {
    if (!suggestion || !suggestion.center || suggestion.center.length < 2) {
      console.warn("Invalid suggestion selected:", suggestion);
      return;
    }
    const coords = { lat: suggestion.center[1], lng: suggestion.center[0] };
    if (searchingFor === 'pickup') {
      setPickup(suggestion.placeName);
      setPickupCoords(coords);
    } else {
      setDestination(suggestion.placeName);
      setDestinationCoords(coords);
    }
    setSearchingFor(null);
    setSearchQuery('');
    setSuggestions([]);
  };

  // Update pickup when location is first available
  useEffect(() => {
    const resolveCurrentLocation = async () => {
      if (location) {
        // Try to get actual address for the driver
        try {
          if (location?.lat && location?.lng) {
            const address = await mapService.reverseGeocode(location.lat, location.lng);
            if (address && address !== 'Unknown Location') {
              setCurrentAddress(address);
            }
          }
        } catch (err) {
          console.warn("Could not reverse geocode current location", err);
        }
      }
    };
    
    resolveCurrentLocation();
  }, [location]);

  const defaultCenter = LOCATIONS.RRU;
  const mapCenter = location || defaultCenter;

  // Plan route automatically when pickup or destination changes
  useEffect(() => {
    const planRoute = async () => {
      try {
        const routeData = await mapService.getRoute(pickupCoords, destinationCoords);
        if (routeData) {
          setPredefinedPath(routeData.coordinates);
          setRouteSteps(routeData.steps || []);
          setDistanceInfo({
            distance: (routeData.distance / 1000).toFixed(1) + ' km',
            duration: Math.round(routeData.duration / 60) + ' min'
          });
        }
      } catch (error) {
        console.error("Error planning route:", error);
      }
    };

    planRoute();
  }, [pickupCoords, destinationCoords]);

  // Listen for online drivers (only when needed to save quota)
  useEffect(() => {
    if (step !== 'home' && step !== 'selecting') return;

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'driver'),
      where('isOnline', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const drivers = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filter out stale drivers (not active in last 1 hour)
        .filter((d: any) => {
          if (!d.lastActive) return true; // If no lastActive, assume online since isOnline is true
          const lastActive = d.lastActive.toDate ? d.lastActive.toDate() : new Date(d.lastActive);
          // 1 hour = 3600000 ms
          return Math.abs(new Date().getTime() - lastActive.getTime()) < 3600000;
        });
      
      console.log('Online drivers updated:', drivers.length);
      setOnlineDrivers(drivers);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    return () => unsubscribe();
  }, [step]);

  const swapLocations = () => {
    const oldPickup = pickup;
    const oldPickupCoords = pickupCoords;
    setPickup(destination);
    setPickupCoords(destinationCoords);
    setDestination(oldPickup);
    setDestinationCoords(oldPickupCoords);
  };

  // Recover active ride on mount
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'rides'),
      where('riderId', '==', user.uid),
      where('status', 'in', ['searching', 'accepted', 'arrived', 'in_progress'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const ride = { id: doc.id, ...doc.data() } as any;
        setCurrentRideId(ride.id);
        setActiveRide(ride);
        if (ride.status === 'searching') {
          setStep('searching');
        } else {
          setStep('ride');
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'rides');
    });

    return () => unsubscribe();
  }, [user]);

  const handleRequest = async () => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }
    if (!location) {
      if (locationLoading) {
        alert("Still determining your location. Please wait a moment.");
      } else {
        console.error("Location not available even after fallback");
        alert("Location services are unavailable. Please check your browser settings.");
      }
      return;
    }
    
    console.log("Requesting ride...", { pickup, destination, selectedRide });
    
    // Validate scheduled time if applicable
    if (isScheduling && scheduledDate) {
      const now = new Date();
      const maxTime = addDays(now, 1);
      if (isBefore(scheduledDate, now) || isAfter(scheduledDate, maxTime)) {
        alert(t.invalid_time);
        return;
      }
    }

    setStep('searching');
    
    try {
      const rideData = {
        riderId: user.uid,
        riderName: profile?.displayName || 'Rider',
        rideOTP: profile?.rideOTP,
        status: isScheduling ? 'scheduled' : 'searching',
        pickup: {
          address: pickup === 'Current Location' && currentAddress ? currentAddress : pickup,
          lat: pickupCoords.lat,
          lng: pickupCoords.lng
        },
        dropoff: {
          address: destination,
          lat: destinationCoords.lat,
          lng: destinationCoords.lng
        },
        fare: selectedRide.price,
        rideType: selectedRide.id,
        distance: distanceInfo?.distance || '5.2 km',
        duration: distanceInfo?.duration || '15 min',
        createdAt: serverTimestamp(),
        scheduledAt: isScheduling && scheduledDate ? scheduledDate.toISOString() : null,
        isShared: isShared,
        availableSeats: isShared ? availableSeats : 0,
        joinedRiders: isShared ? [] : null,
        paymentStatus: 'pending',
        paymentMethod: 'wallet',
        candidateDrivers: onlineDrivers.length > 0 ? onlineDrivers.map(d => d.id) : null // Broadcast to all online drivers if empty
      };

      const docRef = await addDoc(collection(db, 'rides'), rideData);
      
      if (isScheduling) {
        setStep('scheduled_success');
      } else {
        setCurrentRideId(docRef.id);
        console.log("Ride request created with ID:", docRef.id);

        // Notify candidate drivers
        const driversToNotify = (rideData.candidateDrivers && rideData.candidateDrivers.length > 0) 
          ? rideData.candidateDrivers 
          : onlineDrivers.map(d => d.id);

        if (driversToNotify.length > 0) {
          console.log(`Notifying ${driversToNotify.length} drivers...`);
          driversToNotify.forEach(driverId => {
            sendPushNotification(
              driverId,
              'New Ride Request',
              `New ${t[selectedRide.nameKey]} request from ${profile?.displayName || 'Rider'}`,
              { rideId: docRef.id }
            ).catch(err => console.error(`Error notifying driver ${driverId}:`, err));
          });
        } else {
          console.log("No online drivers to notify.");
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'rides');
      setStep('selecting');
    }
  };

  const handleCancelRide = async () => {
    if (!currentRideId) return;
    try {
      // If there's an active driver, notify them and reset their status
      if (activeRide?.driverId) {
        await sendPushNotification(
          activeRide.driverId,
          'Ride Cancelled',
          'The rider has cancelled the ride.'
        );
        // Reset driver status to online
        await updateDoc(doc(db, 'drivers', activeRide.driverId), {
          status: 'online'
        }).catch(() => {});
      }

      await updateDoc(doc(db, 'rides', currentRideId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'rider'
      });
      setStep('home');
      setCurrentRideId(null);
      setActiveRide(null);
      setDriverLocation(null);
      setDriverPath([]);
      setPredefinedPath([]);
      setEta(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rides/${currentRideId}`);
    }
  };

  useEffect(() => {
    if (!currentRideId) return;

    const unsubscribe = onSnapshot(doc(db, 'rides', currentRideId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setActiveRide({ ...data, id: docSnap.id });
        
        if (['accepted', 'arrived', 'in_progress'].includes(data.status)) {
          setStep('ride');
        } else if (data.status === 'completed') {
          setCompletedRideInfo({ ...data, id: docSnap.id });
          setShowFeedback(true);
          setFeedbackRating(0);
          setFeedbackText('');
          setStep('home');
          setCurrentRideId(null);
          setActiveRide(null);
          setDriverLocation(null);
          setDriverPath([]);
          setPredefinedPath([]);
          setEta(null);
        } else if (data.status === 'cancelled') {
          setStep('home');
          setCurrentRideId(null);
          setActiveRide(null);
          setDriverLocation(null);
          setDriverPath([]);
          setPredefinedPath([]);
          setEta(null);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rides/${currentRideId}`);
    });

    return () => unsubscribe();
  }, [currentRideId]);

  // Separate effect for tracking driver location when ride is active
  useEffect(() => {
    if (!activeRide?.driverId || activeRide?.status !== 'accepted') {
      setDriverLocation(null);
      return;
    }

    const unsubDriver = onSnapshot(doc(db, 'users', activeRide.driverId), async (userSnap) => {
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.currentLocation?.lat && userData.currentLocation?.lng) {
          const newLoc = { lat: userData.currentLocation.lat, lng: userData.currentLocation.lng };
          setDriverLocation(newLoc);
          
          // Update ETA and driver path from Map
          if (activeRide.pickup?.lat && activeRide.pickup?.lng) {
            const pickupLoc = { lat: activeRide.pickup.lat, lng: activeRide.pickup.lng };
            
            // Get ETA
            const newEta = await mapService.getETA(newLoc, pickupLoc);
            if (newEta !== null) setEta(newEta);

            // Get path from driver to pickup
            const routeData = await mapService.getRoute(newLoc, pickupLoc);
            if (routeData && routeData.coordinates) {
              setDriverPath(routeData.coordinates);
            }
          }
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${activeRide.driverId}`);
    });

    return () => unsubDriver();
  }, [activeRide?.driverId, activeRide?.status]);

  const isRideActive = activeRide && ['accepted', 'arrived', 'in_progress'].includes(activeRide.status);
  const showMap = isRideActive || step === 'searching' || step === 'selecting' || (step === 'home' && showBooking);

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative font-sans">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        {showMap ? (
          <Map 
            center={mapCenter} 
            onMarkerClick={(m) => console.log('Marker clicked:', m)}
            markers={[
              ...(location?.lat && location?.lng ? [{ id: 'user-loc', lat: location.lat, lng: location.lng, type: 'user' as const, title: 'You' }] : []),
              ...(driverLocation?.lat && driverLocation?.lng ? [{ id: 'driver-active', lat: driverLocation.lat, lng: driverLocation.lng, type: 'driver' as const, title: activeRide?.driverName || 'Driver' }] : []),
              // Show online drivers when not on a trip or searching
              ...(!isRideActive ? onlineDrivers
                .filter(d => d.currentLocation?.lat && d.currentLocation?.lng)
                .map(d => ({
                  id: `driver-${d.id}`,
                  lat: d.currentLocation.lat,
                  lng: d.currentLocation.lng,
                  type: 'driver' as const,
                  title: d.displayName || 'Driver'
                })) : []),
              ...(predefinedPath.length > 0 && predefinedPath[0]?.lat && predefinedPath[predefinedPath.length - 1]?.lat ? [
                { id: 'pickup', lat: predefinedPath[0].lat, lng: predefinedPath[0].lng, type: 'pickup' as const, title: 'Pickup' },
                { id: 'dropoff', lat: predefinedPath[predefinedPath.length - 1].lat, lng: predefinedPath[predefinedPath.length - 1].lng, type: 'dropoff' as const, title: 'Dropoff' }
              ] : [])
            ]}
            path={driverPath.length > 0 ? driverPath : (predefinedPath.length > 0 ? predefinedPath : path)}
          />
        ) : (
          <div className="w-full h-full bg-zinc-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-zinc-950" />
          </div>
        )}
      </div>

      {/* Top Bar - only show on non-home or when booking */}
      {(step !== 'home' || showBooking) && (
        <div className="absolute top-6 left-4 right-4 z-20 flex items-center gap-3 pointer-events-none">
          <button 
            onClick={() => {
              setShowBooking(true);
            }}
            className="flex-1 bg-zinc-900 rounded-full flex items-center gap-3 px-5 py-3.5 border border-zinc-800 pointer-events-auto hover:border-zinc-700 transition-colors"
          >
            <Search size={18} className="text-zinc-500 shrink-0" />
            <span className="text-sm font-bold text-zinc-400 truncate">{t.where_to}</span>
          </button>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            {locationLoading && (
              <div className="bg-zinc-900 px-3 py-2 rounded-full flex items-center gap-2 border border-zinc-800">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-50">{t.locating}</span>
              </div>
            )}
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors border border-zinc-800 relative"
            >
              <Bell size={20} className="text-zinc-50" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-zinc-900">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Personalized Home Screen */}
      {step === 'home' && !showBooking && (
        <div className="absolute inset-0 z-10 flex flex-col">

          {/* Search Bar - Primary Entry Point */}
          <div className="px-5 pt-12 pb-2">
            <motion.button
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => navigate('/map')}
              className="w-full bg-zinc-900 rounded-2xl flex items-center gap-4 px-5 py-4 border border-zinc-800 hover:border-zinc-700 transition-colors active:scale-[0.98]"
            >
              <Search size={18} className="text-zinc-500 shrink-0" />
              <span className="text-sm font-medium text-zinc-400">Where to?</span>
              <ChevronRight size={16} className="text-zinc-600 ml-auto" />
            </motion.button>
          </div>

          {/* Greeting + Username */}
          <div className="px-5 pt-6 pb-2 flex items-start justify-between">
            <div className="flex-1">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-zinc-500 text-sm font-medium"
              >
                {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}
              </motion.p>
              <CinematicScramble
                text={`Hi, ${profile?.displayName || 'Rider'}`}
                className="text-[28px] font-semibold text-white mt-1 tracking-tight"
              />
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => setIsNotificationsOpen(true)}
              className="w-11 h-11 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 relative mt-2"
            >
              <Bell size={18} className="text-zinc-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          </div>

          {/* Services Section */}
          <div className="px-5 mt-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.35 }}
              className="flex items-baseline justify-between mb-4 px-1"
            >
              <p className="text-sm font-medium text-zinc-300">Choose your ride</p>
              <p className="text-[11px] text-zinc-600">Available near you</p>
            </motion.div>
            <div className="flex items-center gap-3">
              {RIDE_TYPES.map((type, index) => (
                <motion.button
                  key={type.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                  onClick={() => {
                    setSelectedRide(type);
                    navigate('/map');
                  }}
                  className="relative z-10 flex-1 flex flex-col items-center justify-center gap-3.5 py-7 bg-[#181a20] rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:scale-[1.05] hover:-translate-y-[4px] hover:transition-all duration-300 ease-in-out cursor-pointer group overflow-hidden pointer-events-auto"
                >
                  {/* Faint ambient glow on hover */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none" />
                  
                  {/* Subtle soft cinematic light sweep */}
                  <div className="absolute top-0 left-[-100%] h-full w-[150%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-[800ms] ease-in-out pointer-events-none" />
                  
                  {/* Clean Icon */}
                  <div className="relative z-10 text-emerald-500 group-hover:brightness-110 transition-all duration-300">
                    {getRideIcon(type.iconId, 34)}
                  </div>
                  
                  {/* Clean Text */}
                  <span className="relative z-10 text-xs font-medium tracking-wide text-zinc-500 group-hover:text-zinc-200 transition-colors duration-300">
                    {type.id}
                  </span>
                </motion.button>
              ))}
              
              <motion.button
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + RIDE_TYPES.length * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                onClick={() => navigate('/ride-sharing')}
                className="relative z-10 flex-1 flex flex-col items-center justify-center gap-3.5 py-7 bg-[#181a20] rounded-2xl border border-white/[0.06] hover:border-white/[0.12] hover:scale-[1.05] hover:-translate-y-[4px] hover:transition-all duration-300 ease-in-out cursor-pointer group overflow-hidden pointer-events-auto"
              >
                {/* Faint ambient glow on hover */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none" />
                
                {/* Subtle soft cinematic light sweep */}
                <div className="absolute top-0 left-[-100%] h-full w-[150%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-[800ms] ease-in-out pointer-events-none" />
                
                {/* Clean Icon */}
                <div className="relative z-10 text-emerald-500 group-hover:brightness-110 transition-all duration-300">
                  <Users size={34} />
                </div>
                
                {/* Clean Text */}
                <span className="relative z-10 text-xs font-medium tracking-wide text-zinc-500 group-hover:text-zinc-200 transition-colors duration-300">
                  Share
                </span>
              </motion.button>
            </div>
          </div>


        </div>
      )}

      {/* Main UI Overlay */}
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
        <div className="max-w-xl mx-auto p-4 sm:p-6 pb-safe pointer-events-auto">

          <AnimatePresence mode="wait">
            {step === 'home' && showBooking && (
              <motion.div 
                key="home"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="relative p-6 pt-8 pb-12 space-y-6 sm:-mx-6 -mb-4 sm:-mb-6 overflow-hidden rounded-t-[32px] isolate"
              >
                {/* Inner glass layer */}
                <div className="absolute inset-[1px] bg-[rgba(20,20,20,0.6)] backdrop-blur-[16px] z-[-1] pointer-events-none rounded-t-[31px] border border-white/5" />
                
                {/* Drag handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-white/20 rounded-full" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] text-[#22c55e] font-black uppercase tracking-[0.2em]">{t.welcome_back}</p>
                    <h2 className="text-2xl font-black tracking-tight font-display text-white">
                      <span className="block">Hi,</span>
                      <span className="inline-block origin-left text-[115%] transition-all duration-300 ease-in-out">
                        {profile?.displayName || 'Rider'}
                      </span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => setShowBooking(false)}
                    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="rotate-90" size={20} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black tracking-tight font-display uppercase tracking-widest text-zinc-400">{t.where_to}</h2>
                  <button 
                    onClick={swapLocations}
                    className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <ArrowUpDown size={18} className="text-[#22c55e]" />
                  </button>
                </div>
                
                <div className="space-y-3 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-zinc-800" />
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#22c55e] rounded-full " />
                    <button 
                      onClick={() => {
                        setSearchingFor('pickup');
                        setSearchQuery(pickup);
                      }}
                      className="w-full bg-[rgba(255,255,255,0.03)] backdrop-blur-md rounded-2xl py-4 pl-10 pr-4 font-bold text-zinc-300 text-sm border border-white/5 hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300 text-left"
                    >
                      {pickup}
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full " />
                    <button 
                      onClick={() => {
                        setSearchingFor('destination');
                        setSearchQuery(destination);
                      }}
                      className="w-full bg-[rgba(255,255,255,0.03)] backdrop-blur-md rounded-2xl py-4 pl-10 pr-4 font-bold text-white text-sm border border-white/5 hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300 text-left"
                    >
                      {destination}
                    </button>
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-3 -mx-6 px-6 pb-2 hide-scrollbar snap-x">
                  {[LOCATIONS.GATE1, LOCATIONS.GATE2, LOCATIONS.DAHEGAM].map((loc) => (
                    <button
                      key={loc.nameKey}
                      onClick={() => {
                        setDestination(t[loc.nameKey]);
                        setDestinationCoords({ lat: loc.lat, lng: loc.lng });
                      }}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-colors snap-start"
                    >
                      <MapPin size={14} className="text-[#22c55e] shrink-0 " />
                      <span className="text-xs font-bold text-zinc-300 whitespace-nowrap">{t[loc.nameKey]}</span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setStep('selecting')}
                  className="w-full bg-[#22c55e] text-black py-4 rounded-xl font-bold text-sm hover:scale-[1.02] hover:bg-[#16a34a] active:scale-[0.98] transition-all relative overflow-hidden group mt-2 flex items-center justify-center gap-2"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10">Confirm Destination</span>
                  <ChevronRight size={18} className="relative z-10" />
                </button>
              </motion.div>
            )}

            {step === 'selecting' && (
              <motion.div 
                key="selecting"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="relative overflow-hidden w-full sm:-mx-6 -mx-4 -mb-4 sm:-mb-6 mt-4 isolate"
                style={{
                  borderRadius: '32px 32px 0 0',
                  paddingTop: '3px',
                  paddingLeft: '3px',
                  paddingRight: '3px',
                  boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)',
                  transform: 'translateZ(0)'
                }}
              >
                {/* Cinematic animated edge light */}
                <div 
                  className="absolute inset-[-100%] z-[0] pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 35%, rgba(34, 197, 94, 0.4) 40%, rgba(34, 197, 94, 0.9) 50%, rgba(34, 197, 94, 0.4) 60%, transparent 65%, transparent 100%)',
                    willChange: 'transform',
                    animation: 'cinematic-spin 5s linear infinite'
                  }}
                />

                {/* Solid inner core */}
                <div 
                  className="relative z-10 w-full h-full pb-6"
                  style={{
                    backgroundColor: '#0B0E0C',
                    borderRadius: '32px 32px 0 0',
                  }}
                >
                  {/* Inner highlight */}
                  <div className="absolute inset-0 rounded-t-[32px] pointer-events-none z-0" style={{ background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, transparent 30%)' }} />
                  
                  <div className="p-5 sm:p-6 relative z-10 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setStep('home')} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                      <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <h2 className="font-bold text-sm text-zinc-300 uppercase tracking-widest">{t.choose_ride}</h2>
                    <div className="w-10" />
                  </div>

                  {/* 1. Source & 2. Destination (Connecting Wire Layout) */}
                  <div 
                    className="relative flex flex-col px-[16px] py-[14px] rounded-[18px] mb-6"
                    style={{
                      background: '#121A15',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  >
                    {/* Connecting Wire */}
                    <svg className="absolute left-[24px] top-[40px] w-[2px] h-[28px] z-0" style={{ strokeDasharray: "4 4", animation: "line-flow 1.5s linear infinite" }}>
                      <line x1="1" y1="0" x2="1" y2="28" stroke="rgba(34, 197, 94, 0.15)" strokeWidth="1" />
                    </svg>

                    {/* From */}
                    <button 
                      onClick={() => navigate('/map', { state: { pickingUp: true } })}
                      className="flex items-center gap-4 relative z-10 w-full text-left transition-opacity hover:opacity-80"
                    >
                      <div 
                        className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(34, 197, 94, 0.20)' }}
                      >
                        <div className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] tracking-[0.2em] font-dm uppercase mb-0.5" style={{ color: '#4ADE80', opacity: 0.8 }}>From</p>
                        <p className="text-[15px] font-sora font-semibold truncate" style={{ color: 'rgba(255, 255, 255, 0.92)' }}>{pickup}</p>
                      </div>
                    </button>

                    <div className="h-[20px]" />

                    {/* To */}
                    <button 
                      onClick={() => navigate('/map', { state: { pickingUp: false } })}
                      className="flex items-center gap-4 relative z-10 w-full text-left transition-opacity hover:opacity-80"
                    >
                      <div className="w-[18px] flex justify-center items-center flex-shrink-0">
                        <div 
                          className="w-[9px] h-[9px] animate-[breathe_2.5s_ease_infinite]"
                          style={{ border: '1px solid rgba(255, 255, 255, 0.35)', borderRadius: '1px' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] tracking-[0.2em] font-dm uppercase mb-0.5" style={{ color: '#4ADE80', opacity: 0.8 }}>To</p>
                        <p className="text-[15px] font-sora font-semibold truncate" style={{ color: 'rgba(255, 255, 255, 0.92)' }}>{destination}</p>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                    {RIDE_TYPES.map((type) => (
                      <button 
                        key={type.id}
                        onClick={() => setSelectedRide(type)}
                        className={`w-full flex items-center gap-3 py-3 px-4 rounded-[20px] transition-all border ${
                          selectedRide.id === type.id 
                            ? 'border-[#22C55E]/40 shadow-[0_0_20px_rgba(34,197,94,0.12)]' 
                            : 'border-transparent hover:border-white/5'
                        }`}
                        style={{
                          background: selectedRide.id === type.id ? 'rgba(34, 197, 94, 0.06)' : 'transparent',
                        }}
                      >
                        <div className="w-[64px] h-[48px] flex items-center justify-center shrink-0 -ml-1">
                          {getRideIcon(type.iconId)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-sora font-semibold text-[15px] ${selectedRide.id === type.id ? 'text-[#4ADE80]' : 'text-[rgba(255,255,255,0.92)]'}`}>{t[type.nameKey]}</p>
                          <p className="text-[10px] opacity-60 font-dm uppercase tracking-widest mt-0.5" style={{ color: selectedRide.id === type.id ? '#4ADE80' : 'rgba(255, 255, 255, 0.6)' }}>
                            {type.time} • {distanceInfo?.distance || '...'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-sora font-semibold text-lg ${selectedRide.id === type.id ? 'text-white' : 'text-[rgba(255,255,255,0.92)]'}`}>₹{type.price}</p>
                          <p className="text-[9px] opacity-60 font-dm uppercase tracking-widest mt-0.5" style={{ color: selectedRide.id === type.id ? '#4ADE80' : 'rgba(255, 255, 255, 0.6)' }}>Estimated</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 pt-5 bg-[#080B09] border-t border-white/[0.04] flex flex-col gap-5 relative z-10">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CreditCard size={18} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                      <span className="font-dm font-bold text-[11px] uppercase tracking-[0.15em] text-[rgba(255,255,255,0.5)]">Personal • UPI</span>
                    </div>
                    {distanceInfo && (
                      <div className="text-right">
                        <p className="text-[9px] text-[#4ADE80] opacity-80 font-dm font-bold uppercase tracking-[0.15em] mb-0.5">Total Duration</p>
                        <p className="text-[15px] font-sora font-semibold text-[#22c55e]">{distanceInfo.duration}</p>
                      </div>
                    )}
                  </div>
                  
                </div> {/* Close Solid Inner Core */}
                  
                  {isScheduling && scheduledDate && (
                    <div className="space-y-3">
                      <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="text-[#22c55e]" size={18} />
                          <div>
                            <p className="text-[10px] text-[#22c55e] font-bold uppercase tracking-widest">{t.schedule_confirm}</p>
                            <p className="text-sm font-bold text-white">{format(scheduledDate, 'PPp')}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setIsScheduling(false);
                            setScheduledDate(null);
                          }}
                          className="text-zinc-500 hover:text-white transition-colors"
                        >
                          <LogOut size={16} className="rotate-180" />
                        </button>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#22c55e]/20 rounded-lg flex items-center justify-center">
                              <User className="text-[#22c55e]" size={16} />
                            </div>
                            <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{t.share_ride}</span>
                          </div>
                          <button 
                            onClick={() => setIsShared(!isShared)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isShared ? 'bg-[#22c55e]' : 'bg-zinc-800'}`}
                          >
                            <motion.div 
                              animate={{ x: isShared ? 24 : 4 }}
                              className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </div>

                        {isShared && (
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.available_seats}</span>
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => setAvailableSeats(Math.max(1, availableSeats - 1))}
                                className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                              >
                                -
                              </button>
                              <span className="font-bold text-white w-4 text-center">{availableSeats}</span>
                              <button 
                                onClick={() => setAvailableSeats(Math.min(selectedRide.id === 'Premium' ? 5 : 3, availableSeats + 1))}
                                className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mt-2">
                    <button 
                      onClick={handleRequest}
                      className="w-full py-4 rounded-xl font-bold text-[15px] transition-all bg-[#22c55e] text-black hover:bg-[#16a34a] active:scale-[0.98]"
                    >
                      {isScheduling ? 'Confirm Schedule' : 'Confirm Ride'}
                    </button>
                    
                    <button 
                      onClick={() => setShowTimePicker(true)}
                      className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                        isScheduling 
                          ? 'text-[#22c55e] bg-[#22c55e]/10' 
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Clock size={16} />
                      {isScheduling ? 'Change Schedule' : t.schedule_ride}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'searching' && (
              <motion.div 
                key="searching"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="relative bg-[rgba(20,20,20,0.6)] backdrop-blur-[16px] rounded-[32px] p-8 text-center space-y-6 border border-white/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="relative w-24 h-24 mx-auto">
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-emerald-500 rounded-full"
                  />
                  <div className="absolute inset-2 bg-zinc-900 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <Car className="text-emerald-500 animate-pulse" size={32} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-xl font-black font-display tracking-tight">{t.finding_ride}</h2>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{t.finding_driver}</p>
                </div>

                {activeRide?.isShared && (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{t.joined_riders || 'Joined Riders'}</p>
                      <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {joinedRiderProfiles.length} / {activeRide.availableSeats + joinedRiderProfiles.length}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      {joinedRiderProfiles.length > 0 ? (
                        joinedRiderProfiles.map((rider) => (
                          <div key={rider.id} className="flex flex-col items-center gap-1 bg-zinc-800/50 p-2 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-emerald-500/20 rounded-lg overflow-hidden border border-emerald-500/30">
                                <img src={rider.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.id}`} alt={rider.displayName} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] font-bold text-zinc-300">{rider.displayName || 'Rider'}</span>
                            </div>
                            {rider.phoneNumber && (
                              <span className="text-[9px] text-emerald-400 font-mono">{rider.phoneNumber}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-600 font-bold italic">{t.waiting_for_others || 'Waiting for others to join...'}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                    />
                  ))}
                </div>

                <button 
                  onClick={handleCancelRide}
                  className="w-full bg-white/5 text-zinc-400 py-4 rounded-2xl font-black text-sm hover:bg-white/10 transition-all border border-white/5"
                >
                  {t.cancel_request}
                </button>
              </motion.div>
            )}

            {step === 'scheduled_success' && (
              <motion.div 
                key="scheduled_success"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="relative bg-[rgba(20,20,20,0.6)] backdrop-blur-[16px] rounded-[32px] p-8 text-center space-y-6 border border-white/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Clock className="text-emerald-500" size={40} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black font-display tracking-tight text-white">{t.ride_scheduled}</h2>
                  <p className="text-zinc-400 text-sm font-medium">{t.scheduled_info || 'Your ride has been successfully scheduled.'}</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/5 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 " />
                    <div>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{t.pickup_label}</p>
                      <p className="text-sm font-bold text-zinc-200 line-clamp-1">{pickup === 'Current Location' ? currentAddress : pickup}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 " />
                    <div>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{t.destination_label}</p>
                      <p className="text-sm font-bold text-zinc-200 line-clamp-1">{destination}</p>
                    </div>
                  </div>

                  <div className="h-px bg-white/5" />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{t.scheduled_for}</p>
                      <p className="text-sm font-bold text-emerald-500">
                        {scheduledDate ? format(scheduledDate, 'MMM d, h:mm a') : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{t.ride_details}</p>
                      <p className="text-sm font-bold text-zinc-200">{t[selectedRide.nameKey]}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setStep('home');
                    setIsScheduling(false);
                    setScheduledDate(null);
                  }}
                  className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-sm premium-button "
                >
                  {t.got_it}
                </button>
              </motion.div>
            )}

            {step === 'ride' && activeRide && (
              <motion.div 
                key="ride"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="relative bg-[rgba(20,20,20,0.6)] backdrop-blur-[16px] rounded-[32px] overflow-hidden border border-emerald-500/20 "
              >
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="p-6 space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center shadow-inner border border-white/5 text-zinc-300">
                        {getRideIcon(selectedRide.iconId, 28)}
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-0.5">
                          {activeRide.status === 'accepted' ? t.driver_coming : activeRide.status === 'arrived' ? t.driver_arrived : t.en_route}
                        </p>
                        <h2 className="text-lg font-black font-display tracking-tight uppercase">{activeRide.vehicleNo || 'GJ 01 AB 1234'}</h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.otp}</p>
                      <p className="text-xl font-black text-white tracking-tighter">{profile?.rideOTP || '----'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden border border-white/10">
                      <img src={activeRide.driverPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeRide.driverId}`} alt="Driver" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm">{activeRide.driverName || 'Rahul Sharma'}</p>
                      <div className="flex items-center gap-1 text-amber-500">
                        <span className="text-[10px] font-black">4.9</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-amber-500 rounded-full opacity-30" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (currentRideId && activeRide.driverId) {
                            initiateCall(currentRideId, activeRide.driverId, activeRide.driverName || 'Driver');
                          }
                        }}
                        className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                      >
                        <Phone size={18} />
                      </button>
                      <button className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
                        <Bell size={18} />
                      </button>
                      <button className="w-10 h-10 bg-white/5 text-zinc-400 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
                        <User size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
                  <button 
                    onClick={() => setIsSOSModalOpen(true)}
                    className="flex-1 bg-red-500/20 text-red-500 py-4 rounded-2xl font-black text-sm hover:bg-red-500/30 transition-all border border-red-500/30 flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={18} />
                    {t.sos}
                  </button>
                  <button 
                    onClick={handleCancelRide}
                    className="flex-1 bg-white/5 text-zinc-300 py-4 rounded-2xl font-black text-sm hover:bg-white/10 transition-all border border-white/10"
                  >
                    {t.cancel}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {searchingFor && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[70] bg-[rgba(10,10,10,0.85)] backdrop-blur-3xl flex flex-col"
          >
            <div className="p-6 bg-[#151515]/60 border-b border-white/5 flex items-center gap-4">
              <button 
                onClick={() => setSearchingFor(null)} 
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="rotate-180" size={24} />
              </button>
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchingFor === 'pickup' ? t.search_pickup : t.search_destination}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 focus:focus:bg-[rgba(255,255,255,0.05)] transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {searchQuery.length < 3 && (
                <div className="mb-6 space-y-2">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest px-4 mb-3">{t.quick_selection}</p>
                  <div className="grid grid-cols-2 gap-2 px-2">
                      {[LOCATIONS.GATE1, LOCATIONS.GATE2, LOCATIONS.RRU, LOCATIONS.DAHEGAM].map((loc) => (
                        <button
                          key={loc.nameKey}
                          onClick={() => handleSelectSuggestion({ placeName: t[loc.nameKey], placeAddress: t[loc.addressKey], center: [loc.lng, loc.lat] })}
                          className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors text-left"
                        >
                        <MapPin size={14} className="text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-zinc-300 truncate">{t[loc.nameKey]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length > 0 ? (
                suggestions.map((s) => (
                  <button 
                    key={s.id}
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 transition-colors">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{s.placeName}</p>
                      <p className="text-xs text-zinc-500 truncate">{s.placeAddress}</p>
                    </div>
                  </button>
                ))
              ) : searchQuery.length > 2 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">{t.no_locations}</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">{t.type_to_search}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* directions modal */}
      <AnimatePresence>
        {showDirections && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="glass-panel w-full max-w-md rounded-t-[40px] sm:rounded-[40px] overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-900/50 backdrop-blur-xl z-10">
                <div>
                  <h3 className="font-black font-display text-lg tracking-tight">{t.trip_directions}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate max-w-[200px]">{pickup} to {destination}</p>
                </div>
                <button 
                  onClick={() => setShowDirections(false)}
                  className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="rotate-90 text-zinc-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {routeSteps.length > 0 ? (
                  routeSteps.map((step, i) => (
                    <div key={i} className="flex gap-4 relative group">
                      {i < routeSteps.length - 1 && (
                        <div className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-white/5 group-hover:bg-emerald-500/20 transition-colors" />
                      )}
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] text-emerald-500 font-black shrink-0 z-10 ">
                        {i + 1}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-sm font-bold text-zinc-200 leading-snug group-hover:text-white transition-colors">
                          {step.instruction}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="bg-white/5 px-2 py-0.5 rounded-md text-[9px] font-black text-zinc-500 uppercase tracking-wider border border-white/5">
                            {(step.distance / 1000).toFixed(2)} km
                          </span>
                          <span className="bg-white/5 px-2 py-0.5 rounded-md text-[9px] font-black text-zinc-500 uppercase tracking-wider border border-white/5">
                            {Math.round(step.duration / 60)} min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Navigation className="mx-auto text-zinc-800 mb-4" size={48} />
                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">{t.no_directions}</p>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-white/5 border-t border-white/10">
                <button 
                  onClick={() => setShowDirections(false)}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm premium-button"
                >
                  {t.got_it}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTimePicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 max-w-sm w-full text-center "
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <Clock className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{t.select_time}</h2>
              <p className="text-zinc-400 text-sm mb-8">
                {t.invalid_time}
              </p>
              
              <input 
                type="datetime-local"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 transition-colors mb-8"
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                max={format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
                value={scheduledDate ? format(scheduledDate, "yyyy-MM-dd'T'HH:mm") : ''}
                onChange={(e) => setScheduledDate(new Date(e.target.value))}
              />

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    if (scheduledDate && isAfter(scheduledDate, new Date()) && isBefore(scheduledDate, addDays(new Date(), 1))) {
                      setIsScheduling(true);
                      setShowTimePicker(false);
                    } else {
                      alert(t.invalid_time);
                    }
                  }}
                  className="w-full bg-emerald-500 text-black py-4 rounded-2xl font-black text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {t.confirm_ride}
                </button>
                <button 
                  onClick={() => {
                    setShowTimePicker(false);
                    if (!isScheduling) setScheduledDate(null);
                  }}
                  className="w-full bg-white/5 text-white py-4 rounded-2xl font-black text-sm hover:bg-white/10 transition-colors border border-white/5"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isSOSModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center "
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{t.emergency_sos}</h2>
              <p className="text-zinc-400 text-sm mb-8">
                {t.sos_description}
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={handleTriggerSOS}
                  disabled={isSOSLoading}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSOSLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldAlert size={18} />
                      {t.trigger_sos}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setIsSOSModalOpen(false)}
                  disabled={isSOSLoading}
                  className="w-full bg-white/5 text-white py-4 rounded-2xl font-black text-sm hover:bg-white/10 transition-colors border border-white/5"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ride Feedback Bottom Sheet */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-6 space-y-5"
            >
              <div className="flex justify-center">
                <div className="w-10 h-1 bg-zinc-700 rounded-full" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">How was your ride?</h3>
                <p className="text-sm text-zinc-500">Rate your experience</p>
              </div>

              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={36}
                      className={feedbackRating >= star ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Any comments? (optional)"
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFeedback(false);
                    setCompletedRideInfo(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl border border-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-800 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={async () => {
                    if (feedbackRating > 0 && completedRideInfo) {
                      try {
                        await addDoc(collection(db, 'ride_feedback'), {
                          rideId: completedRideInfo.id,
                          riderId: user?.uid,
                          driverId: completedRideInfo.driverId || null,
                          rating: feedbackRating,
                          comment: feedbackText,
                          createdAt: serverTimestamp(),
                        });
                      } catch (e) {
                        console.error('Failed to submit feedback:', e);
                      }
                    }
                    setShowFeedback(false);
                    setCompletedRideInfo(null);
                  }}
                  disabled={feedbackRating === 0}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-black font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NotificationsPanel 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />

      {/* Bottom Navigation Bar */}
      {!showBooking && step === 'home' && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="bg-zinc-900 border-t border-zinc-800 px-2 pb-safe">
            <div className="max-w-xl mx-auto flex items-center justify-around py-2">
              <button 
                className="flex flex-col items-center gap-1 py-2 px-3 text-emerald-500"
              >
                <Home size={20} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
              </button>
              <button 
                onClick={() => navigate('/history')}
                className="flex flex-col items-center gap-1 py-2 px-3 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <History size={20} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{t.history}</span>
              </button>
              <button 
                onClick={() => navigate('/ride-sharing')}
                className="relative flex flex-col items-center gap-1 py-1 px-4"
              >
                <div className="w-12 h-12 -mt-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <Users size={22} className="text-black" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Share</span>
              </button>
              <button 
                onClick={() => navigate('/support')}
                className="flex flex-col items-center gap-1 py-2 px-3 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <HelpCircle size={20} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{t.support}</span>
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="flex flex-col items-center gap-1 py-2 px-3 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <User size={20} />
                <span className="text-[9px] font-bold uppercase tracking-wider">{t.profile}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
