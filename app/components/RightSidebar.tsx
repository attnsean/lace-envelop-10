'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LACE10_ASSETS } from '../../lib/laceAssets';
import { formatPersonName } from '../../lib/format';
import TimelineSection, { StoryEvent } from './TimelineSection';

interface RightSidebarProps {
  guestName: string;
  guest?: any;
  project?: any;
  events?: any[];
  wishes?: any[];
  stats?: any;
  existingRsvp?: any;
}

// Falling rose petals effect matching Canva intro
const FallingPetals = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
    {[...Array(16)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-6 h-6 select-none pointer-events-none"
        style={{
          left: `${(i * 19 + 7) % 92}%`,
          top: `-10%`,
        }}
        animate={{
          y: ['0vh', '110vh'],
          x: [0, i % 2 === 0 ? 30 : -30, 0],
          rotate: [0, 180 + i * 25, 360],
          opacity: [0, 0.9, 0.8, 0],
        }}
        transition={{
          duration: 7 + (i % 5) * 1.5,
          repeat: Infinity,
          delay: i * 0.5,
          ease: 'easeInOut',
        }}
      >
        <img
          src={LACE10_ASSETS.fallingPetals}
          alt="petal"
          className="w-full h-full object-contain filter drop-shadow-sm opacity-80"
        />
      </motion.div>
    ))}
  </div>
);

