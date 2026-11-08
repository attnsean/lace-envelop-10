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

  // Handle Open Invitation
  const handleOpenEnvelope = () => {
    setPhotoStep(true);
    // Play audio on opening
    if (audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    // Smooth transition from photostrip dispenser to main content
    setTimeout(() => {
      setHasOpened(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3800);
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
    <div className="relative w-full min-h-screen bg-[#611220] text-[#f7f2ea] font-serif overflow-x-hidden select-none">
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
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#1e0508]/85 backdrop-blur-md border border-[#c49a6c]/40 shadow-2xl flex items-center justify-center p-1 group hover:scale-105 transition-transform"
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
      <AnimatePresence>
        {!hasOpened && (
          <motion.div
            key="cover-layer"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.9, ease: "easeInOut" } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen w-full px-4 overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedVelvet})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Dark romantic vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#3b060d]/60 via-transparent to-[#280409]/80 pointer-events-none"></div>

            {/* Falling petals */}
            <FallingPetals />

            {!photoStep ? (
              /* STAGE 1: CLOSED ENVELOPE WITH SEAL & RECIPIENT */
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-30 flex flex-col items-center max-w-sm w-full mx-auto"
              >
                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-serif italic text-3xl sm:text-4xl text-[#f5ebe1] tracking-wide mb-6 text-center drop-shadow-md"
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

                  {/* Top-Right Floral Bouquet */}
                  <img
                    src={LACE10_ASSETS.flowerRoseBouquet}
                    alt="Rose Bouquet"
                    className="absolute -top-6 -right-6 w-24 sm:w-28 h-auto object-contain pointer-events-none filter drop-shadow-md"
                  />

                  {/* Bottom-Left Velvet Dahlia */}
                  <img
                    src={LACE10_ASSETS.flowerRedDahlia}
                    alt="Velvet Dahlia"
                    className="absolute -bottom-6 -left-6 w-20 sm:w-24 h-auto object-contain pointer-events-none filter drop-shadow-md"
                  />

                  {/* Guest Name Plaque */}
                  <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-[80%] z-10">
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#d6b797] font-medium mb-1">
                      Kepada Yth.
                    </p>
                    <p className="text-base sm:text-lg font-bold text-[#fff7ee] tracking-wide truncate">
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
                  <span className="text-xs sm:text-sm tracking-[0.25em] text-[#e8cfb5] uppercase font-light border-b border-[#e8cfb5]/50 pb-0.5 group-hover:text-white group-hover:border-white transition-colors">
                    Tap to open
                  </span>
                </motion.div>
              </motion.div>
            ) : (
              /* STAGE 2: PHOTOSTRIP DISPENSER ANIMATION */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-30 flex flex-col items-center max-w-sm w-full mx-auto"
              >
                {/* Monogram Top */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-2"
                >
                  <span
                    className="text-4xl text-[#d4af37] font-serif tracking-widest drop-shadow-md"
                    style={{ fontFamily: "'Alex Brush', cursive" }}
                  >
                    {groomNickname.charAt(0)} &amp; {brideNickname.charAt(0)}
                  </span>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#e5c7a9] mt-1 font-light">
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
                    initial={{ y: -160, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    className="w-52 bg-[#751727] p-2 pt-3 pb-3 border-2 border-[#caa472] shadow-2xl rounded-sm flex flex-col gap-2 -mt-2 z-20"
                  >
                    <div className="w-full h-24 bg-neutral-800 rounded overflow-hidden border border-[#caa472]/40">
                      <img
                        src={rawGallery[0] || LACE10_ASSETS.defaultPhotos.photostrip1}
                        alt="Couple Photo 1"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full h-24 bg-neutral-800 rounded overflow-hidden border border-[#caa472]/40">
                      <img
                        src={rawGallery[1] || LACE10_ASSETS.defaultPhotos.photostrip2}
                        alt="Couple Photo 2"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full h-24 bg-neutral-800 rounded overflow-hidden border border-[#caa472]/40">
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
                  transition={{ delay: 2.0 }}
                  onClick={() => setHasOpened(true)}
                  className="mt-6 px-6 py-2.5 rounded-full bg-[#1f0508]/80 backdrop-blur-md border border-[#c49a6c]/60 text-[#f5ebd8] text-xs uppercase tracking-[0.25em] hover:bg-[#851c2d] hover:text-white transition-all shadow-lg"
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
        <main className="relative w-full max-w-md mx-auto min-h-screen bg-[#6b1322] shadow-2xl overflow-hidden pb-16">
          {/* --------------------------------------------------------------------- */}
          {/* SECTION 1: HERO COVER COMPOSITION (Red Satin Background)               */}
          {/* --------------------------------------------------------------------- */}
          <section
            className="relative w-full min-h-[920px] px-4 pt-10 pb-16 flex flex-col items-center justify-between overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedSatin})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Top Couple Envelope Pop-up */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative w-64 h-56 mt-2 flex items-center justify-center"
            >
              <img
                src={LACE10_ASSETS.envelopeOpen}
                alt="Open Envelope"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
              <div className="absolute top-2 w-44 h-36 rounded-md overflow-hidden border border-[#d6b588]/50 shadow-md">
                <img
                  src={rawGallery[0] || LACE10_ASSETS.defaultPhotos.heroEnvelope}
                  alt="Couple Hero"
                  className="w-full h-full object-cover"
                />
              </div>
              <img
                src={LACE10_ASSETS.flowerRoseBouquet}
                alt="Rose"
                className="absolute -top-4 -right-4 w-16 h-auto object-contain pointer-events-none"
              />
            </motion.div>

            {/* Middle Section: Monogram, Oval Plaque & Mini RSVP Badge */}
            <div className="relative w-full flex flex-col items-center mt-4">
              {/* Monogram Backdrop */}
              <div
                className="text-6xl text-[#3d5a45]/60 font-serif absolute -top-8 left-12 select-none pointer-events-none"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {groomNickname.charAt(0)}{brideNickname.charAt(0)}
              </div>

              {/* Ceramic Oval Plaque */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative w-64 bg-[#f8f4ed] text-[#4d1620] rounded-full px-6 py-8 border-2 border-[#e0cbb2] shadow-2xl text-center flex flex-col items-center justify-center my-4"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#6d2532] font-semibold mb-1">
                  The Wedding Of
                </p>
                <h1
                  className="text-4xl text-[#751a2a] my-0.5 tracking-wide"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  {brideNickname}
                </h1>
                <span className="text-xl text-[#751a2a] italic my-0.5">&amp;</span>
                <h1
                  className="text-4xl text-[#751a2a] my-0.5 tracking-wide"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  {groomNickname}
                </h1>
                <img
                  src={LACE10_ASSETS.doveOliveBranch}
                  alt="Dove"
                  className="w-8 h-8 object-contain mt-2 opacity-80"
                />
              </motion.div>

              {/* Mini RSVP Envelope (Clickable shortcut) */}
              <motion.a
                href="#rsvp-section"
                whileHover={{ scale: 1.05 }}
                className="relative -mt-6 w-36 h-28 flex items-center justify-center cursor-pointer group"
              >
                <img
                  src={LACE10_ASSETS.miniRsvpEnvelope}
                  alt="Mini RSVP"
                  className="w-full h-full object-contain filter drop-shadow-md group-hover:brightness-105"
                />
                <div className="absolute top-[30%] text-center px-2">
                  <p className="text-[9px] uppercase tracking-wider text-[#521923] font-bold">
                    Kindly RSVP Here!!
                  </p>
                  <p className="text-[8px] text-[#782836] underline mt-0.5">
                    Tap to open
                  </p>
                </div>
              </motion.a>
            </div>

            {/* Bottom Row: Save The Date Pill Card & Time/Venue Card */}
            <div className="w-full grid grid-cols-2 gap-3 px-2 mt-4 items-end">
              {/* Left Pill Card: Save The Date */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative bg-[#f8f4ed] text-[#42111a] rounded-t-full rounded-b-3xl p-4 text-center border border-[#d6b797] shadow-xl flex flex-col items-center justify-center"
              >
                <img
                  src={LACE10_ASSETS.swansHeart}
                  alt="Swans"
                  className="w-10 h-auto object-contain mb-1"
                />
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#6d2532] font-semibold mb-2">
                  Save The Date
                </p>
                <p className="text-xs font-serif uppercase tracking-widest text-[#7a202e] mb-1">
                  {formattedDayName}
                </p>
                <div className="flex flex-col items-center my-1">
                  <span className="text-2xl font-bold text-[#5c1320] leading-none">
                    {formattedDateNum}
                  </span>
                  <span className="text-xs text-[#7a202e] my-0.5">•</span>
                  <span className="text-lg font-bold text-[#5c1320] leading-none">
                    {formattedMonthNum}
                  </span>
                  <span className="text-xs text-[#7a202e] my-0.5">•</span>
                  <span className="text-sm font-semibold text-[#5c1320]">
                    {formattedYear}
                  </span>
                </div>
                {/* Red Ribbon bow decoration */}
                <img
                  src={LACE10_ASSETS.redRibbonBow}
                  alt="Red Bow"
                  className="absolute -bottom-3 -right-2 w-10 h-auto object-contain filter drop-shadow"
                />
              </motion.div>

              {/* Right Cards: Event Details, Vinyl & Candle */}
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="w-full bg-[#f8f4ed] text-[#42111a] rounded-xl p-3 border border-[#d6b797] shadow-lg text-center"
                >
                  <p className="text-[10px] font-bold text-[#6d2532] uppercase tracking-wider mb-1">
                    Jam 09.00 - selesai
                  </p>
                  <p className="text-[11px] font-semibold text-[#42111a] leading-tight mb-1">
                    {akadEvent.venue_name || 'Aula Desa Batulawang'}
                  </p>
                  <p className="text-[9px] text-neutral-600 leading-tight">
                    {akadEvent.venue_address || 'Jl. Cisereuh, Kec. Cipanas, Cianjur'}
                  </p>
                </motion.div>

                {/* Vinyl Record & Candle Row */}
                <div className="w-full flex items-center justify-around px-2 pt-2">
                  {/* Vinyl Music Player */}
                  <div
                    onClick={toggleAudio}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      className="w-16 h-16 rounded-full overflow-hidden shadow-lg border border-neutral-700"
                    >
                      <img
                        src={LACE10_ASSETS.vinylRecord}
                        alt="Vinyl"
                        className="w-full h-full object-contain"
                      />
                    </motion.div>
                    <span className="text-[8px] uppercase tracking-widest text-[#f5ebd8] mt-1 group-hover:text-white">
                      {isPlaying ? 'Pause music' : 'Tap to music'}
                    </span>
                  </div>

                  {/* Brass Candle Holder */}
                  <div className="w-10 flex flex-col items-center">
                    <img
                      src={LACE10_ASSETS.candleBrassStand}
                      alt="Candle"
                      className="w-full h-auto object-contain filter drop-shadow"
                    />
                  </div>
                </div>
              </div>
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
            className="relative w-full px-5 py-14 overflow-hidden flex flex-col items-center"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgGreenDraped})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Laser-Cut White Arched Lace Frame */}
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative w-full max-w-sm bg-[#f8f4ed] text-[#3b1219] rounded-[40px] px-6 py-10 shadow-2xl border-4 border-[#fffdfa] flex flex-col items-center text-center"
            >
              {/* Lace border overlay inside */}
              <div className="absolute inset-2 border border-dashed border-[#851c2d]/30 rounded-[34px] pointer-events-none"></div>

              {/* Bismillah Calligraphy */}
              <div className="w-44 mb-4">
                <svg viewBox="0 0 300 80" className="w-full h-auto fill-[#851c2d]">
                  <path d="M150,15 C120,15 90,25 70,35 C90,45 120,55 150,55 C180,55 210,45 230,35 C210,25 180,15 150,15 Z" opacity="0.1" />
                  <text
                    x="150"
                    y="45"
                    textAnchor="middle"
                    className="font-serif text-2xl font-bold fill-[#851c2d]"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </text>
                </svg>
              </div>

              {/* Greeting */}
              <p className="text-xs sm:text-sm font-serif text-neutral-800 leading-relaxed mb-6 px-2">
                Assalamualaikum Warahmatullahi Wabarakatuh
                <br />
                <span className="text-[11px] text-neutral-600 font-sans block mt-1">
                  Tanpa mengurangi rasa hormat kami, dengan memohon Rahmat dan Ridho Allah SWT, kami mengundang Anda untuk menjadi bagian dari hari bahagia kami:
                </span>
              </p>

              {/* Bride Profile */}
              <div className="mb-4">
                <h2
                  className="text-3xl sm:text-4xl text-[#7a1827] tracking-wide"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  {brideName}
                </h2>
                <p className="text-[11px] text-neutral-600 font-sans mt-1">
                  Putri dari {brideFather} &amp; {brideMother}
                </p>
              </div>

              {/* Ampersand Divider */}
              <div className="text-2xl text-[#851c2d] my-1 font-serif italic">&amp;</div>

              {/* Groom Profile */}
              <div className="mt-2 mb-6">
                <h2
                  className="text-3xl sm:text-4xl text-[#7a1827] tracking-wide"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  {groomName}
                </h2>
                <p className="text-[11px] text-neutral-600 font-sans mt-1">
                  Putra dari {groomFather} &amp; {groomMother}
                </p>
              </div>

              {/* Closing blessing text */}
              <p className="text-[11px] text-neutral-600 italic font-serif leading-relaxed px-4">
                "Kehadiran serta doa restu Anda akan sangat berarti bagi perjalanan kehidupan baru kami."
              </p>
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
                className="relative w-64 h-80 rounded-2xl p-2 bg-[#f8f4ed] border-2 border-[#caa472] shadow-2xl flex items-center justify-center cursor-pointer group"
                onClick={() => setLightboxImg(rawGallery[3] || LACE10_ASSETS.defaultPhotos.bridePortrait1)}
              >
                <img
                  src={rawGallery[3] || LACE10_ASSETS.defaultPhotos.bridePortrait1}
                  alt="Bride Portrait 1"
                  className="w-full h-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500"
                />
                <img
                  src={LACE10_ASSETS.laceScallopFrame}
                  alt="Lace Border"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative w-64 h-80 rounded-2xl p-2 bg-[#f8f4ed] border-2 border-[#caa472] shadow-2xl flex items-center justify-center cursor-pointer group"
                onClick={() => setLightboxImg(rawGallery[4] || LACE10_ASSETS.defaultPhotos.bridePortrait2)}
              >
                <img
                  src={rawGallery[4] || LACE10_ASSETS.defaultPhotos.bridePortrait2}
                  alt="Bride Portrait 2"
                  className="w-full h-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-500"
                />
                <img
                  src={LACE10_ASSETS.laceScallopFrame}
                  alt="Lace Border"
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none"
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
            className="relative w-full px-5 py-14 flex flex-col items-center overflow-hidden"
            style={{
              backgroundImage: `url(${LACE10_ASSETS.bgRedVelvet})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative w-full max-w-sm bg-[#f8f4ed] text-[#42111a] rounded-[45px] p-8 sm:p-10 shadow-2xl border-4 border-[#fffefc] text-center flex flex-col items-center justify-center"
            >
              <div className="absolute inset-3 border border-dotted border-[#851c2d]/40 rounded-[38px] pointer-events-none"></div>

              <p className="text-sm sm:text-base font-serif italic text-neutral-800 leading-relaxed mb-4">
                &ldquo;Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.&rdquo;
              </p>
              <p className="text-xs uppercase tracking-[0.25em] text-[#851c2d] font-bold">
                Qs. Ar-Rum : 21
              </p>
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

            {/* Casual Polaroids / Candids */}
            <div className="w-full flex items-center justify-center gap-3 my-4">
              {LACE10_ASSETS.defaultPhotos.casualMoments.slice(0, 3).map((img, i) => (
                <div
                  key={`candid-${i}`}
                  onClick={() => setLightboxImg(img)}
                  className="w-24 h-28 bg-[#f8f4ed] p-1.5 pb-4 shadow-xl rounded border border-[#caa472] transform hover:scale-105 transition-transform cursor-pointer"
                  style={{ rotate: i % 2 === 0 ? '-3deg' : '4deg' }}
                >
                  <img src={img} alt="Candid" className="w-full h-full object-cover rounded-xs" />
                </div>
              ))}
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
                      className="px-3 py-1 rounded-full bg-[#821c2c] text-white text-[10px] font-sans uppercase tracking-wider hover:bg-[#5c1320] transition-colors shadow"
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
                    className="w-full py-2.5 mt-2 rounded-lg bg-[#821c2c] text-white text-xs font-sans uppercase tracking-widest font-semibold hover:bg-[#5c1320] transition-colors shadow"
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
                  className="py-2 rounded-lg bg-[#821c2c] text-white text-xs font-sans uppercase tracking-wider font-semibold hover:bg-[#5c1320] transition-colors"
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
