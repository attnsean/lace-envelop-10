'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LACE10_ASSETS } from '../../lib/laceAssets';
import { formatPersonName } from '../../lib/format';

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
          x: [0, (i % 2 === 0 ? 30 : -30), 0],
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
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Lightbox Modal
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Extract couple data
  const brideName = formatPersonName(project?.bride_name) || "Yulia Fatimatul Zahra";
  const brideNickname = formatPersonName(project?.bride_nickname) || "Zahra";
  const groomName = formatPersonName(project?.groom_name) || "Sopyan Hidayat";
  const groomNickname = formatPersonName(project?.groom_nickname) || "Sopyan";

  const brideFather = project?.bride_father || "Bapak Hendra Jaya";
  const brideMother = project?.bride_mother || "Ibu Nurul Sa'adah";
  const groomFather = project?.groom_father || "Bapak Atep Sumardi";
  const groomMother = project?.groom_mother || "Ibu Ai Karina";

  const weddingDateStr = project?.wedding_date || "2026-11-09";
  const weddingDate = new Date(weddingDateStr);
  const formattedDayName = weddingDate.toLocaleDateString("id-ID", { weekday: "long" }) || "Senin";
  const formattedDateNum = String(weddingDate.getDate()).padStart(2, "0") || "09";
  const formattedMonthNum = String(weddingDate.getMonth() + 1).padStart(2, "0") || "11";
  const formattedYear = String(weddingDate.getFullYear()) || "2026";
  const formattedMonthLong = weddingDate.toLocaleDateString("id-ID", { month: "long" }) || "November";

  // Event parsing
  const akadEvent = events.find(e => e.event_type?.toLowerCase().includes('akad')) || events[0] || {
    custom_label: 'Akad Nikah',
    event_time: '09.00 WIB',
    venue_name: 'Belakang Aula Desa Batulawang',
    venue_address: 'Jl. Cisereuh, Des. Batulawang, Kec. Cipanas, Kab. Cianjur',
    venue_maps_url: 'https://maps.google.com/?q=Aula+Desa+Batulawang'
  };

  const resepsiEvent = events.find(e => e.event_type?.toLowerCase().includes('resepsi')) || events[1] || {
    custom_label: 'Resepsi',
    event_time: '12.00 - 16.00 WIB',
    venue_name: 'Belakang Aula Desa Batulawang',
    venue_address: 'Jl. Cisereuh, Des. Batulawang, Kec. Cipanas, Kab. Cianjur',
    venue_maps_url: 'https://maps.google.com/?q=Aula+Desa+Batulawang'
  };

  // Gallery Photos
  const rawGallery = Array.isArray(project?.gallery_photos) && project.gallery_photos.length > 0 
    ? project.gallery_photos 
    : (Array.isArray(project?.photo_urls) && project.photo_urls.length > 0 ? project.photo_urls : LACE10_ASSETS.defaultPhotos.gallery);

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
    setIsSubmittingRsvp(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project?.id,
          name: rsvpName,
          attendance: rsvpAttendance,
          pax: rsvpPax,
        }),
      });
      if (res.ok) {
        setRsvpSubmitted(true);
      }
    } catch {}
    setIsSubmittingRsvp(false);
  };

  // Submit Wish
  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishMessage.trim()) return;
    setIsSubmittingWish(true);
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project?.id,
          name: wishName || 'Tamu Undangan',
          message: wishMessage,
        }),
      });
      if (res.ok) {
        const newWish = {
          id: Date.now().toString(),
          name: wishName || 'Tamu Undangan',
          message: wishMessage,
          created_at: new Date().toISOString(),
        };
        setWishesList([newWish, ...wishesList]);
        setWishMessage('');
      }
    } catch {}
    setIsSubmittingWish(false);
  };

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

  return (
    <div
      ref={scrollContainerRef}
      className={`relative w-full md:w-[42%] lg:w-[38%] xl:w-[35%] h-[100dvh] ${
        hasOpened ? "overflow-y-auto" : "overflow-hidden"
      } no-scrollbar bg-[#611220] text-[#f7f2ea] font-serif select-none flex-shrink-0`}
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
          className="fixed md:absolute bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#1e0508]/85 backdrop-blur-md border border-[#c49a6c]/40 shadow-2xl flex items-center justify-center p-1 group hover:scale-105 transition-transform cursor-pointer"
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
                className="relative z-30 flex flex-col items-center max-w-sm w-full mx-auto"
              >
                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl sm:text-5xl text-[#f5ebe1] tracking-wide mb-8 text-center drop-shadow-md"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  You Are Invited !!
                </motion.h2>

                {/* Envelope Container */}
                <div className="relative w-[340px] sm:w-[370px] h-[240px] sm:h-[260px] flex items-center justify-center">
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
                    className="absolute -top-8 -right-6 w-24 sm:w-28 h-auto object-contain pointer-events-none filter drop-shadow-md"
                  />

                  {/* Bottom-Left Velvet Dahlia */}
                  <img
                    src={LACE10_ASSETS.flowerRedDahlia}
                    alt="Velvet Dahlia"
                    className="absolute -bottom-6 -left-6 w-20 sm:w-24 h-auto object-contain pointer-events-none filter drop-shadow-md"
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
                    className="absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-18 sm:h-18 rounded-full z-20 flex items-center justify-center cursor-pointer shadow-[0_8px_25px_rgba(0,0,0,0.5)] focus:outline-none group"
                  >
                    <img
                      src={LACE10_ASSETS.waxSealMonogram}
                      alt="Wax Seal"
                      className="w-full h-full object-contain rounded-full border border-[#f3e3cb]/30 group-hover:brightness-110 transition-all"
                    />
                  </motion.button>
                </div>

                {/* Tap to open text */}
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  onClick={handleOpenEnvelope}
                  className="mt-8 cursor-pointer text-center group"
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
                className="relative z-30 flex flex-col items-center max-w-sm w-full mx-auto"
              >
                {/* Monogram Top */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-3"
                >
                  <span
                    className="text-5xl text-[#d4af37] font-serif tracking-widest drop-shadow-md block"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    {groomNickname.charAt(0)} &amp; {brideNickname.charAt(0)}
                  </span>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#e5c7a9] mt-1 font-serif">
                    Our Getting Married....
                  </p>
                </motion.div>

                {/* Photobooth Dispenser Slot Machine */}
                <div className="relative w-72 flex flex-col items-center">
                  {/* Metallic Slot */}
                  <img
                    src={LACE10_ASSETS.photoboothSlot}
                    alt="Photobooth Slot"
                    className="w-full h-auto object-contain z-30 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)]"
                  />

                  {/* Photostrip sliding down */}
                  <motion.div
                    initial={{ y: -180, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    className="w-52 bg-[#751727] p-2.5 pt-3 pb-3 border-2 border-[#caa472] shadow-2xl rounded-sm flex flex-col gap-2.5 -mt-2 z-20"
                  >
                    <div className="w-full h-24 bg-neutral-900 rounded overflow-hidden border border-[#caa472]/40">
                      <img
                        src={rawGallery[0] || LACE10_ASSETS.defaultPhotos.photostrip1}
                        alt="Couple Photo 1"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full h-24 bg-neutral-900 rounded overflow-hidden border border-[#caa472]/40">
                      <img
                        src={rawGallery[1] || LACE10_ASSETS.defaultPhotos.photostrip2}
                        alt="Couple Photo 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full h-24 bg-neutral-900 rounded overflow-hidden border border-[#caa472]/40">
                      <img
                        src={rawGallery[2] || LACE10_ASSETS.defaultPhotos.photostrip3}
                        alt="Couple Photo 3"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Continue Button */}
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6 }}
                  onClick={handleContinueToMain}
                  className="mt-6 px-8 py-3 rounded-full bg-[#1f0508]/90 backdrop-blur-md border border-[#c49a6c] text-[#f5ebd8] text-xs font-serif uppercase tracking-[0.25em] hover:bg-[#851c2d] hover:text-white transition-all shadow-xl hover:scale-105 cursor-pointer"
                >
                  Tap to continue
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* PART 2: MAIN WEDDING INVITATION WEBSITE                                   */}
      {/* ========================================================================= */}
      {hasOpened && (
        <main className="relative w-full min-h-screen bg-[#611220] overflow-hidden pb-16">
          {/* --------------------------------------------------------------------- */}
          {/* SECTION 1: HERO COVER COMPOSITION (Red Satin Background)               */}
          {/* --------------------------------------------------------------------- */}
          {/* --------------------------------------------------------------------- */}
          {/* SECTION 1: HERO COVER COLLAGE (Exact 1:1 Canva Flatlay Reproduction)  */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full aspect-[430/508] max-w-[430px] mx-auto overflow-hidden select-none"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedSatinDraped})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* 1. Pleated Red Circular Fan on the left background */}
            <div
              className="absolute -left-[14%] top-[19%] w-[54%] aspect-square rounded-full overflow-hidden shadow-2xl pointer-events-none opacity-95"
              style={{
                backgroundImage: `url(${LACE10_ASSETS.pleatedSunburstMat})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />

            {/* Moss & Floral sprigs draped over the fan */}
            <img
              src={LACE10_ASSETS.hangingMoss}
              alt="Moss"
              className="absolute left-[7%] top-[25%] w-[12%] h-auto object-contain pointer-events-none opacity-90 z-10"
            />
            <img
              src={LACE10_ASSETS.flowerRoseBouquet}
              alt="Rose Accent"
              className="absolute left-[13%] top-[21%] w-[18%] h-auto object-contain pointer-events-none z-10 rotate-[-15deg]"
            />

            {/* 2. Serif Monogram "Z S" in Olive Green in the Center Background */}
            <div className="absolute left-[45%] top-[29%] z-0 pointer-events-none flex flex-col items-center leading-none">
              <span className="font-serif text-[62px] text-[#4d5c43] font-normal tracking-tight opacity-95">
                Z
              </span>
              <span className="font-serif text-[48px] text-[#4d5c43] font-normal tracking-tight -mt-4 opacity-95">
                s
              </span>
            </div>

            {/* 3. Top Open Envelope with Couple Photo & Flower Bouquet */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute left-[34%] top-[4%] w-[49%] h-[38%] z-10 flex items-center justify-center cursor-pointer group"
              onClick={() => setLightboxImg(rawGallery[0] || LACE10_ASSETS.defaultPhotos.heroEnvelope)}
            >
              {/* Couple Photo peaking inside the open flap */}
              <div className="absolute top-[0%] left-[17%] w-[66%] h-[72%] bg-white p-1 shadow-md rounded-xs overflow-hidden">
                <img
                  src={rawGallery[0] || LACE10_ASSETS.defaultPhotos.heroEnvelope}
                  alt="Couple Hero"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              {/* Open Envelope Front & Flap */}
              <img
                src={LACE10_ASSETS.envelopeOpen}
                alt="Open Envelope"
                className="absolute inset-0 w-full h-full object-contain filter drop-shadow-lg pointer-events-none"
              />
              {/* Dark Red Flower Bouquet on Top-Right */}
              <img
                src={LACE10_ASSETS.flowerRoseBouquet}
                alt="Rose"
                className="absolute -top-[6%] -right-[8%] w-[38%] h-auto object-contain pointer-events-none z-20"
              />
            </motion.div>

            {/* 4. Mini RSVP Envelope on the Left (Tilted -5deg, with open lace flap & wax seal) */}
            <motion.a
              href="#rsvp-section"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="absolute left-[17%] top-[17%] w-[32%] aspect-[1/1] z-20 flex items-center justify-center cursor-pointer filter drop-shadow-xl"
              style={{ rotate: '-5deg' }}
            >
              <img
                src={LACE10_ASSETS.miniRsvpEnvelope}
                alt="Mini RSVP Envelope"
                className="w-full h-full object-contain pointer-events-none"
              />
              {/* Text inside the lace flap */}
              <div className="absolute top-[28%] text-center px-1 pointer-events-none">
                <p className="text-[7.5px] font-serif text-[#691823]">
                  Kindly
                </p>
                <p className="text-[9.5px] font-serif font-bold text-[#691823] tracking-tight">
                  RSVP Here!!
                </p>
                <p className="text-[7.5px] font-serif text-[#691823] underline mt-0.5">
                  Tap to open
                </p>
              </div>
              {/* Wax Seal Rose on the envelope closure */}
              <img
                src={LACE10_ASSETS.waxSealRose}
                alt="Wax Seal"
                className="absolute bottom-[23%] left-[38%] w-[24%] h-auto object-contain filter drop-shadow-md pointer-events-none"
              />
            </motion.a>

            {/* 5. Right Elongated Oval Plaque ("The Wedding Of Zahra & Sopyan") */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute left-[58%] top-[18%] w-[34%] h-[48%] z-20 bg-[#fdfaf5] rounded-[60px] border-2 border-[#e6decb] shadow-2xl p-2.5 text-center flex flex-col items-center justify-center"
            >
              <p className="text-[8.5px] font-serif italic text-[#5a4a42] tracking-wider mb-1">
                The Wedding Of
              </p>
              <h1
                className="text-[26px] leading-[1.1] text-[#6b1523] tracking-wide my-0.5"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
              >
                {brideNickname}
              </h1>
              <span className="text-[13px] text-[#6b1523] italic font-serif my-0.5">&amp;</span>
              <h1
                className="text-[26px] leading-[1.1] text-[#6b1523] tracking-wide my-0.5"
                style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
              >
                {groomNickname}
              </h1>
              {/* Two Doves icon at bottom */}
              <img
                src={LACE10_ASSETS.doveOliveBranch}
                alt="Doves"
                className="w-[26px] h-auto object-contain mt-1.5 opacity-75"
              />
            </motion.div>

            {/* 6. Bottom-Left Tall Arched Card ("Save The Date") */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="absolute left-[21%] top-[44%] w-[27%] h-[48%] z-20 bg-[#6b1523] p-[2px] rounded-t-full rounded-b-md shadow-2xl"
            >
              <div className="w-full h-full bg-[#fdfaf5] rounded-t-full rounded-b-sm border border-[#6b7f5e] p-2 flex flex-col items-center justify-center text-center">
                <img
                  src={LACE10_ASSETS.swansHeart}
                  alt="Swans"
                  className="w-[28px] h-auto object-contain mb-0.5 opacity-90"
                />
                <p className="text-[7.5px] font-serif uppercase tracking-[0.18em] text-[#5a4a42] mb-1">
                  Save The Date
                </p>
                <p className="text-[11px] font-serif uppercase tracking-wider text-[#6b1523] font-medium">
                  {formattedDayName}
                </p>
                <div className="flex flex-col items-center my-0.5 leading-none">
                  <span className="text-[20px] font-serif font-bold text-[#6b1523] leading-none">
                    {formattedDateNum}
                  </span>
                  <span className="text-[9px] text-[#6b1523] my-0.5">•</span>
                  <span className="text-[13px] font-serif font-bold text-[#6b1523] leading-none">
                    {formattedMonthNum}
                  </span>
                  <span className="text-[9px] text-[#6b1523] my-0.5">•</span>
                  <span className="text-[10px] font-serif text-[#6b1523]">
                    {formattedYear}
                  </span>
                </div>
              </div>
              {/* 3D Red Satin Ribbon Bow attached to the right edge */}
              <img
                src={LACE10_ASSETS.redRibbonBow}
                alt="Red Bow"
                className="absolute -right-[14px] top-[36%] w-[32px] h-auto object-contain filter drop-shadow-md z-30 pointer-events-none"
              />
            </motion.div>

            {/* 7. Bottom-Center/Right Square Venue Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute left-[49%] top-[50%] w-[22%] h-[22%] z-20 bg-[#6b1523] p-[2px] rounded-sm shadow-xl"
            >
              {/* Hanging Moss behind on the right */}
              <img
                src={LACE10_ASSETS.hangingMoss}
                alt="Moss"
                className="absolute -right-[12px] -top-[14px] w-[22px] h-auto object-contain pointer-events-none opacity-80 z-0"
              />
              <div className="relative z-10 w-full h-full bg-[#fdfaf5] p-1.5 flex flex-col items-center justify-center text-center">
                <p className="text-[7.5px] font-serif font-bold text-[#6b1523] leading-tight mb-0.5">
                  Jam 09.00 - selesai
                </p>
                <p className="text-[8px] font-serif font-semibold text-[#333] leading-tight mb-0.5">
                  {akadEvent.venue_name || 'Aula Desa Batulawang'}
                </p>
                <p className="text-[6.5px] text-[#555] font-sans leading-tight">
                  {akadEvent.venue_address || 'Jl. Cisereuh, Kec. Cipanas, Kabupaten Cianjur, Jawa Barat'}
                </p>
              </div>
            </motion.div>

            {/* 8. Spinning Vinyl Record Music Player below venue card */}
            <div
              onClick={toggleAudio}
              className="absolute left-[49%] top-[72%] w-[20%] aspect-square z-20 flex items-center justify-center cursor-pointer group"
              title={isPlaying ? 'Pause Musik' : 'Putar Musik'}
            >
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                className="relative w-full h-full rounded-full overflow-hidden shadow-2xl filter drop-shadow-lg"
              >
                <img
                  src={LACE10_ASSETS.vinylDisc}
                  alt="Vinyl Record"
                  className="w-full h-full object-contain"
                />
                {/* Red center label with play triangle button */}
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
            <div className="absolute left-[72%] top-[62%] w-[11%] h-auto z-20 pointer-events-none">
              <img
                src={LACE10_ASSETS.candleBrassStand}
                alt="Candle"
                className="w-full h-auto object-contain filter drop-shadow-md"
              />
            </div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 2: CALENDAR & COUNTDOWN                                       */}
          {/* --------------------------------------------------------------------- */}
          <section className="relative w-full px-5 py-8 bg-[#611220] flex flex-col items-center">
            {/* Flourish Divider */}
            <div className="w-48 h-auto mb-6 flex justify-center">
              <img
                src={LACE10_ASSETS.flourishDividerHeart}
                alt="Divider"
                className="w-full h-auto object-contain opacity-80"
              />
            </div>

            {/* Calendar Card with Love Heart on the Wedding Date */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full max-w-xs bg-[#f8f4ed] text-[#3d1017] rounded-3xl p-5 shadow-2xl border border-[#d6b797]/60"
            >
              {/* Month Header */}
              <div className="text-center mb-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#7a202e] font-semibold">
                  {formattedMonthLong} {formattedYear}
                </p>
              </div>

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#8f2738] mb-2 uppercase tracking-wider">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-serif text-[#4a131c]">
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="h-8"></div>;
                  }
                  const isWeddingDay = day === weddingDayNum;
                  return (
                    <div
                      key={`day-${day}`}
                      className="h-8 flex items-center justify-center relative font-medium"
                    >
                      {isWeddingDay ? (
                        <div className="relative flex items-center justify-center w-8 h-8">
                          <motion.div
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                            className="absolute inset-0 flex items-center justify-center text-red-600"
                          >
                            <svg
                              className="w-7 h-7 text-[#851c2d] fill-current opacity-20"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          </motion.div>
                          <span className="relative z-10 font-bold text-[#851c2d]">
                            {day}
                          </span>
                        </div>
                      ) : (
                        <span>{day}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Countdown Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-full max-w-xs mt-6 bg-[#f8f4ed] text-[#42111a] rounded-xl px-4 py-3 border border-[#d6b797]/60 shadow-xl text-center"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#7a202e] font-semibold mb-1">
                Counting Days
              </p>
              <div className="flex items-center justify-center gap-2 font-serif text-2xl font-bold text-[#5c1320]">
                <span>{timeLeft.days}</span>
                <span className="text-[#851c2d]">:</span>
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[#851c2d]">:</span>
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[#851c2d]">:</span>
                <span className="text-[#3a6b46]">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center justify-around text-[9px] uppercase tracking-wider text-neutral-500 mt-1">
                <span>Days</span>
                <span>Hours</span>
                <span>Minutes</span>
                <span>Seconds</span>
              </div>
            </motion.div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 3: SALAM & MEMPELAI (Green Silk Satin Texture)                 */}
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
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative w-full max-w-[360px] aspect-[800/1299] mx-auto filter drop-shadow-2xl"
            >
              <img
                src={LACE10_ASSETS.laceArchGreen}
                alt="Lace Arch Frame"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />
              <div className="relative z-20 w-full h-full pt-[14%] pb-[12%] px-[15%] flex flex-col items-center justify-between text-center select-none">
                {/* Bismillah Calligraphy */}
                <div className="w-[85%] max-w-[200px]">
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
                <div className="my-1">
                  <p className="text-[10px] sm:text-[11px] font-serif text-[#333] leading-tight font-medium">
                    Assalamualaikum Warahmatullahi Wabarakatuh
                  </p>
                  <p className="text-[8px] sm:text-[9px] text-[#555] font-sans leading-tight mt-1">
                    Tanpa mengurangi rasa hormat kami, dengan memohon Rahmat dan Ridho Allah SWT, kami mengundang Anda untuk menjadi bagian dari hari bahagia kami:
                  </p>
                </div>

                {/* Bride Profile */}
                <div className="my-1">
                  <h2
                    className="text-2xl sm:text-3xl text-[#7a1827] tracking-wide"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    {brideName}
                  </h2>
                  <p className="text-[8.5px] sm:text-[9.5px] text-[#555] font-sans mt-0.5">
                    Putri kedua dari {brideFather} dan {brideMother}
                  </p>
                </div>

                {/* Ampersand Divider */}
                <span className="text-sm sm:text-base text-[#7a1827] font-serif italic">&amp;</span>

                {/* Groom Profile */}
                <div className="my-1">
                  <h2
                    className="text-2xl sm:text-3xl text-[#7a1827] tracking-wide"
                    style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                  >
                    {groomName}
                  </h2>
                  <p className="text-[8.5px] sm:text-[9.5px] text-[#555] font-sans mt-0.5">
                    Putra pertama dari {groomFather} dan {groomMother}
                  </p>
                </div>

                {/* Closing blessing text */}
                <p className="text-[8px] sm:text-[9px] text-[#555] font-sans leading-tight italic">
                  Kehadiran serta doa restu Anda akan sangat berarti bagi perjalanan kami
                </p>
              </div>
            </motion.div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 4: EVENT DETAILS (Akad & Resepsi Cards)                       */}
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
              viewport={{ once: true }}
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
              <div className="inline-block px-5 py-1 rounded-full bg-[#f1e6d4] border border-[#c49a6c] text-[#7a1827] text-sm font-serif font-bold uppercase tracking-widest mb-3">
                {akadEvent.custom_label || 'Akad Nikah'}
              </div>

              <p className="text-sm font-serif text-[#42111a] font-semibold">
                {formattedDayName}, {formattedDateNum} {formattedMonthLong} {formattedYear}
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
                viewport={{ once: true }}
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
                viewport={{ once: true }}
                className="relative bg-[#f8f4ed] text-[#3d1017] rounded-t-full rounded-b-xl p-4 pt-6 border border-[#7a1827] shadow-xl text-center flex flex-col items-center justify-between"
              >
                {/* Wax seal at top arch */}
                <img
                  src={LACE10_ASSETS.waxSealRose}
                  alt="Wax Seal"
                  className="w-8 h-8 object-contain -mt-2 mb-1"
                />

                <div className="inline-block px-3 py-0.5 rounded-full bg-[#f1e6d4] border border-[#c49a6c] text-[#7a1827] text-xs font-serif font-bold uppercase tracking-wider mb-2">
                  {resepsiEvent.custom_label || 'Resepsi'}
                </div>

                <div>
                  <p className="text-[11px] font-serif font-semibold text-[#42111a]">
                    {formattedDayName}, {formattedDateNum} {formattedMonthLong} {formattedYear}
                  </p>
                  <p className="text-[10px] font-sans text-[#7a1827] font-bold my-0.5">
                    {resepsiEvent.event_time || '12.00 - 16.00 WIB'}
                  </p>
                  <p className="text-[10px] text-neutral-600 font-sans leading-tight">
                    {resepsiEvent.venue_name}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Google Calendar Link Button */}
            <a
              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Pernikahan+${encodeURIComponent(brideNickname)}+%26+${encodeURIComponent(groomNickname)}&dates=${formattedYear}${formattedMonthNum}${formattedDateNum}T020000Z/${formattedYear}${formattedMonthNum}${formattedDateNum}T090000Z&details=Pernikahan+${encodeURIComponent(brideName)}+dan+${encodeURIComponent(groomName)}&location=${encodeURIComponent(akadEvent.venue_name || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1b0407] text-[#f8f4ed] text-xs font-sans uppercase tracking-[0.2em] border border-[#c49a6c]/60 shadow-lg hover:bg-[#851c2d] transition-colors"
            >
              <span>Simpan ke Kalender</span>
            </a>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 5: THE BRIDE (Scalloped Lace Portrait Frames)                 */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-5 py-14 flex flex-col items-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedVelvet})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Title */}
            <h2
              className="text-4xl sm:text-5xl text-[#f5ebd8] text-center mb-2"
              style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
            >
              The Bride
            </h2>

            {/* Pearl Rope Bow Divider */}
            <img
              src={LACE10_ASSETS.pearlBeadBow}
              alt="Pearl Bow"
              className="w-36 h-auto object-contain my-3 opacity-90"
            />

            {/* 2 Portrait Cards with Scalloped Lace Frame */}
            <div className="w-full flex flex-col items-center gap-8 mt-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative w-64 h-88 rounded-3xl p-3 bg-[#fdfaf5] shadow-2xl flex items-center justify-center cursor-pointer group overflow-hidden border border-[#e8d7c3]"
                onClick={() => setLightboxImg(project?.bride_photo_url || rawGallery[4] || LACE10_ASSETS.defaultPhotos.bridePortrait1)}
              >
                <div className="w-full h-full rounded-2xl overflow-hidden bg-neutral-900">
                  <img
                    src={project?.bride_photo_url || rawGallery[4] || LACE10_ASSETS.defaultPhotos.bridePortrait1}
                    alt="Bride Portrait 1"
                    className="w-full h-full object-cover object-[center_25%] group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <img
                  src={LACE10_ASSETS.laceScallopFrame}
                  alt="Lace Border"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 filter drop-shadow-sm"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative w-64 h-88 rounded-3xl p-3 bg-[#fdfaf5] shadow-2xl flex items-center justify-center cursor-pointer group overflow-hidden border border-[#e8d7c3]"
                onClick={() => setLightboxImg(project?.groom_photo_url || rawGallery[5] || LACE10_ASSETS.defaultPhotos.bridePortrait2)}
              >
                <div className="w-full h-full rounded-2xl overflow-hidden bg-neutral-900">
                  <img
                    src={project?.groom_photo_url || rawGallery[5] || LACE10_ASSETS.defaultPhotos.bridePortrait2}
                    alt="Bride Portrait 2"
                    className="w-full h-full object-cover object-[center_30%] group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <img
                  src={LACE10_ASSETS.laceScallopFrame}
                  alt="Lace Border"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10 filter drop-shadow-sm"
                />
              </motion.div>
            </div>

            {/* Pearl Rope Bow Divider bottom */}
            <img
              src={LACE10_ASSETS.pearlBeadBow}
              alt="Pearl Bow"
              className="w-36 h-auto object-contain mt-6 opacity-90"
            />
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 6: KUTIPAN AYAT SUCI (Baroque Lace Mirror Frame)               */}
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative w-full max-w-[340px] aspect-[800/997] mx-auto filter drop-shadow-2xl flex items-center justify-center"
            >
              <img
                src={LACE10_ASSETS.baroqueArchQuran}
                alt="Baroque Frame"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              />
              <div className="relative z-20 w-full h-full pt-[22%] pb-[14%] px-[16%] flex flex-col items-center justify-center text-center select-none">
                <p className="text-xs sm:text-sm font-serif italic text-[#3d1017] leading-relaxed mb-4">
                  &ldquo;Allah menciptakan pasangan dari diri manusia agar merasa tenteram, serta menjadikan rasa cinta dan kasih sayang di antara mereka&rdquo;
                </p>
                <p className="text-[10px] sm:text-[11px] font-serif uppercase tracking-[0.2em] text-[#7a1827] font-semibold">
                  Qs. (Ar-Rum) - Ayat 21
                </p>
              </div>
            </motion.div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 7: EDITORIAL PHOTO MOSAIC                                     */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full px-4 py-12 flex flex-col items-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedCurtain})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="w-full grid grid-cols-3 gap-2">
              {rawGallery.slice(0, 9).map((photo: string, idx: number) => {
                const isSpan2 = idx === 0 || idx === 4;
                return (
                  <motion.div
                    key={`gal-${idx}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    onClick={() => setLightboxImg(photo)}
                    className={`relative rounded-lg overflow-hidden border border-[#d6b797]/50 shadow-md cursor-pointer group ${
                      isSpan2 ? 'col-span-2 h-44' : 'col-span-1 h-32'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 8: CASUAL MOMENTS & RUNDOWN ACARA                             */}
          {/* --------------------------------------------------------------------- */}
          <section className="relative w-full px-5 py-12 bg-[#57101c] flex flex-col items-center text-center">
            {/* Title */}
            <h2
              className="text-4xl text-[#f5ebd8] mb-4"
              style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
            >
              Our Moment
            </h2>

            {/* Casual Polaroids / Candids Collage (5 Photos matching Canva) */}
            <div className="w-full max-w-sm flex flex-col items-center gap-3 my-4">
              {/* Photo 1: Top Wide Polaroid */}
              {LACE10_ASSETS.defaultPhotos.casualMoments[0] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  onClick={() => setLightboxImg(LACE10_ASSETS.defaultPhotos.casualMoments[0])}
                  className="w-[78%] bg-[#f8f4ed] p-2 pb-6 shadow-2xl rounded-xs border border-[#caa472]/40 transform rotate-[1deg] hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="w-full aspect-[4/3] overflow-hidden rounded-xs">
                    <img
                      src={LACE10_ASSETS.defaultPhotos.casualMoments[0]}
                      alt="Moment 1"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              )}

              {/* Row 2: Two Polaroids */}
              <div className="w-full flex items-center justify-center gap-3">
                {LACE10_ASSETS.defaultPhotos.casualMoments[1] && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setLightboxImg(LACE10_ASSETS.defaultPhotos.casualMoments[1])}
                    className="w-[45%] bg-[#f8f4ed] p-1.5 pb-5 shadow-xl rounded-xs border border-[#caa472]/40 transform -rotate-[4deg] hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div className="w-full aspect-[3/4] overflow-hidden rounded-xs">
                      <img
                        src={LACE10_ASSETS.defaultPhotos.casualMoments[1]}
                        alt="Moment 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                )}
                {LACE10_ASSETS.defaultPhotos.casualMoments[2] && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setLightboxImg(LACE10_ASSETS.defaultPhotos.casualMoments[2])}
                    className="w-[45%] bg-[#f8f4ed] p-1.5 pb-5 shadow-xl rounded-xs border border-[#caa472]/40 transform rotate-[3deg] hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div className="w-full aspect-[4/3] overflow-hidden rounded-xs">
                      <img
                        src={LACE10_ASSETS.defaultPhotos.casualMoments[2]}
                        alt="Moment 3"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Row 3: Two Polaroids overlapping */}
              <div className="w-full flex items-center justify-center -space-x-4 mt-1">
                {LACE10_ASSETS.defaultPhotos.casualMoments[3] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setLightboxImg(LACE10_ASSETS.defaultPhotos.casualMoments[3])}
                    className="w-[48%] bg-[#f8f4ed] p-1.5 pb-5 shadow-xl rounded-xs border border-[#caa472]/40 transform rotate-[2deg] hover:scale-105 transition-transform cursor-pointer z-10"
                  >
                    <div className="w-full aspect-[3/4] overflow-hidden rounded-xs">
                      <img
                        src={LACE10_ASSETS.defaultPhotos.casualMoments[3]}
                        alt="Moment 4"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                )}
                {LACE10_ASSETS.defaultPhotos.casualMoments[4] && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    onClick={() => setLightboxImg(LACE10_ASSETS.defaultPhotos.casualMoments[4])}
                    className="w-[48%] bg-[#f8f4ed] p-1.5 pb-5 shadow-xl rounded-xs border border-[#caa472]/40 transform -rotate-[3deg] hover:scale-105 transition-transform cursor-pointer z-20"
                  >
                    <div className="w-full aspect-[3/4] overflow-hidden rounded-xs">
                      <img
                        src={LACE10_ASSETS.defaultPhotos.casualMoments[4]}
                        alt="Moment 5"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Two Doves Carrying Ribbon */}
            <div className="w-36 h-auto my-6">
              <img
                src={LACE10_ASSETS.dovesFlightRibbon}
                alt="Two Doves"
                className="w-full h-auto object-contain opacity-90"
              />
            </div>

            {/* Rundown Title & Wavy Divider */}
            <h3
              className="text-3xl text-[#f5ebd8]"
              style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
            >
              Rundown Acara
            </h3>
            <img
              src={LACE10_ASSETS.rundownWavyLine}
              alt="Wavy Line"
              className="w-40 h-auto object-contain my-3 opacity-80"
            />

            {/* Timeline Schedule */}
            <div className="w-full max-w-xs flex flex-col gap-3 mt-4 text-[#f8f4ed]">
              {[
                { time: '07.30 WIB', title: 'Mapag Panganten' },
                { time: '08.00 - 10.00 WIB', title: 'Akad Nikah' },
                { time: '10.00 - 11.00 WIB', title: 'Sungkeman' },
                { time: '11.00 - 11.30 WIB', title: 'Upacara Adat Sunda' },
                { time: '12.00 - 16.00 WIB', title: 'Resepsi Pernikahan' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#3b0811]/60 border border-[#c49a6c]/30 shadow-sm"
                >
                  <span className="text-xs font-sans font-bold text-[#f3dfc8]">{item.time}</span>
                  <span className="text-xs font-serif text-[#f8f4ed]">{item.title}</span>
                </div>
              ))}
            </div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 9: WEDDING GIFT (Bank Cards & Cashless Envelope)              */}
          {/* --------------------------------------------------------------------- */}
          <section className="relative w-full px-5 py-12 bg-[#611220] flex flex-col items-center text-center">
            {/* Getaway Wedding Car Illustration */}
            <div className="w-44 h-auto mb-3">
              <img
                src={LACE10_ASSETS.weddingCarGetaway}
                alt="Wedding Car"
                className="w-full h-auto object-contain filter invert opacity-85"
              />
            </div>

            <h2 className="text-3xl font-serif text-[#f5ebd8] uppercase tracking-wider mb-2">
              Wedding Gift
            </h2>
            <p className="text-xs text-[#e8cfb5] font-sans max-w-xs leading-relaxed mb-6">
              Bagi keluarga dan rekan yang ingin memberikan tanda kasih untuk kami, dapat menyalurkannya melalui rekening / e-wallet di bawah ini:
            </p>

            {/* ATM / Bank Cards */}
            <div className="w-full max-w-xs flex flex-col gap-4">
              {bankAccounts.map((acc: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-[#f8f4ed] via-[#f1e6d4] to-[#e4ceb4] text-[#3d1017] p-5 shadow-2xl border border-[#c49a6c] flex flex-col justify-between text-left overflow-hidden"
                >
                  {/* Batik watermark right */}
                  <img
                    src={LACE10_ASSETS.laceBorderWhite}
                    alt="Pattern"
                    className="absolute -right-6 -bottom-6 w-36 h-36 object-contain opacity-20 pointer-events-none"
                  />

                  {/* Header: Chip & Bank Name */}
                  <div className="flex items-center justify-between">
                    <img
                      src={LACE10_ASSETS.atmCardChipPattern}
                      alt="Chip"
                      className="w-10 h-auto object-contain"
                    />
                    <span className="font-serif font-bold text-lg text-[#5c1320] tracking-wider uppercase">
                      {acc.bank_name}
                    </span>
                  </div>

                  {/* Card Number & Holder */}
                  <div className="mt-2">
                    <p className="text-[9px] uppercase tracking-wider text-neutral-600 font-sans">
                      No. Rekening / e-Wallet
                    </p>
                    <p className="font-mono text-base font-bold text-[#42111a] tracking-wider my-0.5">
                      {acc.account_number}
                    </p>
                    <p className="text-[11px] font-sans font-semibold text-[#661b27]">
                      a/n {acc.account_holder}
                    </p>
                  </div>

                  {/* Copy Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc.account_number, acc.bank_name)}
                      className="px-3 py-1 rounded-full bg-[#821c2c] text-white text-[10px] font-sans uppercase tracking-wider hover:bg-[#5c1320] transition-colors shadow cursor-pointer"
                    >
                      {copiedBank === acc.bank_name ? 'Tersalin ✓' : 'Salin Rekening'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 10: LOCATION & MAPS                                           */}
          {/* --------------------------------------------------------------------- */}
          <section className="relative w-full px-5 py-12 bg-[#57101c] flex flex-col items-center text-center">
            <h2 className="text-3xl font-serif text-[#f5ebd8] uppercase tracking-wider mb-2">
              Location
            </h2>
            <img
              src={LACE10_ASSETS.flourishDivider2}
              alt="Divider"
              className="w-48 h-auto object-contain my-2 opacity-80"
            />
            <p className="text-sm font-serif font-bold text-[#f5ebd8] mt-2 mb-1">
              {akadEvent.venue_name}
            </p>
            <p className="text-xs text-[#e8cfb5] font-sans max-w-xs leading-relaxed mb-6">
              {akadEvent.venue_address}
            </p>

            {/* Google Maps Preview Card */}
            <div className="w-full max-w-xs h-56 rounded-2xl overflow-hidden border-2 border-[#c49a6c]/60 shadow-2xl relative bg-neutral-900">
              <iframe
                title="Venue Location"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(akadEvent.venue_address || akadEvent.venue_name || 'Batulawang')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>

            <a
              href={akadEvent.venue_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(akadEvent.venue_address || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#821c2c] text-white text-xs font-sans uppercase tracking-[0.2em] shadow-lg hover:bg-[#5c1320] transition-colors"
            >
              <span>Buka Google Maps</span>
            </a>
          </section>

          {/* --------------------------------------------------------------------- */}
          {/* SECTION 11: RSVP & BLESSING WALL                                      */}
          {/* --------------------------------------------------------------------- */}
          <section id="rsvp-section" className="relative w-full px-5 py-12 bg-[#611220] flex flex-col items-center">
            <h2 className="text-3xl font-serif text-[#f5ebd8] uppercase tracking-wider text-center mb-2">
              Konfirmasi Kehadiran
            </h2>
            <p className="text-xs text-[#e8cfb5] font-sans text-center max-w-xs mb-6">
              Mohon konfirmasi kehadiran Anda untuk membantu kami mempersiapkan jamuan terbaik.
            </p>

            {/* RSVP Form */}
            <form
              onSubmit={handleRsvpSubmit}
              className="w-full max-w-xs bg-[#f8f4ed] text-[#42111a] p-5 rounded-2xl shadow-2xl border border-[#d6b797]/60 flex flex-col gap-3"
            >
              {rsvpSubmitted ? (
                <div className="p-4 text-center">
                  <p className="text-sm font-serif font-bold text-[#821c2c]">Terima Kasih!</p>
                  <p className="text-xs text-neutral-600 font-sans mt-1">Konfirmasi kehadiran Anda telah tersimpan.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-sans uppercase tracking-wider text-neutral-600 block mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#c49a6c]/60 text-xs text-neutral-800 focus:outline-none focus:border-[#821c2c]"
                      placeholder="Nama Anda"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-sans uppercase tracking-wider text-neutral-600 block mb-1">
                      Konfirmasi
                    </label>
                    <select
                      value={rsvpAttendance}
                      onChange={(e) => setRsvpAttendance(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#c49a6c]/60 text-xs text-neutral-800 focus:outline-none focus:border-[#821c2c]"
                    >
                      <option value="hadir">Hadir</option>
                      <option value="tidak_hadir">Tidak Dapat Hadir</option>
                      <option value="masih_ragu">Masih Ragu</option>
                    </select>
                  </div>

                  {rsvpAttendance === 'hadir' && (
                    <div>
                      <label className="text-[10px] font-sans uppercase tracking-wider text-neutral-600 block mb-1">
                        Jumlah Tamu
                      </label>
                      <select
                        value={rsvpPax}
                        onChange={(e) => setRsvpPax(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-[#c49a6c]/60 text-xs text-neutral-800 focus:outline-none focus:border-[#821c2c]"
                      >
                        <option value={1}>1 Orang</option>
                        <option value={2}>2 Orang</option>
                        <option value={3}>3 Orang</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingRsvp}
                    className="w-full py-2.5 mt-2 rounded-lg bg-[#821c2c] text-white text-xs font-sans uppercase tracking-widest font-semibold hover:bg-[#5c1320] transition-colors shadow cursor-pointer"
                  >
                    {isSubmittingRsvp ? 'Mengirim...' : 'Kirim Konfirmasi'}
                  </button>
                </>
              )}
            </form>

            {/* Wishes & Greetings Wall */}
            <div className="w-full max-w-xs mt-10">
              <h3 className="text-2xl font-serif text-[#f5ebd8] uppercase tracking-wider text-center mb-4">
                Doa &amp; Ucapan
              </h3>

              <form onSubmit={handleWishSubmit} className="flex flex-col gap-2 mb-6">
                <input
                  type="text"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                  placeholder="Nama Pengirim"
                  className="w-full px-3 py-2 rounded-lg bg-[#3b0811]/80 border border-[#c49a6c]/50 text-xs text-[#f8f4ed] focus:outline-none"
                />
                <textarea
                  rows={3}
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  placeholder="Tuliskan ucapan dan doa terbaik Anda..."
                  className="w-full px-3 py-2 rounded-lg bg-[#3b0811]/80 border border-[#c49a6c]/50 text-xs text-[#f8f4ed] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmittingWish}
                  className="py-2 rounded-lg bg-[#821c2c] text-white text-xs font-sans uppercase tracking-wider font-semibold hover:bg-[#5c1320] transition-colors cursor-pointer"
                >
                  {isSubmittingWish ? 'Mengirim...' : 'Kirim Ucapan'}
                </button>
              </form>

              {/* Wishes List */}
              <div className="max-h-80 overflow-y-auto flex flex-col gap-2.5 pr-1">
                {wishesList.length === 0 ? (
                  <p className="text-center text-xs text-neutral-400 italic py-4">
                    Belum ada ucapan. Jadilah yang pertama memberikan doa restu!
                  </p>
                ) : (
                  wishesList.map((wish: any, i: number) => (
                    <div
                      key={wish.id || i}
                      className="p-3 rounded-xl bg-[#3b0811]/80 border border-[#c49a6c]/30 text-left text-xs"
                    >
                      <p className="font-serif font-bold text-[#f5ebd8]">{wish.name}</p>
                      <p className="text-neutral-300 font-sans mt-0.5 whitespace-pre-line leading-relaxed">
                        {wish.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full text-center py-8 text-[#caa472]/70 text-[10px] tracking-widest uppercase font-sans border-t border-[#caa472]/20 mt-6">
            <p>The Wedding of {brideNickname} &amp; {groomNickname}</p>
            <p className="mt-1">Crafted with ♥ by SERASTORY</p>
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