export default function RightSidebar({
  guestName,
  guest,
  project,
  events = [],
  wishes: initialWishes = [],
  stats,
  existingRsvp,
}: RightSidebarProps) {
  // Navigation states
  const [hasOpened, setHasOpened] = useState(false);
  const [photoStep, setPhotoStep] = useState(false); // Photostrip dispenser transition step
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState(guestName || '');
  const [rsvpAttendance, setRsvpAttendance] = useState('hadir');
  const [rsvpPax, setRsvpPax] = useState(1);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  // Wishes Form State
  const [wishName, setWishName] = useState(guestName || '');
  const [wishMessage, setWishMessage] = useState('');
  const [wishesList, setWishesList] = useState<any[]>(initialWishes || []);
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);

  // Check if guest name comes from personalized link (e.g. /Michael%20Sean or ?to=...)
  const isNameLocked = Boolean(
    guestName &&
    guestName.trim() !== '' &&
    guestName !== 'Tamu Undangan' &&
    guestName !== 'Special Guest'
  );

  useEffect(() => {
    if (guestName && guestName.trim() !== '') {
      setRsvpName(guestName);
      setWishName(guestName);
    }
  }, [guestName]);

  // Dynamic scale calculation to guarantee the cover stages fit completely inside any screen height
  const [coverScale, setCoverScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight;
      const targetHeight = photoStep ? 530 : 420;
      if (vh < targetHeight + 24) {
        const computed = Math.min(1, Math.max(0.62, (vh - 24) / targetHeight));
        setCoverScale(computed);
      } else {
        setCoverScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [photoStep]);

  // Map Tab State (for separate venues)
  const [activeMapTab, setActiveMapTab] = useState<'akad' | 'resepsi'>('akad');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Lightbox Modal
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Extract couple data
  const brideName = formatPersonName(project?.bride_nickname) || formatPersonName(project?.bride_name) || "Nabila";
  const brideNickname = formatPersonName(project?.bride_nickname) || "Nabila";
  const groomName = formatPersonName(project?.groom_nickname) || formatPersonName(project?.groom_name) || "Rayhan";
  const groomNickname = formatPersonName(project?.groom_nickname) || "Rayhan";

  const brideFather = project?.bride_father?.trim() || "Bapak Hendra Wijaya";
  const brideMother = project?.bride_mother?.trim() || "Ibu Maria Wijaya";
  const groomFather = project?.groom_father?.trim() || "Bapak Deni Bastian";
  const groomMother = project?.groom_mother?.trim() || "Ibu Aisha Dania";

  // Event parsing - dynamically derived from project and events
  const defaultEventDate = project?.wedding_date || "2027-12-28";
  const defaultVenueName = project?.venue_name || "Menara 165";
  const defaultVenueAddress = project?.venue_address || "Jl. TB Simatupang, Cilandak Timur, Jakarta Selatan";
  const defaultVenueMaps = project?.venue_maps_url || "https://maps.google.com/?q=Menara+165+Jakarta+Selatan";

  const akadEvent = events.find(e => e.event_type?.toLowerCase().includes('akad')) || events[0] || {
    custom_label: 'Akad Nikah',
    event_date: defaultEventDate,
    event_time: '08.00 WIB',
    venue_name: defaultVenueName,
    venue_address: defaultVenueAddress,
    venue_maps_url: defaultVenueMaps
  };

  const resepsiEvent = events.find(e => e.event_type?.toLowerCase().includes('resepsi')) || events[1] || {
    custom_label: 'Resepsi Pernikahan',
    event_date: defaultEventDate,
    event_time: '11.00 WIB',
    venue_name: defaultVenueName,
    venue_address: defaultVenueAddress,
    venue_maps_url: defaultVenueMaps
  };

  const parseSafeLocalDate = (dateStr?: string | null, fallback = "2027-12-28"): Date => {
    const raw = (dateStr && dateStr.trim()) || fallback;
    const clean = raw.split("T")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return new Date(raw);
  };

  const weddingDateStr = akadEvent?.event_date || events[0]?.event_date || project?.wedding_date || defaultEventDate;
  const weddingDate = parseSafeLocalDate(weddingDateStr, defaultEventDate);
  const formattedDayName = weddingDate.toLocaleDateString("id-ID", { weekday: "long" }) || "Minggu";
  const formattedDateNum = String(weddingDate.getDate()).padStart(2, "0") || "28";
  const formattedMonthNum = String(weddingDate.getMonth() + 1).padStart(2, "0") || "12";
  const formattedYear = String(weddingDate.getFullYear()) || "2027";
  const formattedMonthLong = weddingDate.toLocaleDateString("id-ID", { month: "long" }) || "Desember";

  const formatEventDate = (rawDate?: string | null, fallbackDate?: Date) => {
    const dt = parseSafeLocalDate(rawDate, fallbackDate ? `${fallbackDate.getFullYear()}-${String(fallbackDate.getMonth() + 1).padStart(2, '0')}-${String(fallbackDate.getDate()).padStart(2, '0')}` : undefined);
    return {
      dayName: dt.toLocaleDateString("id-ID", { weekday: "long" }),
      dateNum: String(dt.getDate()).padStart(2, "0"),
      monthNum: String(dt.getMonth() + 1).padStart(2, "0"),
      monthLong: dt.toLocaleDateString("id-ID", { month: "long" }),
      year: String(dt.getFullYear()),
      fullText: `${dt.toLocaleDateString("id-ID", { weekday: "long" })}, ${String(dt.getDate()).padStart(2, "0")} ${dt.toLocaleDateString("id-ID", { month: "long" })} ${dt.getFullYear()}`
    };
  };

  const akadDateFormatted = formatEventDate(akadEvent?.event_date, weddingDate);
  const resepsiDateFormatted = formatEventDate(resepsiEvent?.event_date, weddingDate);
  const isSeparateDates = akadDateFormatted.dateNum !== resepsiDateFormatted.dateNum;

  // Helper to safely extract clean image URL string regardless of whether it is a string or { url, public_url }
  const extractPhotoUrl = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.url || item.public_url || item.src || '';
  };

  // Gallery Photos (100% normalized string URLs)
  const rawGallery: string[] = (
    Array.isArray(project?.gallery_photos) && project.gallery_photos.length > 0 
      ? project.gallery_photos.map(extractPhotoUrl).filter(Boolean)
      : (Array.isArray(project?.photo_urls) && project.photo_urls.length > 0 
          ? project.photo_urls.map(extractPhotoUrl).filter(Boolean) 
          : LACE10_ASSETS.defaultPhotos.gallery)
  );

  // Candid / Polaroid moments (Prioritize real uploaded photos)
  const candidPhotos: string[] = (rawGallery && rawGallery.length > 0)
    ? (rawGallery.length >= 5 
        ? (rawGallery.length >= 10 ? rawGallery.slice(5, 10) : rawGallery.slice(0, 5))
        : rawGallery)
    : LACE10_ASSETS.defaultPhotos.casualMoments;

  const getCandidPhoto = (idx: number): string => {
    if (candidPhotos && candidPhotos.length > 0) {
      return extractPhotoUrl(candidPhotos[idx % candidPhotos.length]);
    }
    return LACE10_ASSETS.defaultPhotos.casualMoments[idx] || rawGallery[0] || '';
  };

  // Love Story data from Supabase / Project
  let loveStoryData: StoryEvent[] | null = null;
  if (Array.isArray(project?.love_story_items) && project.love_story_items.length > 0) {
    loveStoryData = project.love_story_items;
  } else if (Array.isArray(project?.love_story)) {
    loveStoryData = project.love_story;
  } else if (typeof project?.love_story === 'string') {
    try {
      const parsed = JSON.parse(project.love_story);
      if (Array.isArray(parsed)) loveStoryData = parsed;
      else if (parsed && Array.isArray(parsed.items)) loveStoryData = parsed.items;
    } catch (e) {}
  }

  // Bank Accounts / Gifts
  let bankAccounts: any[] = [];
  if (Array.isArray(project?.payment_accounts) && project.payment_accounts.length > 0) {
    bankAccounts = project.payment_accounts;
  } else {
    bankAccounts = [
      {
        bank_name: 'DANA',
        account_number: '0813-5880-4454',
        account_holder: brideName,
        type: 'ewallet'
      },
      {
        bank_name: 'BCA',
        account_number: '1832684494',
        account_holder: groomName,
        type: 'bank'
      }
    ];
  }

  // Calendar generation for the wedding month
  const getCalendarDays = () => {
    const year = weddingDate.getFullYear();
    const month = weddingDate.getMonth(); // 0-indexed
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  };
  const calendarDays = getCalendarDays();
  const weddingDayNum = weddingDate.getDate();

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date(`${weddingDateStr}T09:00:00`).getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [weddingDateStr]);

  // Audio Play/Pause
  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Handle Open Envelope
  const handleOpenEnvelope = () => {
    setPhotoStep(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Continue from Photostrip to Main Invitation
  const handleContinueToMain = () => {
    setHasOpened(true);
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Copy Bank Number
  const copyToClipboard = (text: string, bank: string) => {
    navigator.clipboard.writeText(text.replace(/[^0-9]/g, ''));
    setCopiedBank(bank);
    setTimeout(() => setCopiedBank(null), 2500);
  };

  // Submit RSVP
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (rsvpName || wishName || guestName || 'Tamu Undangan').trim();
    setIsSubmittingRsvp(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project?.id,
          guest_id: guest?.id || null,
          name: finalName,
          guest_name: finalName,
          attendance: rsvpAttendance,
          pax: rsvpAttendance === 'hadir' ? rsvpPax : 0,
        }),
      });
      if (res.ok) {
        setRsvpSubmitted(true);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || 'Gagal menyimpan konfirmasi. Silakan coba lagi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi saat mengirim RSVP. Silakan coba lagi.');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // Submit Wish
  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishMessage.trim()) return;
    const finalName = (wishName || rsvpName || guestName || 'Tamu Undangan').trim();
    setIsSubmittingWish(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project?.id,
          guest_id: guest?.id || null,
          name: finalName,
          message: wishMessage.trim(),
        }),
      });
      if (res.ok) {
        const newWish = {
          id: Date.now().toString(),
          name: finalName,
          message: wishMessage.trim(),
          created_at: new Date().toISOString(),
          is_approved: true,
        };
        setWishesList((prev) => [newWish, ...(prev || [])]);
        setWishMessage('');
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || 'Gagal mengirim ucapan. Silakan coba lagi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi saat mengirim ucapan. Silakan coba lagi.');
    } finally {
      setIsSubmittingWish(false);
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className={`relative w-full md:w-[42%] lg:w-[38%] xl:w-[35%] h-[100dvh] ${
        hasOpened ? "overflow-y-auto" : "overflow-hidden"
      } no-scrollbar bg-[#180205] text-[#f7f2ea] font-serif select-none flex-shrink-0`}
    >
      {/* Background Audio */}
      <audio
        ref={audioRef}
        src={project?.music_url || "https://cdn.serastory.com/templates/lace-envelop-10/audio/bgm.mp3"}
        loop
        preload="auto"
      />

      {/* Floating Audio Vinyl Controller */}
      {hasOpened && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggleAudio}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#1e0508]/90 backdrop-blur-md border-2 border-[#c49a6c] shadow-[0_8px_25px_rgba(0,0,0,0.7)] flex items-center justify-center p-1 group hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? "Jeda Musik" : "Putar Musik"}
        >
          <motion.img
            src={LACE10_ASSETS.vinylRecord}
            alt="Vinyl Player"
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-full h-full object-contain filter drop-shadow-md"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-3.5 h-3.5 rounded-full bg-[#821c2c] border border-white/60"></span>
          </div>
        </motion.button>
      )}

      {/* ========================================================================= */}
      {/* PART 1: LUXURY OPENING ENVELOPE EXPERIENCE                                */}
      {/* ========================================================================= */}
      <AnimatePresence mode="wait">
        {!hasOpened && (
          <motion.div
            key="cover-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center h-[100dvh] max-h-[100dvh] w-full px-4 overflow-hidden select-none"
            style={{
              backgroundImage: `url(${photoStep ? LACE10_ASSETS.bgRedCurtain : LACE10_ASSETS.bgRedVelvet})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark romantic vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#250307]/70 via-transparent to-[#1a0205]/85 pointer-events-none"></div>

            {/* Falling petals */}
            <FallingPetals />

            {!photoStep ? (
              /* STAGE 1: CLOSED ENVELOPE WITH SEAL & RECIPIENT */
              <motion.div
                key="envelope-stage"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.5 } }}
                transition={{ duration: 0.8 }}
                style={{
                  transform: coverScale < 1 ? `scale(${coverScale})` : undefined,
                  transformOrigin: 'center center',
                }}
                className="relative z-30 flex flex-col items-center max-w-sm w-full mx-auto my-auto"
              >
                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl md:text-5xl text-[#f5ebe1] tracking-wide mb-5 sm:mb-8 text-center drop-shadow-md"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  You Are Invited !!
                </motion.h2>

                {/* Envelope Container */}
                <div className="relative w-[320px] sm:w-[370px] h-[225px] sm:h-[260px] flex items-center justify-center">
                  {/* Closed Envelope Artwork */}
                  <img
                    src={LACE10_ASSETS.envelopeClosed}
                    alt="Lace Envelope"
                    className="w-full h-full object-contain filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.65)]"
                  />

                  {/* Top-Right Botanical Bouquet */}
                  <img
                    src={LACE10_ASSETS.flowerRoseBouquet}
                    alt="Rose Bouquet"
                    className="absolute -top-7 -right-5 sm:-top-8 sm:-right-6 w-22 sm:w-28 h-auto object-contain pointer-events-none filter drop-shadow-md"
                  />

                  {/* Bottom-Left Velvet Dahlia */}
                  <img
                    src={LACE10_ASSETS.flowerRedDahlia}
                    alt="Velvet Dahlia"
                    className="absolute -bottom-5 -left-5 sm:-bottom-6 sm:-left-6 w-18 sm:w-24 h-auto object-contain pointer-events-none filter drop-shadow-md"
                  />

                  {/* Guest Name Plaque */}
                  <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-[80%] z-10">
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#d6b797] font-medium mb-1 font-serif">
                      Kepada Yth.
                    </p>
                    <p className="text-base sm:text-lg font-bold text-[#fff7ee] tracking-wide truncate font-serif">
                      {guestName || 'Tamu Undangan'}
                    </p>
                  </div>

                  {/* Wax Seal (Clickable Button) */}
                  <motion.button
                    type="button"
                    onClick={handleOpenEnvelope}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-18 sm:h-18 z-20 flex items-center justify-center cursor-pointer focus:outline-none group"
                  >
                    <img
                      src={LACE10_ASSETS.waxSealMonogram}
                      alt="Wax Seal"
                      className="w-full h-full object-contain filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.55)] group-hover:brightness-105 transition-all select-none"
                    />
                  </motion.button>
                </div>

                {/* Tap to open text */}
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  onClick={handleOpenEnvelope}
                  className="mt-5 sm:mt-8 cursor-pointer text-center group"
                >
                  <span className="text-xs sm:text-sm tracking-[0.25em] text-[#e8cfb5] uppercase font-serif border-b border-[#e8cfb5]/50 pb-0.5 group-hover:text-white group-hover:border-white transition-colors">
                    Tap to open
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              /* STAGE 2: PHOTOSTRIP DISPENSER ANIMATION */
              <motion.div
                key="photostrip-stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.6 } }}
                style={{
                  transform: coverScale < 1 ? `scale(${coverScale})` : undefined,
                  transformOrigin: 'center center',
                }}
                className="relative z-30 flex flex-col items-center max-w-sm w-full mx-auto my-auto px-2"
              >
                {/* Floating Orchid Cascades flanking the photobooth */}
                <div className="absolute -left-3 sm:-left-4 top-1 sm:top-2 w-18 sm:w-24 pointer-events-none select-none z-10 opacity-90">
                  <img
                    src={LACE10_ASSETS.orchidCascade}
                    alt="Orchid cascade left"
                    className="w-full h-auto object-contain drop-shadow-md"
                  />
                </div>
                <div className="absolute -right-3 sm:-right-4 top-1 sm:top-2 w-18 sm:w-24 pointer-events-none select-none z-10 opacity-90 scale-x-[-1]">
                  <img
                    src={LACE10_ASSETS.orchidCascade}
                    alt="Orchid cascade right"
                    className="w-full h-auto object-contain drop-shadow-md"
                  />
                </div>

                {/* Monogram Top */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-2 sm:mb-3 z-20"
                >
                  <span
                    className="text-4xl sm:text-5xl text-[#d4af37] font-serif tracking-widest drop-shadow-md block leading-tight"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    {groomNickname.charAt(0)} &amp; {brideNickname.charAt(0)}
                  </span>
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.28em] text-[#e5c7a9] mt-0.5 font-serif">
                    Our Getting Married....
                  </p>
                </motion.div>

                {/* Photobooth Dispenser Slot Machine */}
                <div className="relative w-[280px] sm:w-[310px] flex flex-col items-center z-20">
                  {/* Layer 1: Base Full Slot Housing (z-10) with drop shadow */}
                  <div className="relative z-10 w-full select-none pointer-events-none">
                    <img
                      src={LACE10_ASSETS.photoboothSlot}
                      alt="Photobooth Slot"
                      className="w-full h-auto object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.85)]"
                    />
                  </div>

                  {/* Layer 2: Dispensing Chute & Photostrip (z-20) */}
                  {/* Anchored precisely at slit line. Cuts off anything still inside machine! */}
                  <div 
                    className="absolute top-[30px] sm:top-[32px] w-[208px] sm:w-[226px] overflow-hidden z-20 pb-4 pt-0 pointer-events-none"
                  >
                    {/* Photostrip: slowly emerges from inside slit downwards over bottom bezel */}
                    <motion.div
                      initial={{ y: "-100%" }}
                      animate={{ y: "0%" }}
                      transition={{ 
                        duration: 3.8, 
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: 0.8
                      }}
                      className="w-full bg-[#751727] p-2 sm:p-2.5 pt-3 sm:pt-4 pb-2.5 sm:pb-3 border-2 border-[#caa472] shadow-[0_12px_28px_rgba(0,0,0,0.7)] rounded-sm flex flex-col gap-2 sm:gap-2.5 pointer-events-auto"
                    >
                      <div className="w-full h-[105px] sm:h-[125px] bg-neutral-900 rounded overflow-hidden border border-[#caa472]/40 shadow-inner">
                        <img
                          src={rawGallery[0] || LACE10_ASSETS.defaultPhotos.photostrip1}
                          alt="Couple Photo 1"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center 28%' }}
                        />
                      </div>
                      <div className="w-full h-[105px] sm:h-[125px] bg-neutral-900 rounded overflow-hidden border border-[#caa472]/40 shadow-inner">
                        <img
                          src={rawGallery[1] || LACE10_ASSETS.defaultPhotos.photostrip2}
                          alt="Couple Photo 2"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center 26%' }}
                        />
                      </div>
                      <div className="w-full h-[105px] sm:h-[125px] bg-neutral-900 rounded overflow-hidden border border-[#caa472]/40 shadow-inner">
                        <img
                          src={rawGallery[2] || LACE10_ASSETS.defaultPhotos.photostrip3}
                          alt="Couple Photo 3"
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center 22%' }}
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Layer 3: Slot Machine Upper Bezel Lip (z-30) */}
                  {/* Covers only the upper 34px so the emerging strip stays hidden above the slit */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[32px] sm:h-[34px] overflow-hidden z-30 pointer-events-none select-none"
                  >
                    <img
                      src={LACE10_ASSETS.photoboothSlot}
                      alt="Photobooth Slot Top Lip"
                      className="w-full h-auto object-contain"
                    />
                  </div>

                  {/* Layer 4: Deep Shadow inside the slit mouth (z-25) */}
                  <div className="absolute top-[30px] sm:top-[32px] left-[13%] right-[13%] h-2.5 bg-gradient-to-b from-black/95 via-black/60 to-transparent pointer-events-none z-25 rounded-b-sm" />

                  {/* Spacer to hold the layout height while the photostrip dispenses */}
                  <div className="w-[208px] sm:w-[226px] h-[375px] sm:h-[430px] pointer-events-none" />
                </div>

                {/* Continue Button & Heart Swirl Accent */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4.8, duration: 0.6 }}
                  className="mt-2.5 sm:mt-4 flex flex-col items-center gap-1.5 sm:gap-2 z-20"
                >
                  <button
                    type="button"
                    onClick={handleContinueToMain}
                    className="px-7 sm:px-8 py-2 sm:py-2.5 rounded-full bg-[#1f0508]/90 backdrop-blur-md border border-[#c49a6c] text-[#f5ebd8] text-[11px] sm:text-xs font-serif uppercase tracking-[0.25em] hover:bg-[#851c2d] hover:text-white transition-all shadow-xl hover:scale-105 cursor-pointer"
                  >
                    Tap to continue
                  </button>
                  {/* Heart Swirl Divider Accent */}
                  <div className="flex items-center gap-2 text-[#c49a6c]/60 mt-0.5 select-none pointer-events-none">
                    <div className="w-8 sm:w-10 h-px bg-gradient-to-r from-transparent to-[#c49a6c]" />
                    <span className="text-xs sm:text-sm leading-none text-[#d4af37]">❦</span>
                    <div className="w-8 sm:w-10 h-px bg-gradient-to-l from-transparent to-[#c49a6c]" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PART 2: MAIN WEDDING INVITATION WEBSITE                                   */}
      {/* ========================================================================= */}
      {hasOpened && (
        <main className="relative w-full min-h-screen bg-[#180205] overflow-hidden">
          {/* --------------------------------------------------------------------- */}
          {/* SECTION 0: HERO FLATLAY COLLAGE (Full Width Background)               */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full overflow-hidden select-none py-4 px-2"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedSatinDraped})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Inner responsive frame with balanced full flatlay proportions */}
            <div className="relative w-full max-w-[470px] aspect-[430/525] mx-auto">
              {/* 1. Pleated Red Circular Fan on the left background */}
              <div
                className="absolute left-[-2%] top-[14%] w-[52%] aspect-square rounded-full overflow-hidden shadow-2xl pointer-events-none opacity-95"
                style={{
                  backgroundImage: `url(${LACE10_ASSETS.pleatedSunburstMat})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* Moss & Floral sprigs draped over the fan */}
              <img
                src={LACE10_ASSETS.hangingMoss}
                alt="Moss"
                className="absolute left-[9%] top-[22%] w-[12%] h-auto object-contain pointer-events-none opacity-90 z-10"
              />
              <img
                src={LACE10_ASSETS.flowerRoseBouquet}
                alt="Rose Accent"
                className="absolute left-[13%] top-[18%] w-[18%] h-auto object-contain pointer-events-none z-10 rotate-[-15deg]"
              />

              {/* 2. Elegant Subtle Gold Watermark Monogram in Center Background (Replaces harsh green letter) */}
              <div className="absolute left-[44%] top-[28%] z-0 pointer-events-none flex flex-col items-center leading-none select-none opacity-25">
                <span className="font-serif text-[68px] text-[#edd59e] font-normal tracking-tight">
                  {brideNickname.charAt(0)}
                </span>
                <span className="font-serif text-[50px] text-[#d4af37] font-normal tracking-tight -mt-5">
                  {groomNickname.charAt(0).toLowerCase()}
                </span>
              </div>

              {/* 3. Top Open Envelope with Couple Photo & Flower Bouquet */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute left-[34%] top-[1%] w-[58%] h-[46%] z-15 flex items-center justify-center cursor-pointer group"
                onClick={() => setLightboxImg(rawGallery[0] || LACE10_ASSETS.defaultPhotos.heroEnvelope)}
              >
                {/* Envelope Backdrop (Shows top open flap and side wings) */}
                <img
                  src={LACE10_ASSETS.envelopeOpen}
                  alt="Open Envelope"
                  className="absolute inset-0 w-full h-full object-contain filter drop-shadow-xl pointer-events-none z-0"
                />

                {/* Couple Photo (Elevated, centered, full faces visible inside white print frame) */}
                <div className="absolute top-[4%] left-[20%] w-[60%] h-[74%] bg-white p-1 shadow-[0_8px_20px_rgba(0,0,0,0.5)] rounded-xs overflow-hidden z-10 border border-[#e8d7c3]">
                  <img
                    src={rawGallery[0] || LACE10_ASSETS.defaultPhotos.heroEnvelope}
                    alt="Couple Hero"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ objectPosition: "center 18%" }}
                  />
                </div>

                {/* Envelope Lower Pocket Overlay (Holds bottom of photo neatly) */}
                <div 
                  className="absolute bottom-[4%] left-[16%] w-[68%] h-[40%] pointer-events-none z-20 overflow-hidden"
                  style={{ clipPath: "polygon(0% 45%, 50% 100%, 100% 45%, 100% 100%, 0% 100%)" }}
                >
                  <div className="w-full h-full bg-gradient-to-t from-[#5a121d] via-[#731826] to-[#8a1d2e] border-t border-[#caa472]/40 shadow-inner" />
                </div>

                {/* Dark Red Flower Bouquet on Top-Right */}
                <img
                  src={LACE10_ASSETS.flowerRoseBouquet}
                  alt="Rose"
                  className="absolute -top-[10%] -right-[4%] w-[34%] h-auto object-contain pointer-events-none z-30"
                />
              </motion.div>

              {/* 4. Mini RSVP Envelope on the Left (Natural resting position on pleated fan, no overlap on couple photo) */}
              <motion.a
                href="#rsvp-section"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="absolute left-[3%] top-[14%] w-[30%] aspect-[2400/1743] z-10 flex items-center justify-center cursor-pointer filter drop-shadow-xl"
                style={{ rotate: "-5deg" }}
              >
                {/* White lace insert card */}
                <div className="absolute -top-[24%] left-[12%] w-[76%] h-[82%] bg-[#fdfaf5] border-2 border-dashed border-[#691823]/40 rounded-t-full shadow-md flex flex-col items-center justify-start pt-1.5 px-1 text-center pointer-events-none">
                  <p className="text-[7.5px] font-serif text-[#691823] leading-none">
                    Kindly
                  </p>
                  <p className="text-[9.5px] font-serif font-bold text-[#691823] tracking-tight leading-tight my-0.5">
                    RSVP Here!!
                  </p>
                  <p className="text-[7px] font-serif text-[#691823] underline leading-none">
                    Tap to open
                  </p>
                </div>

                {/* Red Envelope body */}
                <img
                  src={LACE10_ASSETS.envelopeOpen}
                  alt="Mini RSVP Envelope"
                  className="w-full h-full object-contain pointer-events-none relative z-10"
                />

                {/* Wax Seal Rose on the envelope closure */}
                <img
                  src={LACE10_ASSETS.waxSealRose}
                  alt="Wax Seal"
                  className="absolute bottom-[2%] left-[37%] w-[26%] h-auto object-contain filter drop-shadow-md pointer-events-none z-20"
                />
              </motion.a>

              {/* 5. Right Arched Plaque */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute left-[52%] top-[23%] w-[42%] h-[49%] z-20 bg-gradient-to-b from-[#8f2132] via-[#6b1523] to-[#4a0d18] p-[2.5px] rounded-t-[54px] rounded-b-2xl shadow-[0_14px_35px_rgba(0,0,0,0.6)]"
              >
                <div className="w-full h-full bg-[#fdfaf5] rounded-t-[51px] rounded-b-xl border border-[#caa472]/60 p-2 flex flex-col items-center justify-between text-center relative overflow-hidden py-2 sm:py-3">
                  {/* Subtle inner vintage dashed border */}
                  <div className="absolute inset-1 rounded-t-[48px] rounded-b-lg border border-dashed border-[#caa472]/30 pointer-events-none" />

                  {/* Top Arch Decoration */}
                  <div className="relative z-10 flex flex-col items-center mt-0.5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[6.5px] text-[#caa472]">✦</span>
                      <p className="text-[7.5px] font-serif uppercase tracking-[0.24em] text-[#8c6b45] font-bold">
                        The Wedding Of
                      </p>
                      <span className="text-[6.5px] text-[#caa472]">✦</span>
                    </div>
                    <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-[#caa472]/60 to-transparent" />
                  </div>

                  {/* Couple Calligraphy */}
                  <div className="relative z-10 flex flex-col items-center my-0.5 leading-none">
                    <h1
                      className="text-[28px] leading-[1.08] text-[#7a1827] tracking-wide my-0.5 drop-shadow-xs"
                      style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                    >
                      {brideNickname}
                    </h1>
                    <div className="flex items-center justify-center gap-1 my-0.5">
                      <div className="w-3 h-[1px] bg-[#caa472]/40" />
                      <span className="text-[12px] text-[#8c6b45] italic font-serif leading-none">&amp;</span>
                      <div className="w-3 h-[1px] bg-[#caa472]/40" />
                    </div>
                    <h1
                      className="text-[28px] leading-[1.08] text-[#7a1827] tracking-wide my-0.5 drop-shadow-xs"
                      style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                    >
                      {groomNickname}
                    </h1>
                  </div>

                  {/* Bottom Emblem with Dove & Badge */}
                  <div className="relative z-10 flex flex-col items-center pb-0.5">
                    <img
                      src={LACE10_ASSETS.doveOliveBranch}
                      alt="Doves"
                      className="w-[28px] h-auto object-contain opacity-90 filter drop-shadow-xs mb-1"
                    />
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-gradient-to-r from-[#eedcc5] via-[#f9f1e4] to-[#eedcc5] border border-[#c49a6c]">
                      <span className="text-[6px] font-serif uppercase tracking-[0.2em] text-[#7a1827] font-bold">
                        Forever Starts Here
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 6. Bottom-Left Tall Arched Card ("Save The Date") */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute left-[7%] top-[40%] w-[33%] h-[53%] z-20 bg-gradient-to-b from-[#8f2132] via-[#6b1523] to-[#4a0d18] p-[2.5px] rounded-t-full rounded-b-2xl shadow-[0_14px_35px_rgba(0,0,0,0.65)]"
              >
                <div className="w-full h-full bg-[#fdfaf5] rounded-t-full rounded-b-xl border border-[#caa472]/60 p-2 flex flex-col items-center justify-between text-center py-2.5 sm:py-3.5 relative overflow-hidden">
                  {/* Subtle inner vintage dashed border */}
                  <div className="absolute inset-1 rounded-t-full rounded-b-lg border border-dashed border-[#caa472]/30 pointer-events-none" />

                  {/* Top: Swans icon & Luxury Gold Ribbon Badge */}
                  <div className="relative z-10 flex flex-col items-center mt-0.5">
                    <img
                      src={LACE10_ASSETS.swansHeart}
                      alt="Swans"
                      className="w-[28px] h-auto object-contain mb-1 opacity-95 filter drop-shadow-xs"
                    />
                    <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#eedcc5] via-[#f9f1e4] to-[#eedcc5] border border-[#c49a6c] shadow-xs">
                      <p className="text-[7px] font-serif uppercase tracking-[0.24em] text-[#7a1827] font-bold">
                        Save The Date
                      </p>
                    </div>
                  </div>

                  {/* Middle: Day name badge & Editorial Date (Handles Single Day or 2 Days) */}
                  <div className="relative z-10 flex flex-col items-center my-0.5 leading-none">
                    {isSeparateDates ? (
                      <>
                        <div className="px-2 py-0.5 rounded-full bg-[#f4e6d2] border border-[#caa472]/60 mb-0.5 shadow-2xs">
                          <span className="text-[6.8px] font-serif uppercase tracking-[0.12em] text-[#7a1827] font-bold block">
                            {akadDateFormatted.dayName.slice(0, 3)} &amp; {resepsiDateFormatted.dayName.slice(0, 3)}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1 my-0.5">
                          <span
                            className="text-[24px] font-serif font-bold text-[#7a1827] leading-none tracking-tight"
                            style={{ textShadow: "0 1px 2px rgba(122,24,39,0.15)" }}
                          >
                            {akadDateFormatted.dateNum}
                          </span>
                          <span className="text-[13px] font-serif font-semibold text-[#c49a6c] leading-none">&amp;</span>
                          <span
                            className="text-[24px] font-serif font-bold text-[#7a1827] leading-none tracking-tight"
                            style={{ textShadow: "0 1px 2px rgba(122,24,39,0.15)" }}
                          >
                            {resepsiDateFormatted.dateNum}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[6px] text-[#caa472]">✦</span>
                          <span className="text-[9.5px] font-serif font-bold text-[#6b1523] uppercase tracking-[0.16em]">
                            {formattedMonthLong.slice(0, 3)}
                          </span>
                          <span className="text-[5.5px] text-[#caa472]">•</span>
                          <span className="text-[9.5px] font-serif font-medium text-[#7a1827] tracking-wider">
                            {formattedYear}
                          </span>
                          <span className="text-[6px] text-[#caa472]">✦</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-[7.5px] font-serif uppercase tracking-[0.2em] text-[#8c6b45] font-bold mb-1">
                          {formattedDayName}
                        </span>
                        <div className="flex flex-col items-center leading-none my-0.5">
                          <span
                            className="text-[28px] font-serif font-bold text-[#7a1827] leading-none tracking-tight"
                            style={{ textShadow: "0 1px 2px rgba(122,24,39,0.15)" }}
                          >
                            {formattedDateNum}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[6.5px] text-[#caa472]">✦</span>
                            <span className="text-[10px] font-serif font-bold text-[#6b1523] uppercase tracking-[0.16em]">
                              {formattedMonthLong.slice(0, 3)}
                            </span>
                            <span className="text-[6px] text-[#caa472]">•</span>
                            <span className="text-[10px] font-serif font-medium text-[#7a1827] tracking-wider">
                              {formattedYear}
                            </span>
                            <span className="text-[6.5px] text-[#caa472]">✦</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Bottom: Luxury Ornamental Divider & Romantic Initials */}
                  <div className="relative z-10 flex flex-col items-center w-full px-1 pb-0.5">
                    <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#caa472] to-transparent mb-1" />
                    <p className="text-[6.5px] font-serif italic text-[#7a1827] tracking-wider leading-tight">
                      The Beginning of Forever
                    </p>
                    <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-[#f4e6d2]/80 border border-[#d6b797]">
                      <span className="text-[6.5px] font-serif uppercase tracking-[0.22em] text-[#6b1523] font-bold">
                        {groomNickname ? groomNickname[0] : "R"} &amp; {brideNickname ? brideNickname[0] : "N"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3D Red Satin Ribbon Bow attached neatly to the left edge with floral sprig */}
                <img
                  src={LACE10_ASSETS.redRibbonBow}
                  alt="Red Bow"
                  className="absolute -left-[14px] top-[30%] w-[32px] h-auto object-contain filter drop-shadow-md z-30 pointer-events-none rotate-[-10deg]"
                />
              </motion.div>

              {/* 7. Center Venue & Schedule Details Card */}
              {(() => {
                const hasSeparateVenues = Boolean(
                  resepsiEvent && 
                  resepsiEvent.venue_name && 
                  akadEvent.venue_name && 
                  resepsiEvent.venue_name.trim().toLowerCase() !== akadEvent.venue_name.trim().toLowerCase()
                );
                const hasSeparateDates = akadDateFormatted.dateNum !== resepsiDateFormatted.dateNum;
                const hasSeparateTimes = (akadEvent.event_time || "").trim() !== (resepsiEvent.event_time || "").trim();

                return (
                  <motion.div
                    drag
                    dragConstraints={{ left: -140, right: 140, top: -160, bottom: 160 }}
                    dragElastic={0.15}
                    whileDrag={{ scale: 1.05, zIndex: 60, cursor: "grabbing" }}
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="absolute left-[33%] top-[54%] w-[36%] min-h-[25%] z-30 bg-[#fdfbf7] p-2 rounded-xl border border-[#caa472]/90 shadow-[0_14px_35px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing select-none touch-none"
                    style={{ rotate: "1.5deg" }}
                  >
                    {/* Header Label with Drag Indicator */}
                    <div className="w-full pb-0.5 mb-1 border-b border-[#caa472]/40 flex items-center justify-between px-0.5">
                      <span className="text-[7px] font-serif uppercase tracking-[0.16em] text-[#7a1827] font-bold">
                        Rangkaian Acara
                      </span>
                      <span className="text-[6px] text-[#caa472] font-mono flex items-center gap-0.5 font-bold" title="Bisa digeser">
                        <span className="text-[7.5px] leading-none">⠿</span> geser
                      </span>
                    </div>

                    {/* Akad Nikah Session */}
                    <div className="w-full bg-[#f8f3ea] rounded-md px-1.5 py-1 border border-[#caa472]/35 mb-1 text-left">
                      <div className="flex items-center justify-between gap-0.5">
                        <span className="text-[6.8px] font-serif uppercase tracking-[0.08em] text-[#7a1827] font-bold">
                          {akadEvent.custom_label || "Akad Nikah"}
                        </span>
                        <span className="text-[6.2px] font-sans font-bold text-[#6b1523] bg-[#eedbc5] px-1 py-0.2 rounded shrink-0">
                          {akadEvent.event_time || "07.00 WIB"}
                        </span>
                      </div>
                      <p className="text-[6.2px] font-serif text-[#665044] leading-tight mt-0.5">
                        {akadDateFormatted.dayName}, {akadDateFormatted.dateNum} {akadDateFormatted.monthLong.slice(0, 3)} {akadDateFormatted.year}
                      </p>
                    </div>

                    {/* Resepsi Pernikahan Session */}
                    <div className="w-full bg-[#f8f3ea] rounded-md px-1.5 py-1 border border-[#caa472]/35 mb-1 text-left">
                      <div className="flex items-center justify-between gap-0.5">
                        <span className="text-[6.8px] font-serif uppercase tracking-[0.08em] text-[#7a1827] font-bold">
                          {resepsiEvent.custom_label || "Resepsi Pernikahan"}
                        </span>
                        <span className="text-[6.2px] font-sans font-bold text-[#6b1523] bg-[#eedbc5] px-1 py-0.2 rounded shrink-0">
                          {resepsiEvent.event_time || "08.30 WIB"}
                        </span>
                      </div>
                      <p className="text-[6.2px] font-serif text-[#665044] leading-tight mt-0.5">
                        {resepsiDateFormatted.dayName}, {resepsiDateFormatted.dateNum} {resepsiDateFormatted.monthLong.slice(0, 3)} {resepsiDateFormatted.year}
                      </p>
                    </div>

                    {/* Venue Location */}
                    <div className="w-full text-center pt-0.5 border-t border-[#caa472]/25 mt-0.5">
                      <p className="text-[7.5px] font-serif font-bold text-[#222] truncate leading-tight">
                        {hasSeparateVenues 
                          ? `${akadEvent.venue_name} & ${resepsiEvent.venue_name}`
                          : (akadEvent.venue_name || "Kediaman Mempelai Wanita")}
                      </p>
                      <p className="text-[6px] text-neutral-600 font-sans leading-tight line-clamp-1 mt-0.5">
                        {akadEvent.venue_address}
                      </p>
                    </div>
                  </motion.div>
                );
              })()}

              {/* 8. Spinning Vinyl Record Music Player below venue card */}
              <div
                onClick={toggleAudio}
                className="absolute left-[40%] top-[79%] w-[21%] aspect-square z-30 flex items-center justify-center cursor-pointer group"
                title={isPlaying ? "Pause Musik" : "Putar Musik"}
              >
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                  className="relative w-full h-full rounded-full overflow-hidden shadow-2xl filter drop-shadow-xl hover:scale-105 transition-transform"
                >
                  <img
                    src={LACE10_ASSETS.vinylDisc}
                    alt="Vinyl Record"
                    className="w-full h-full object-contain"
                  />
                  {/* Red center label with play/pause button */}
                  <div className="absolute inset-0 m-auto w-[36%] h-[36%] rounded-full bg-[#851c2d] border border-[#f5ebd8] flex items-center justify-center shadow-inner">
                    {isPlaying ? (
                      <div className="flex gap-0.5">
                        <div className="w-[2px] h-2 bg-white rounded-full"></div>
                        <div className="w-[2px] h-2 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      <svg className="w-2.5 h-2.5 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* 9. Brass Candlestick Holder with Burning Red Candle */}
              <div className="absolute left-[74%] top-[62%] w-[12%] h-auto z-20 pointer-events-none">
                <img
                  src={LACE10_ASSETS.candleBrassStand}
                  alt="Candle"
                  className="w-full h-auto object-contain filter drop-shadow-md"
                />
              </div>
            </div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 1: SAVE THE DATE CALENDAR & COUNTDOWN (Full Width BG)         */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full overflow-hidden select-none px-4 py-12 flex flex-col items-center justify-center"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedCurtain})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark romantic vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1b0307]/80 via-[#26050b]/60 to-[#1b0307]/85 pointer-events-none" />

            {/* Top Flourish Heart Divider */}
            <div className="relative z-10 w-44 h-auto mb-3 opacity-85">
              <img
                src={LACE10_ASSETS.flourishDividerHeart}
                alt="Flourish Divider"
                className="w-full h-auto object-contain filter drop-shadow"
              />
            </div>

            {/* Header Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 text-center mb-6 max-w-sm"
            >
              <p className="text-[10px] uppercase font-serif tracking-[0.35em] text-[#d6b797] font-semibold mb-1">
                Save The Date
              </p>
              <h2
                className="text-4xl sm:text-5xl text-[#fff7ee] tracking-wide my-1 drop-shadow-md"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
              >
                {brideNickname} &amp; {groomNickname}
              </h2>
              <p className="text-xs font-serif text-[#e5c7a9] tracking-widest mt-1">
                {isSeparateDates 
                  ? `${akadDateFormatted.dayName}, ${akadDateFormatted.dateNum} & ${resepsiDateFormatted.dayName}, ${resepsiDateFormatted.dateNum} ${formattedMonthLong} ${formattedYear}`
                  : `${formattedDayName}, ${formattedDateNum} ${formattedMonthLong} ${formattedYear}`}
              </p>
            </motion.div>

            {/* Clean, Neat, Non-Overlapping Calendar Card */}
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7 }}
              className="relative z-10 w-full max-w-xs bg-[#fdfaf5] text-[#3d1017] rounded-3xl p-6 shadow-2xl border-2 border-[#caa472] flex flex-col items-center"
            >
              {/* 3D Red Ribbon Bow on Top Center */}
              <img
                src={LACE10_ASSETS.redRibbonBow}
                alt="Red Bow"
                className="absolute -top-5 left-1/2 -translate-x-1/2 w-14 h-auto object-contain filter drop-shadow-md z-20"
              />

              {/* Month Header */}
              <div className="text-center mb-4 mt-2">
                <p className="text-xs font-serif font-bold tracking-[0.25em] text-[#7a1827] uppercase">
                  {formattedMonthLong} {formattedYear}
                </p>
                <div className="w-12 h-[1px] bg-[#caa472] mx-auto mt-1" />
              </div>

              {/* Weekday Labels */}
              <div className="w-full grid grid-cols-7 gap-1 text-center text-[10px] font-sans font-bold text-[#7a1827] mb-2 uppercase tracking-wider">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar Grid */}
              <div className="w-full grid grid-cols-7 gap-1 text-center text-xs font-serif text-[#42111a]">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-8" />;
                  }
                  const isWeddingDay = day === parseInt(akadDateFormatted.dateNum, 10) || day === parseInt(resepsiDateFormatted.dateNum, 10);
                  return (
                    <div
                      key={`day-${day}`}
                      className="h-8 flex items-center justify-center relative font-medium"
                    >
                      {isWeddingDay ? (
                        <motion.div
                          animate={{ scale: [1, 1.12, 1] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-8 h-8 rounded-full bg-[#7a1827] text-white font-bold flex items-center justify-center shadow-md relative z-10"
                        >
                          <span className="text-xs">{day}</span>
                          <span className="absolute -top-1 -right-1 text-[10px]">❤️</span>
                        </motion.div>
                      ) : (
                        <span className="hover:text-[#7a1827] transition-colors">{day}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Countdown Box */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 w-full max-w-xs mt-5 rounded-2xl bg-[#1b0307]/85 backdrop-blur-md border border-[#caa472]/60 shadow-xl flex flex-col items-center justify-center p-4 text-center"
            >
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#d6b797] font-serif font-bold mb-2">
                Counting Days
              </p>
              <div className="flex items-center justify-center gap-2.5 text-white font-serif">
                <div className="bg-[#2d070d] px-2.5 py-1.5 rounded-lg border border-[#caa472]/40 text-center min-w-[50px]">
                  <span className="text-lg font-bold text-[#fce8cf] block leading-none">{timeLeft.days}</span>
                  <span className="text-[7.5px] uppercase tracking-wider text-neutral-300 font-sans">Hari</span>
                </div>
                <span className="text-[#caa472] font-bold text-base -mt-2">:</span>
                <div className="bg-[#2d070d] px-2.5 py-1.5 rounded-lg border border-[#caa472]/40 text-center min-w-[50px]">
                  <span className="text-lg font-bold text-[#fce8cf] block leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[7.5px] uppercase tracking-wider text-neutral-300 font-sans">Jam</span>
                </div>
                <span className="text-[#caa472] font-bold text-base -mt-2">:</span>
                <div className="bg-[#2d070d] px-2.5 py-1.5 rounded-lg border border-[#caa472]/40 text-center min-w-[50px]">
                  <span className="text-lg font-bold text-[#fce8cf] block leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[7.5px] uppercase tracking-wider text-neutral-300 font-sans">Menit</span>
                </div>
                <span className="text-[#caa472] font-bold text-base -mt-2">:</span>
                <div className="bg-[#2d070d] px-2.5 py-1.5 rounded-lg border border-[#caa472]/40 text-center min-w-[50px]">
                  <span className="text-lg font-bold text-[#9ae6b4] block leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[7.5px] uppercase tracking-wider text-neutral-300 font-sans">Detik</span>
                </div>
              </div>
            </motion.div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 2: SALAM & MEMPELAI (Laser-cut Arched Lace Card on Green Silk) */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-4 py-12 overflow-hidden flex flex-col items-center"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgGreenDraped})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Laser-Cut White Arched Lace Frame Card */}
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[360px] aspect-[800/1299] mx-auto filter drop-shadow-2xl"
            >
              <img
                src={LACE10_ASSETS.laceArchGreen}
                alt="Lace Arch Frame"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />
              <div className="relative z-20 w-full h-full pt-[12%] pb-[17%] px-[13%] flex flex-col items-center justify-evenly text-center select-none">
                {/* Bismillah Calligraphy */}
                <div className="w-[75%] max-w-[170px]">
                  <svg viewBox="0 0 300 80" className="w-full h-auto fill-[#7a1827]">
                    <text
                      x="150"
                      y="50"
                      textAnchor="middle"
                      className="font-serif text-[32px] font-bold fill-[#7a1827]"
                    >
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </text>
                  </svg>
                </div>

                {/* Greeting */}
                <div className="my-0">
                  <p className="text-[10px] sm:text-[11px] font-serif text-[#2a2a2a] leading-tight font-bold">
                    Assalamualaikum Warahmatullahi Wabarakatuh
                  </p>
                  <p className="text-[8px] sm:text-[8.5px] text-[#4a4a4a] font-sans leading-tight mt-0.5 max-w-[230px] mx-auto">
                    Tanpa mengurangi rasa hormat kami, dengan memohon Rahmat dan Ridho Allah SWT, kami mengundang Anda untuk menjadi bagian dari hari bahagia kami:
                  </p>
                </div>

                {/* Bride Profile */}
                <div className="my-0">
                  <h2
                    className="text-2xl sm:text-[26px] text-[#7a1827] tracking-wide leading-tight"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    {brideName}
                  </h2>
                  {Boolean(brideFather || brideMother) && (
                    <p className="text-[8px] sm:text-[8.5px] text-[#555] font-sans mt-0.5">
                      Putri dari {brideFather}{Boolean(brideFather && brideMother) ? " dan " : ""}{brideMother}
                    </p>
                  )}
                </div>

                {/* Ampersand Divider */}
                <span className="text-sm text-[#7a1827] font-serif italic my-0 leading-none">&amp;</span>

                {/* Groom Profile */}
                <div className="my-0">
                  <h2
                    className="text-2xl sm:text-[26px] text-[#7a1827] tracking-wide leading-tight"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    {groomName}
                  </h2>
                  {Boolean(groomFather || groomMother) && (
                    <p className="text-[8px] sm:text-[8.5px] text-[#555] font-sans mt-0.5">
                      Putra dari {groomFather}{Boolean(groomFather && groomMother) ? " dan " : ""}{groomMother}
                    </p>
                  )}
                </div>

                {/* Closing blessing text (Safely inside inner cream area, above lace bottom) */}
                <p className="text-[8px] sm:text-[8.5px] text-[#555] font-sans leading-tight italic max-w-[220px] mx-auto pb-1">
                  Kehadiran serta doa restu Anda akan sangat berarti bagi perjalanan kami
                </p>
              </div>
            </motion.div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 3: EVENT DETAILS (Akad & Resepsi Cards on Green Silk)         */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-5 py-12 flex flex-col items-center gap-6 overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgGreenDraped})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Top Card: Akad Nikah (Notched Corner Vintage Card) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7 }}
              className="relative w-full max-w-sm bg-[#f8f4ed] text-[#3d1017] rounded-2xl p-6 border-2 border-[#7a1827] shadow-2xl text-center"
            >
              {/* Corner Flower Accent */}
              <img
                src={LACE10_ASSETS.flowerRedDahlia}
                alt="Flower"
                className="absolute -top-4 -right-4 w-12 h-12 object-contain"
              />
              <img
                src={LACE10_ASSETS.flowerRoseBouquet}
                alt="Flower"
                className="absolute -bottom-4 -left-4 w-14 h-auto object-contain pointer-events-none"
              />

              {/* Label Pill */}
              <div className="inline-block px-5 py-1 rounded-full bg-[#f1e6d4] border border-[#c49a6c] text-[#7a1827] text-xs font-serif font-bold uppercase tracking-widest mb-3">
                {akadEvent.custom_label || 'Akad Nikah'}
              </div>

              <p className="text-sm font-serif text-[#42111a] font-semibold">
                {akadDateFormatted.fullText}
              </p>
              <p className="text-xs font-sans text-[#7a1827] font-bold mt-1 mb-2">
                {akadEvent.event_time || '09.00 WIB'}
              </p>
              <p className="text-xs font-serif text-[#42111a] font-bold">
                {akadEvent.venue_name}
              </p>
              <p className="text-[11px] text-neutral-600 font-sans leading-relaxed mt-0.5">
                {akadEvent.venue_address}
              </p>
            </motion.div>

            {/* Bottom Row: Venue Photo Card & Resepsi Arched Card */}
            <div className="w-full max-w-sm grid grid-cols-2 gap-4 items-stretch">
              {/* Left: Venue / Location Photo with Ribbon */}
              <motion.div
                initial={{ opacity: 0, x: -25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.7 }}
                className="relative bg-[#f8f4ed] rounded-xl p-2 border border-[#7a1827] shadow-xl flex flex-col items-center"
              >
                <div className="w-full h-36 rounded-lg overflow-hidden border border-[#d6b797]">
                  <img
                    src={akadEvent.venue_photo_url || LACE10_ASSETS.defaultPhotos.venueAkad}
                    alt="Venue Photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <img
                  src={LACE10_ASSETS.redRibbonBow}
                  alt="Bow"
                  className="absolute -bottom-3 -right-2 w-9 h-auto object-contain"
                />
              </motion.div>

              {/* Right: Resepsi Arched Card with Wax Seal */}
              <motion.div
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.7 }}
                className="relative bg-[#f8f4ed] text-[#3d1017] rounded-t-full rounded-b-xl p-4 pt-6 border border-[#7a1827] shadow-xl text-center flex flex-col items-center justify-between"
              >
                {/* Wax seal at top arch */}
                <img
                  src={LACE10_ASSETS.waxSealRose}
                  alt="Wax Seal"
                  className="w-8 h-8 object-contain -mt-2 mb-1"
                />

                <div className="inline-block px-3 py-0.5 rounded-full bg-[#f1e6d4] border border-[#c49a6c] text-[#7a1827] text-[11px] font-serif font-bold uppercase tracking-wider mb-2">
                  {resepsiEvent.custom_label || 'Resepsi'}
                </div>

                <div>
                  <p className="text-[11px] font-serif font-semibold text-[#42111a]">
                    {resepsiDateFormatted.fullText}
                  </p>
                  <p className="text-[10px] font-sans text-[#7a1827] font-bold my-0.5">
                    {resepsiEvent.event_time || '08.30 WIB - Selesai'}
                  </p>
                  <p className="text-[10px] text-neutral-600 font-sans leading-tight">
                    {resepsiEvent.venue_name}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Google Calendar Link Button */}
            <motion.a
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Pernikahan+${encodeURIComponent(brideNickname)}+%26+${encodeURIComponent(groomNickname)}&dates=${formattedYear}${formattedMonthNum}${formattedDateNum}T020000Z/${formattedYear}${formattedMonthNum}${formattedDateNum}T090000Z&details=Pernikahan+${encodeURIComponent(brideName)}+dan+${encodeURIComponent(groomName)}&location=${encodeURIComponent(akadEvent.venue_name || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1b0407] text-[#f8f4ed] text-xs font-sans uppercase tracking-[0.2em] border border-[#c49a6c]/60 shadow-lg hover:bg-[#851c2d] transition-colors"
            >
              <span>Simpan ke Kalender</span>
            </motion.a>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 4: THE BRIDE & GROOM (Scalloped Lace Portrait Frames)         */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-5 py-14 flex flex-col items-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedVelvet})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-1 z-10"
            >
              <h2
                className="text-4xl sm:text-5xl text-[#f5ebd8] text-center"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
              >
                The Bride &amp; Groom
              </h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#caa472] mt-1 font-serif">
                Pasangan Mempelai
              </p>
            </motion.div>

            {/* Pearl Rope Bow Divider */}
            <img
              src={LACE10_ASSETS.pearlBeadBow}
              alt="Pearl Bow"
              className="w-36 h-auto object-contain my-3 opacity-90"
            />

            {/* 2 Portrait Cards with Scalloped Lace Frame & Details */}
            <div className="w-full flex flex-col items-center gap-10 mt-4 z-10">
              {/* Mempelai Wanita */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.7 }}
                  className="relative w-64 h-88 rounded-3xl p-3 bg-[#fdfaf5] shadow-2xl flex items-center justify-center cursor-pointer group overflow-hidden border border-[#e8d7c3]"
                  onClick={() => setLightboxImg(project?.bride_photo_url || rawGallery[4] || LACE10_ASSETS.defaultPhotos.bridePortrait1)}
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-neutral-900">
                    <img
                      src={project?.bride_photo_url || rawGallery[4] || LACE10_ASSETS.defaultPhotos.bridePortrait1}
                      alt="Bride Portrait"
                      className="w-full h-full object-cover object-[center_20%] group-hover:scale-[1.03] transition-transform duration-500"
                      style={{ objectPosition: "center 20%" }}
                    />
                  </div>
                  <img
                    src={LACE10_ASSETS.laceScallopFrame}
                    alt="Lace Border"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 filter drop-shadow-sm"
                  />
                </motion.div>
                <div className="text-center mt-3 max-w-xs">
                  <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-[#d4af37] font-semibold block">
                    The Bride
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#f5ebd8] tracking-wide mt-0.5"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    {brideName}
                  </h3>
                  {Boolean(brideFather || brideMother) && (
                    <p className="text-[11px] text-[#e5c7a9] font-sans mt-1">
                      Putri dari {brideFather}{Boolean(brideFather && brideMother) ? " & " : ""}{brideMother}
                    </p>
                  )}
                  {project?.bride_instagram && (
                    <a
                      href={`https://instagram.com/${project.bride_instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#caa472] hover:underline mt-1.5 font-sans"
                    >
                      <span>@{project.bride_instagram.replace(/^@/, "")}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Mempelai Pria */}
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.7 }}
                  className="relative w-64 h-88 rounded-3xl p-3 bg-[#fdfaf5] shadow-2xl flex items-center justify-center cursor-pointer group overflow-hidden border border-[#e8d7c3]"
                  onClick={() => setLightboxImg(project?.groom_photo_url || rawGallery[5] || LACE10_ASSETS.defaultPhotos.bridePortrait2)}
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-neutral-900">
                    <img
                      src={project?.groom_photo_url || rawGallery[5] || LACE10_ASSETS.defaultPhotos.bridePortrait2}
                      alt="Groom Portrait"
                      className="w-full h-full object-cover object-[center_20%] group-hover:scale-[1.03] transition-transform duration-500"
                      style={{ objectPosition: "center 20%" }}
                    />
                  </div>
                  <img
                    src={LACE10_ASSETS.laceScallopFrame}
                    alt="Lace Border"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 filter drop-shadow-sm"
                  />
                </motion.div>
                <div className="text-center mt-3 max-w-xs">
                  <span className="text-[10px] uppercase font-serif tracking-[0.25em] text-[#d4af37] font-semibold block">
                    The Groom
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#f5ebd8] tracking-wide mt-0.5"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    {groomName}
                  </h3>
                  {Boolean(groomFather || groomMother) && (
                    <p className="text-[11px] text-[#e5c7a9] font-sans mt-1">
                      Putra dari {groomFather}{Boolean(groomFather && groomMother) ? " & " : ""}{groomMother}
                    </p>
                  )}
                  {project?.groom_instagram && (
                    <a
                      href={`https://instagram.com/${project.groom_instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#caa472] hover:underline mt-1.5 font-sans"
                    >
                      <span>@{project.groom_instagram.replace(/^@/, "")}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Pearl Rope Bow Divider bottom */}
            <img
              src={LACE10_ASSETS.pearlBeadBow}
              alt="Pearl Bow"
              className="w-36 h-auto object-contain mt-8 opacity-90"
            />
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 5: KUTIPAN AYAT SUCI (Baroque Lace Mirror Frame)               */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-4 py-12 flex flex-col items-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedVelvet})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Baroque Ornate Lace Arch Card */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[340px] aspect-[800/997] mx-auto filter drop-shadow-2xl flex items-center justify-center"
            >
              <img
                src={LACE10_ASSETS.baroqueArchQuran}
                alt="Baroque Frame"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />
              <div className="relative z-20 w-full h-full pt-[22%] pb-[14%] px-[16%] flex flex-col items-center justify-center text-center select-none">
                <p className="text-xs sm:text-sm font-serif italic text-[#3d1017] leading-relaxed mb-4">
                  &ldquo;{project?.quote_translation || project?.love_story || "Allah menciptakan pasangan dari diri manusia agar merasa tenteram, serta menjadikan rasa cinta dan kasih sayang di antara mereka"}&rdquo;
                </p>
                <p className="text-[10px] sm:text-[11px] font-serif uppercase tracking-[0.2em] text-[#7a1827] font-semibold">
                  {project?.quote_source || ((project?.religion === "kristen" || project?.religion === "katolik") ? "1 Korintus 13:4-7" : "Qs. (Ar-Rum) - Ayat 21")}
                </p>
              </div>
            </motion.div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 6: EDITORIAL PHOTO MOSAIC (Full Width BG)                     */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-4 py-12 flex flex-col items-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedCurtain})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            <div className="relative z-10 w-full max-w-[400px] grid grid-cols-3 gap-2">
              {rawGallery.slice(0, 9).map((photo: string, idx: number) => {
                const isSpan2 = idx === 0 || idx === 4;
                return (
                  <motion.div
                    key={`gal-${idx}`}
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.5, delay: (idx % 3) * 0.08 }}
                    onClick={() => setLightboxImg(photo)}
                    className={`relative rounded-lg overflow-hidden border border-[#d6b797]/60 shadow-md cursor-pointer group ${
                      isSpan2 ? 'col-span-2 h-44 sm:h-48' : 'col-span-1 h-32 sm:h-36'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ objectPosition: 'center 24%' }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 7: OUR MOMENT (Full Width Velvet BG & Clean Transparent Doves) */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-5 py-14 flex flex-col items-center text-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedCurtain})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark luxury vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1f0307]/75 via-transparent to-[#1f0307]/80 pointer-events-none" />

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 text-4xl sm:text-5xl text-[#f5ebd8] mb-4 drop-shadow-md"
              style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
            >
              Our Moment
            </motion.h2>

            {/* Casual Polaroids / Candids Collage (5 Photos prioritized from user's gallery) */}
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-3 my-4">
              {/* Photo 1: Top Wide Polaroid */}
              {getCandidPhoto(0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.6 }}
                  onClick={() => setLightboxImg(getCandidPhoto(0))}
                  className="w-[82%] bg-[#f8f4ed] p-2 pb-6 shadow-2xl rounded-xs border border-[#caa472]/40 transform rotate-[1deg] hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="w-full aspect-[4/3] overflow-hidden rounded-xs bg-neutral-900">
                    <img
                      src={getCandidPhoto(0)}
                      alt="Moment 1"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: 'center 24%' }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Row 2: Two Polaroids */}
              <div className="w-full flex items-center justify-center gap-3">
                {getCandidPhoto(1) && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    onClick={() => setLightboxImg(getCandidPhoto(1))}
                    className="w-[46%] bg-[#f8f4ed] p-1.5 pb-5 shadow-xl rounded-xs border border-[#caa472]/40 transform -rotate-[4deg] hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div className="w-full aspect-[3/4] overflow-hidden rounded-xs bg-neutral-900">
                      <img
                        src={getCandidPhoto(1)}
                        alt="Moment 2"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 24%' }}
                      />
                    </div>
                  </motion.div>
                )}
                {getCandidPhoto(2) && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    onClick={() => setLightboxImg(getCandidPhoto(2))}
                    className="w-[46%] bg-[#f8f4ed] p-1.5 pb-5 shadow-xl rounded-xs border border-[#caa472]/40 transform rotate-[3deg] hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div className="w-full aspect-[4/3] overflow-hidden rounded-xs bg-neutral-900">
                      <img
                        src={getCandidPhoto(2)}
                        alt="Moment 3"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 24%' }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Row 3: Two Polaroids overlapping */}
              <div className="w-full flex items-center justify-center -space-x-4 mt-1">
                {getCandidPhoto(3) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    onClick={() => setLightboxImg(getCandidPhoto(3))}
                    className="w-[48%] bg-[#f8f4ed] p-1.5 pb-5 shadow-xl rounded-xs border border-[#caa472]/40 transform rotate-[2deg] hover:scale-105 transition-transform cursor-pointer z-10"
                  >
                    <div className="w-full aspect-[3/4] overflow-hidden rounded-xs bg-neutral-900">
                      <img
                        src={getCandidPhoto(3)}
                        alt="Moment 4"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 24%' }}
                      />
                    </div>
                  </motion.div>
                )}
                {getCandidPhoto(4) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.6 }}
                    onClick={() => setLightboxImg(getCandidPhoto(4))}
                    className="w-[48%] bg-[#f8f4ed] p-1.5 pb-5 shadow-xl rounded-xs border border-[#caa472]/40 transform -rotate-[3deg] hover:scale-105 transition-transform cursor-pointer z-20"
                  >
                    <div className="w-full aspect-[3/4] overflow-hidden rounded-xs bg-neutral-900">
                      <img
                        src={getCandidPhoto(4)}
                        alt="Moment 5"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 24%' }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Two Doves Carrying Ribbon (Clean Transparent PNG without black box) */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 0.95, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7 }}
              className="relative z-10 w-44 h-auto my-6 filter drop-shadow-md"
            >
              <img
                src={LACE10_ASSETS.dovesFlightRibbon}
                alt="Two Doves"
                className="w-full h-auto object-contain opacity-95"
              />
            </motion.div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 7.5: OUR LOVE STORY (Timeline Perjalanan Cinta)               */}
          {/* --------------------------------------------------------------------- */}
          {loveStoryData && loveStoryData.length > 0 && (
            <TimelineSection
              loveStoryItems={loveStoryData}
              groomName={groomNickname}
              brideName={brideNickname}
            />
          )}

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 8: RUNDOWN ACARA (Floating Ivory Cards with Red Velvet & Car) */}
          {/* --------------------------------------------------------------------- */}
          {(() => {
            const rawList = (Array.isArray((project as any)?.dining_schedule) && (project as any).dining_schedule.length > 0)
              ? (project as any).dining_schedule
              : (Array.isArray((project as any)?.rundown) && (project as any).rundown.length > 0)
              ? (project as any).rundown
              : null;

            if (!rawList || rawList.length === 0) return null;

            // Sanitize: strip out day/date strings in parentheses e.g. "(Jum'at, 27 Nov)", "(Selasa, 28 Nov)", "(Sabtu, 28 Nov)"
            // and filter out empty items where neither title nor time is filled
            const rundownList = rawList
              .map((item: any) => {
                const rawTitle = typeof item?.title === "string" ? item.title : "";
                const cleanTitle = rawTitle.replace(/\s*\([^)]*\)/g, "").trim();
                const cleanTime = typeof item?.time === "string" ? item.time.trim() : "";
                return {
                  ...item,
                  time: cleanTime,
                  title: cleanTitle || rawTitle
                };
              })
              .filter((item: any) => item.title || item.time);

            if (rundownList.length === 0) return null;

            return (
              <section
                className="relative w-full px-5 py-14 flex flex-col items-center text-center overflow-hidden"
                style={{
                  backgroundImage: `url(${LACE10_ASSETS.bgRedVelvet})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Dark luxury vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1f0307]/75 via-transparent to-[#1f0307]/80 pointer-events-none" />

                {/* Header with entrance animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.6 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <h3
                    className="text-4xl sm:text-5xl text-[#f5ebd8] mb-1 drop-shadow-md"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    Rundown Acara
                  </h3>
                  <img
                    src={LACE10_ASSETS.rundownWavyLine}
                    alt="Wavy Line"
                    className="w-44 h-auto object-contain my-3 opacity-80"
                  />
                </motion.div>

                {/* Timeline Schedule Cards with Luxury Borders */}
                <div className="relative z-10 w-full max-w-sm flex flex-col gap-3.5 mt-4 text-[#f8f4ed]">
                  {rundownList.map((item: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ duration: 0.45, delay: idx * 0.08 }}
                      className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#fdfaf5]/95 border-2 border-[#caa472] shadow-xl text-[#3d1017] hover:scale-[1.01] transition-transform"
                    >
                      <span className="px-3.5 py-1.5 rounded-full bg-[#7a1827] text-white text-[11px] sm:text-xs font-sans font-bold tracking-wider shadow shrink-0">
                        {item.time}
                      </span>
                      <span className="text-xs sm:text-sm font-serif font-bold text-[#42111a] text-right ml-3 pr-1">
                        {item.title}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Bottom Getaway Wedding Car Illustration */}
                <motion.div
                  initial={{ opacity: 0, y: 25, scale: 0.95 }}
                  whileInView={{ opacity: 0.85, y: 0, scale: 1 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.7 }}
                  className="relative z-10 w-40 sm:w-44 h-auto mt-8 opacity-85 filter drop-shadow invert"
                >
                  <img
                    src={LACE10_ASSETS.weddingCarGetaway}
                    alt="Wedding Car"
                    className="w-full h-auto object-contain"
                  />
                </motion.div>
              </section>
            );
          })()}

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 8.5: TURUT MENGUNDANG (Full Width Red Curtain & Vintage Card)  */}
          {/* --------------------------------------------------------------------- */}
          {(() => {
            const rawTurut = (project as any)?.turut_mengundang;
            const brideFamily = Array.isArray(rawTurut?.bride_family)
              ? rawTurut.bride_family
              : Array.isArray(rawTurut?.wanita)
              ? rawTurut.wanita
              : [];
            const groomFamily = Array.isArray(rawTurut?.groom_family)
              ? rawTurut.groom_family
              : Array.isArray(rawTurut?.pria)
              ? rawTurut.pria
              : [];
            const genericList = Array.isArray(rawTurut) ? rawTurut : [];

            const hasTurutData = brideFamily.length > 0 || groomFamily.length > 0 || genericList.length > 0;
            if (!hasTurutData) return null;

            return (
              <section
                className="relative w-full px-5 py-14 flex flex-col items-center text-center overflow-hidden"
                style={{
                  backgroundImage: `url(${LACE10_ASSETS.bgRedCurtain})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Dark luxury vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1f0307]/80 via-[#26050b]/65 to-[#1f0307]/85 pointer-events-none" />

                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.6 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <h3
                    className="text-4xl sm:text-5xl text-[#f5ebd8] mb-1 drop-shadow-md"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    Turut Mengundang
                  </h3>
                  <img
                    src={LACE10_ASSETS.flourishDivider2}
                    alt="Divider"
                    className="w-44 h-auto object-contain my-3 opacity-80"
                  />

                  <p className="text-xs text-[#e8cfb5] font-sans max-w-xs leading-relaxed mb-6 italic">
                    Ungkapan terima kasih yang tulus dari segenap keluarga besar kedua mempelai:
                  </p>
                </motion.div>

                <div className="relative z-10 w-full max-w-sm flex flex-col gap-4">
                  {/* Mempelai Wanita Column */}
                  {brideFamily.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ duration: 0.6 }}
                      className="rounded-2xl bg-[#fdfaf5]/95 border-2 border-[#caa472] p-5 shadow-2xl text-left"
                    >
                      <div className="flex items-center gap-2 border-b border-[#caa472]/40 pb-2.5 mb-3">
                        <span className="w-2 h-2 rounded-full bg-[#7a1827]" />
                        <h4 className="font-serif font-bold text-sm text-[#42111a] uppercase tracking-wider">
                          Keluarga Mempelai Wanita ({brideNickname})
                        </h4>
                      </div>
                      <ul className="space-y-1.5 text-xs font-serif text-[#3d1017]">
                        {brideFamily.map((person: string, idx: number) => (
                          <li key={`bf-${idx}`} className="flex items-start gap-2">
                            <span className="text-[#caa472] text-[11px] font-bold shrink-0">{idx + 1}.</span>
                            <span className="font-medium">{person}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Mempelai Pria Column */}
                  {groomFamily.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ duration: 0.6 }}
                      className="rounded-2xl bg-[#fdfaf5]/95 border-2 border-[#caa472] p-5 shadow-2xl text-left"
                    >
                      <div className="flex items-center gap-2 border-b border-[#caa472]/40 pb-2.5 mb-3">
                        <span className="w-2 h-2 rounded-full bg-[#7a1827]" />
                        <h4 className="font-serif font-bold text-sm text-[#42111a] uppercase tracking-wider">
                          Keluarga Mempelai Pria ({groomNickname})
                        </h4>
                      </div>
                      <ul className="space-y-1.5 text-xs font-serif text-[#3d1017]">
                        {groomFamily.map((person: string, idx: number) => (
                          <li key={`gf-${idx}`} className="flex items-start gap-2">
                            <span className="text-[#caa472] text-[11px] font-bold shrink-0">{idx + 1}.</span>
                            <span className="font-medium">{person}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}

                  {/* Generic List if flat array */}
                  {genericList.length > 0 && brideFamily.length === 0 && groomFamily.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{ duration: 0.6 }}
                      className="rounded-2xl bg-[#fdfaf5]/95 border-2 border-[#caa472] p-5 shadow-2xl text-left"
                    >
                      <ul className="space-y-1.5 text-xs font-serif text-[#3d1017]">
                        {genericList.map((item: any, idx: number) => (
                          <li key={`gen-${idx}`} className="flex items-start gap-2">
                            <span className="text-[#caa472] text-[11px] font-bold shrink-0">•</span>
                            <span className="font-medium">{typeof item === 'string' ? item : item.name || JSON.stringify(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              </section>
            );
          })()}

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 9: WEDDING GIFT (Full Width Satin Draped BG)                   */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-5 py-14 flex flex-col items-center text-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedSatinDraped})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark luxury vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1b0307]/80 via-transparent to-[#1b0307]/80 pointer-events-none" />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="relative z-10 flex flex-col items-center"
            >
              <h2 className="text-3xl font-serif text-[#f5ebd8] uppercase tracking-wider mb-2 drop-shadow">
                Wedding Gift
              </h2>
              <p className="text-xs text-[#e8cfb5] font-sans max-w-xs leading-relaxed mb-6">
                Bagi keluarga dan rekan yang ingin memberikan tanda kasih untuk kami, dapat menyalurkannya melalui rekening / e-wallet di bawah ini:
              </p>
            </motion.div>

            {/* ATM / Bank Cards Redesigned Luxury Royal Card */}
            <div className="relative z-10 w-full max-w-xs flex flex-col gap-5">
              {bankAccounts.map((acc: any, idx: number) => {
                const isCopied = copiedBank === (acc.bank_name || `bank-${idx}`);
                const isEwallet = acc.type === 'ewallet' || ['dana', 'gopay', 'ovo', 'shopeepay', 'linkaja'].includes((acc.bank_name || '').toLowerCase());

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 25, scale: 0.98 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: false, amount: 0.15 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    className="relative w-full rounded-2xl bg-gradient-to-br from-[#2a060d] via-[#1a0307] to-[#120104] text-[#f7eee1] p-5 shadow-[0_15px_30px_rgba(0,0,0,0.7)] border border-[#caa472]/60 overflow-hidden text-left"
                  >
                    {/* Metallic Gold Sheen & Watermark Background */}
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-[#caa472]/15 to-transparent blur-xl pointer-events-none" />
                    <div className="absolute inset-0 bg-[radial-gradient(#caa472_0.5px,transparent_0.5px)] [background-size:12px_12px] opacity-10 pointer-events-none" />

                    {/* Header: Chip, Contactless Wave, and Bank/Wallet Badge */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2.5">
                        {/* Realistic Gold EMV Chip */}
                        <div className="w-10 h-7 rounded bg-gradient-to-br from-[#edd59e] via-[#d4af37] to-[#997328] p-0.5 shadow-md border border-[#fff2c6]/60 flex items-center justify-center relative overflow-hidden">
                          <div className="w-full h-full border border-amber-900/35 rounded-xs flex flex-col justify-between p-0.5">
                            <div className="h-px bg-amber-900/30 w-full" />
                            <div className="h-px bg-amber-900/30 w-full" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" />
                        </div>

                        {/* Contactless Waves Icon */}
                        <svg className="w-4 h-4 text-[#caa472]/80 rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12.55a11 11 0 0 1 14.08 0" strokeLinecap="round" />
                          <path d="M8.5 15.5a6 6 0 0 1 7 0" strokeLinecap="round" />
                          <path d="M11.5 18.5a1.5 1.5 0 0 1 1 0" strokeLinecap="round" />
                        </svg>
                      </div>

                      {/* Bank / Wallet Name Badge */}
                      <span className="font-serif font-black text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#f5ebd8] via-[#e8cfb5] to-[#caa472] tracking-wider uppercase drop-shadow">
                        {acc.bank_name}
                      </span>
                    </div>

                    {/* Middle: Number */}
                    <div className="my-4 relative z-10">
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#caa472] font-serif block mb-1">
                        {isEwallet ? 'No. e-Wallet' : 'No. Rekening'}
                      </span>
                      <p className="font-mono text-lg sm:text-xl font-bold text-[#fff7eb] tracking-[0.14em] drop-shadow-sm select-all">
                        {acc.account_number}
                      </p>
                    </div>

                    {/* Footer: Cardholder Name & Copy Button */}
                    <div className="flex items-end justify-between relative z-10 pt-2 border-t border-[#caa472]/20">
                      <div>
                        <span className="text-[8px] uppercase tracking-[0.2em] text-[#caa472]/80 font-serif block">
                          Atas Nama
                        </span>
                        <p className="text-xs sm:text-sm font-serif font-semibold text-[#f5ebd8] tracking-wide mt-0.5">
                          {acc.account_holder}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.account_number, acc.bank_name || `bank-${idx}`)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider transition-all duration-300 shadow-md flex items-center gap-1.5 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white border border-emerald-400'
                            : 'bg-gradient-to-r from-[#d4af37] via-[#edd59e] to-[#caa472] text-[#200408] hover:brightness-110 active:scale-95'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Tersalin ✓</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 10: LOCATION & MAPS (Full Width Velvet BG)                     */}
          {/* --------------------------------------------------------------------- */}
          {(() => {
            const hasSeparateVenues = Boolean(
              resepsiEvent && 
              resepsiEvent.venue_name && 
              akadEvent.venue_name && 
              resepsiEvent.venue_name.trim().toLowerCase() !== akadEvent.venue_name.trim().toLowerCase()
            );
            const currentEvent = (hasSeparateVenues && activeMapTab === 'resepsi') ? resepsiEvent : akadEvent;

            return (
              <section
                className="relative w-full px-5 py-14 flex flex-col items-center text-center overflow-hidden"
                style={{
                  backgroundImage: `url(${LACE10_ASSETS.bgRedVelvet})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Dark luxury vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1b0307]/80 via-transparent to-[#1b0307]/80 pointer-events-none" />

                {/* Header with entrance animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.6 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <h2 className="text-3xl font-serif text-[#f5ebd8] uppercase tracking-wider mb-2 drop-shadow">
                    Location
                  </h2>
                  <img
                    src={LACE10_ASSETS.flourishDivider2}
                    alt="Divider"
                    className="w-48 h-auto object-contain my-2 opacity-80"
                  />
                </motion.div>

                {/* Switcher if Akad & Resepsi are in different venues */}
                {hasSeparateVenues && (
                  <div className="relative z-10 flex items-center justify-center gap-1.5 p-1 bg-[#1b0407]/90 rounded-full border border-[#caa472]/60 shadow-lg mb-4 mt-1">
                    <button
                      type="button"
                      onClick={() => setActiveMapTab('akad')}
                      className={`px-4 py-1.5 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
                        activeMapTab === 'akad'
                          ? 'bg-[#821c2c] text-white shadow'
                          : 'text-[#e8cfb5] hover:text-white'
                      }`}
                    >
                      {akadEvent.custom_label || 'Lokasi Akad'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMapTab('resepsi')}
                      className={`px-4 py-1.5 rounded-full text-xs font-serif font-bold transition-all cursor-pointer ${
                        activeMapTab === 'resepsi'
                          ? 'bg-[#821c2c] text-white shadow'
                          : 'text-[#e8cfb5] hover:text-white'
                      }`}
                    >
                      {resepsiEvent.custom_label || 'Lokasi Resepsi'}
                    </button>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <p className="text-sm font-serif font-bold text-[#f5ebd8] mt-2 mb-1">
                    {currentEvent.venue_name}
                  </p>
                  <p className="text-xs text-[#e8cfb5] font-sans max-w-xs leading-relaxed mb-6">
                    {currentEvent.venue_address}
                  </p>
                </motion.div>

                {/* Google Maps Preview Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 25 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.7 }}
                  className="relative z-10 w-full max-w-xs h-56 rounded-2xl overflow-hidden border-2 border-[#caa472] shadow-2xl bg-neutral-900"
                >
                  <iframe
                    title="Venue Location"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(currentEvent.venue_address || currentEvent.venue_name || 'Batulawang')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </motion.div>

                <motion.a
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ duration: 0.5 }}
                  href={currentEvent.venue_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentEvent.venue_address || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#821c2c] text-white text-xs font-sans uppercase tracking-[0.2em] shadow-lg hover:bg-[#5c1320] transition-colors border border-[#caa472]/60"
                >
                  <span>Buka Google Maps</span>
                </motion.a>
              </section>
            );
          })()}

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 11: RSVP & BLESSING WALL (Full Width Curtain BG)              */}
          {/* --------------------------------------------------------------------- */}
          <section
            id="rsvp-section"
            className="relative w-full px-5 py-16 flex flex-col items-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedCurtain})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark luxury vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1b0307]/85 via-[#1b0307]/75 to-[#1b0307]/95 pointer-events-none" />

            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7 }}
              className="relative z-10 flex flex-col items-center text-center mb-6"
            >
              <span className="text-[10px] tracking-[0.35em] text-[#caa472] uppercase font-serif font-bold mb-1">
                The Honor of Your Presence
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#f5ebd8] uppercase tracking-[0.16em] drop-shadow-md">
                Konfirmasi Kehadiran
              </h2>
              <p
                className="text-2xl text-[#d4af37] font-normal my-1 drop-shadow"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
              >
                Kindly RSVP &amp; Celebrate With Us
              </p>
              <img
                src={LACE10_ASSETS.rundownWavyLine}
                alt="Divider"
                className="w-36 h-auto opacity-75 my-2"
              />
              <p className="text-xs text-[#e8cfb5]/90 font-sans text-center max-w-xs leading-relaxed mt-1">
                Mohon konfirmasi kehadiran Anda untuk membantu kami mempersiapkan jamuan terbaik bagi seluruh keluarga &amp; sahabat tercinta.
              </p>
            </motion.div>

            {/* RSVP Card with Layered Floral Accessories */}
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full max-w-sm mx-auto my-4"
            >
              {/* Botanical Floral Accent Top-Right (Behind/Flanking Card) */}
              <div className="absolute -top-12 -right-8 w-28 sm:w-32 h-auto pointer-events-none z-20 filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.65)] rotate-12">
                <img
                  src={LACE10_ASSETS.flowerRoseBouquet}
                  alt="Floral Accent"
                  className="w-full h-auto object-contain select-none"
                />
              </div>

              {/* Blooming Red Dahlia Bottom-Left (Foreground Layer Over Card Edge) */}
              <div className="absolute -bottom-8 -left-7 w-24 sm:w-28 h-auto pointer-events-none z-20 filter drop-shadow-[0_10px_22px_rgba(0,0,0,0.7)] -rotate-6">
                <img
                  src={LACE10_ASSETS.flowerRedDahlia}
                  alt="Dahlia Bloom"
                  className="w-full h-auto object-contain select-none"
                />
              </div>

              {/* Main RSVP Card Form */}
              <form
                onSubmit={handleRsvpSubmit}
                className="relative z-10 w-full bg-gradient-to-b from-[#fdfbf7] via-[#f7f2ea] to-[#eee5d8] text-[#42111a] p-6 sm:p-7 rounded-[32px] shadow-[0_22px_55px_rgba(0,0,0,0.55)] border-2 border-[#caa472] ring-1 ring-[#caa472]/40 flex flex-col gap-4 overflow-hidden"
              >
                {/* Subtle Luxury Card Header */}
                <div className="flex flex-col items-center text-center pb-3 border-b border-[#caa472]/35">
                  <div className="w-11 h-11 mb-2 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]">
                    <img
                      src={LACE10_ASSETS.waxSealMonogram}
                      alt="Wax Seal"
                      className="w-full h-full object-contain select-none"
                    />
                  </div>
                  <span className="text-[10px] uppercase font-serif tracking-[0.28em] text-[#8c1d2e] font-bold">
                    RESERVASI KEHADIRAN
                  </span>
                  <span className="text-[11px] text-neutral-500 font-sans mt-0.5">
                    Harap mengisi konfirmasi sebelum hari H
                  </span>
                </div>

                {rsvpSubmitted ? (
                  <div className="py-8 px-4 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#821c2c]/10 text-[#821c2c] border border-[#821c2c]/30 flex items-center justify-center mx-auto text-xl font-bold">
                      ✓
                    </div>
                    <p className="text-base font-serif font-bold text-[#821c2c]">
                      Konfirmasi Berhasil Tersimpan!
                    </p>
                    <p className="text-xs text-neutral-600 font-sans max-w-xs mx-auto leading-relaxed">
                      Terima kasih atas konfirmasinya. Kehadiran dan doa restu Anda adalah berkah terindah bagi kami.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Nama Lengkap */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#6b1824]">
                          Nama Lengkap
                        </label>
                        {isNameLocked && (
                          <span className="text-[9px] font-sans font-semibold text-[#821c2c] bg-[#821c2c]/10 px-2 py-0.5 rounded-full border border-[#821c2c]/20">
                            Terkunci (Sesuai Undangan)
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        readOnly={isNameLocked}
                        value={rsvpName}
                        onChange={(e) => {
                          if (!isNameLocked) setRsvpName(e.target.value);
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border border-[#c49a6c]/70 text-xs focus:outline-none transition-all ${
                          isNameLocked
                            ? 'bg-[#ede4d6] text-[#42111a] font-semibold cursor-not-allowed select-none shadow-inner'
                            : 'bg-white text-neutral-800 focus:border-[#821c2c] focus:ring-1 focus:ring-[#821c2c]/30 shadow-sm'
                        }`}
                        placeholder="Nama Tamu"
                        title={isNameLocked ? "Nama terkunci sesuai link undangan Anda" : undefined}
                      />
                    </div>

                    {/* Konfirmasi Kehadiran */}
                    <div>
                      <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#6b1824] block mb-1.5">
                        Konfirmasi Kehadiran
                      </label>
                      <select
                        value={rsvpAttendance}
                        onChange={(e) => setRsvpAttendance(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#c49a6c]/70 text-xs text-neutral-800 bg-white font-medium focus:outline-none focus:border-[#821c2c] focus:ring-1 focus:ring-[#821c2c]/30 shadow-sm cursor-pointer"
                      >
                        <option value="hadir">Hadir</option>
                        <option value="tidak_hadir">Tidak Dapat Hadir</option>
                        <option value="masih_ragu">Masih Ragu</option>
                      </select>
                    </div>

                    {/* Jumlah Tamu Hadir (Maksimal 10) */}
                    {rsvpAttendance === 'hadir' && (
                      <div className="animate-fadeIn">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#6b1824]">
                            Jumlah Tamu
                          </label>
                          <span className="text-[9px] text-neutral-500 font-sans italic">
                            (Maksimal 10 Orang)
                          </span>
                        </div>
                        <select
                          value={rsvpPax}
                          onChange={(e) => setRsvpPax(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border border-[#c49a6c]/70 text-xs text-neutral-800 bg-white font-medium focus:outline-none focus:border-[#821c2c] focus:ring-1 focus:ring-[#821c2c]/30 shadow-sm cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num} Orang
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Tombol Kirim Konfirmasi */}
                    <button
                      type="submit"
                      disabled={isSubmittingRsvp}
                      className="w-full py-3 mt-1.5 rounded-xl bg-gradient-to-r from-[#6b1420] via-[#8c1d2e] to-[#6b1420] text-white text-xs font-serif uppercase tracking-[0.2em] font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg cursor-pointer border border-[#caa472]/70 flex items-center justify-center gap-2"
                    >
                      {isSubmittingRsvp ? 'Mengirim...' : 'Kirim Konfirmasi'}
                    </button>
                  </>
                )}
              </form>
            </motion.div>

            {/* Wishes & Greetings Wall (Doa & Ucapan) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.7 }}
              className="relative z-10 w-full max-w-sm mt-12 flex flex-col items-center"
            >
              <span className="text-[10px] tracking-[0.3em] text-[#caa472] uppercase font-serif font-bold mb-1">
                Warmest Wishes
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif text-[#f5ebd8] uppercase tracking-[0.16em] text-center drop-shadow">
                Doa &amp; Ucapan
              </h3>
              <p
                className="text-xl text-[#d4af37] font-normal mb-5 drop-shadow"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
              >
                Prayers &amp; Blessings For The Couple
              </p>

              {/* Wishes Form Container */}
              <form
                onSubmit={handleWishSubmit}
                className="w-full bg-[#220409]/90 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-[#caa472]/50 shadow-[0_18px_45px_rgba(0,0,0,0.5)] flex flex-col gap-3 relative overflow-hidden"
              >
                <div className="relative">
                  <input
                    type="text"
                    required
                    readOnly={isNameLocked}
                    value={wishName}
                    onChange={(e) => {
                      if (!isNameLocked) setWishName(e.target.value);
                    }}
                    placeholder="Nama Pengirim"
                    className={`w-full px-4 py-2.5 rounded-xl border border-[#caa472]/50 text-xs focus:outline-none transition-all ${
                      isNameLocked
                        ? 'bg-[#150205] text-[#f8f4ed]/90 cursor-not-allowed select-none font-semibold'
                        : 'bg-[#2b040a]/90 text-[#f8f4ed]'
                    }`}
                    title={isNameLocked ? "Nama terkunci sesuai link undangan Anda" : undefined}
                  />
                  {isNameLocked && (
                    <span className="absolute right-3 top-2.5 text-[9px] text-[#caa472]/80 font-sans italic">
                      Terkunci
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="Tuliskan ucapan dan doa terbaik Anda..."
                  className="w-full px-4 py-3 rounded-xl bg-[#140205]/95 border border-[#caa472]/45 text-xs text-[#f8f4ed] placeholder-neutral-400 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]/30 resize-none transition-all"
                />

                <button
                  type="submit"
                  disabled={isSubmittingWish}
                  className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-[#7a1827] via-[#9e2034] to-[#7a1827] text-white text-xs font-serif uppercase tracking-wider font-semibold hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border border-[#caa472]/70 shadow-md"
                >
                  {isSubmittingWish ? 'Mengirim...' : 'Kirim Ucapan'}
                </button>
              </form>

              {/* Wishes List Cards */}
              <div className="w-full max-h-84 overflow-y-auto flex flex-col gap-3 mt-6 pr-1">
                {wishesList.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#200307]/75 border border-[#caa472]/25 text-center">
                    <p className="text-xs text-neutral-300 italic">
                      Belum ada ucapan. Jadilah yang pertama memberikan doa restu!
                    </p>
                  </div>
                ) : (
                  wishesList.map((wish: any, i: number) => {
                    const initials = (wish?.name || 'G')
                      .trim()
                      .split(' ')
                      .slice(0, 2)
                      .map((w: string) => w.charAt(0))
                      .join('')
                      .toUpperCase() || 'G';

                    return (
                      <div
                        key={wish?.id || i}
                        className="p-4 rounded-2xl bg-[#200307]/90 border border-[#caa472]/35 text-left text-xs shadow-md flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7a1827] to-[#42111a] border border-[#caa472]/60 flex items-center justify-center text-[10px] font-bold text-[#f5ebd8] uppercase shrink-0 shadow">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif font-bold text-sm text-[#f5ebd8] truncate">
                            {wish?.name || 'Tamu Undangan'}
                          </p>
                          <p className="text-neutral-300 font-sans mt-1 whitespace-pre-line leading-relaxed">
                            {wish?.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </section>

          {/* Simple, Compact & Elegant Footer */}
          <footer className="w-full text-center pt-7 pb-20 px-4 bg-[#180205] text-[#f5ebd8] border-t border-[#caa472]/30 select-none">
            <div className="flex flex-col items-center max-w-sm mx-auto">
              {/* Subtle gold ornamental divider */}
              <div className="flex items-center justify-center gap-2 mb-2 w-36">
                <span className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#caa472]/60 to-transparent" />
                <span className="text-[#caa472] text-[10px]">✦</span>
                <span className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#caa472]/60 to-transparent" />
              </div>

              {/* Title & Couple Names */}
              <p className="text-[10px] font-serif uppercase tracking-[0.25em] text-[#e8d5be] font-bold">
                The Wedding of {brideNickname} &amp; {groomNickname}
              </p>
              
              {/* Event Date Tag */}
              <p className="text-[9px] font-serif text-[#caa472]/85 tracking-widest mt-0.5">
                {isSeparateDates 
                  ? `${akadDateFormatted.dayName.slice(0, 3)} & ${resepsiDateFormatted.dayName.slice(0, 3)}, ${akadDateFormatted.dateNum} - ${resepsiDateFormatted.dateNum} ${formattedMonthLong} ${formattedYear}`
                  : `${formattedDayName}, ${formattedDateNum} ${formattedMonthLong} ${formattedYear}`}
              </p>

              {/* Clean compact Serastory credit */}
              <div className="mt-3.5 pt-2.5 border-t border-[#caa472]/15 w-40 flex items-center justify-center text-[#caa472]/70 text-[8.5px] tracking-[0.22em] uppercase font-sans">
                <p className="flex items-center gap-1.5">
                  <span>Crafted with</span>
                  <span className="text-rose-400 text-[10px]">♥</span>
                  <span>by</span>
                  <a
                    href="https://serastory.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#f5ebd8] hover:text-[#caa472] transition-colors underline decoration-[#caa472]/30 underline-offset-2"
                  >
                    SERASTORY
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </main>
      )}

      {/* Lightbox Modal for Gallery Photos */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={lightboxImg}
              alt="Fullscreen"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}