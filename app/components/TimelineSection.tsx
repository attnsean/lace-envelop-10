'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LACE10_ASSETS } from '../../lib/laceAssets';

export interface StoryEvent {
  id?: string;
  year: string;
  title: string;
  desc: string;
  date?: string;
  order?: number;
  image_url?: string;
}

interface TimelineSectionProps {
  loveStoryItems?: StoryEvent[] | null;
  groomName?: string;
  brideName?: string;
}

const DEFAULT_STORIES: StoryEvent[] = [
  {
    id: "1",
    year: "2020",
    title: "Pertemuan Pertama",
    desc: "Tak ada yang kebetulan di dunia ini. Dari sebuah tatap yang tak disengaja di tengah kesibukan kota, semesta mulai menenun takdir kami berdua.",
    order: 1,
  },
  {
    id: "2",
    year: "2022",
    title: "Merajut Rasa & Cerita",
    desc: "Melalui ribuan tawa, air mata, dan perjalanan panjang bersama, kami menyadari bahwa rumah bukanlah sebuah tempat, melainkan saat bersandar satu sama lain.",
    order: 2,
  },
  {
    id: "3",
    year: "2025",
    title: "Mengikat Janji (The Proposal)",
    desc: "Di bawah senja yang tenang dan ketulusan hati, sebuah komitmen terucap dan cincin melingkar indah sebagai tanda kesiapan melangkah ke gerbang hidup baru.",
    order: 3,
  },
  {
    id: "4",
    year: "2026",
    title: "Menuju Keabadian (The Wedding)",
    desc: "Kini, dengan penuh rasa syukur di hadapan keluarga tercinta, kami membuka lembaran baru kehidupan untuk mengarungi bahtera rumah tangga selamanya.",
    order: 4,
  },
];

export default function TimelineSection({
  loveStoryItems,
  groomName = "Sopyan",
  brideName = "Zahra",
}: TimelineSectionProps) {
  if (!loveStoryItems || loveStoryItems.length === 0) {
    return null;
  }

  const events = [...loveStoryItems].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section
      className="relative w-full px-4 sm:px-6 py-16 flex flex-col items-center overflow-hidden select-none"
      style={{
        backgroundImage: `url(${LACE10_ASSETS.bgRedVelvet})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Luxury Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b0306]/85 via-black/40 to-[#1b0306]/85 pointer-events-none" />

      {/* Decorative Floral Accent Top */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-28 sm:w-32 mb-2 pointer-events-none"
      >
        <img
          src={LACE10_ASSETS.sec1LaceRibbon}
          alt="Lace Ribbon Divider"
          className="w-full h-auto object-contain opacity-90 drop-shadow-md"
        />
      </motion.div>

      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 text-center mb-10 max-w-sm px-2"
      >
        <span className="text-[10px] tracking-[0.35em] text-[#caa472] uppercase font-serif block mb-1">
          Our Journey
        </span>
        <h2
          className="text-4xl sm:text-5xl text-[#f5ebd8] drop-shadow-md mb-2"
          style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
        >
          Love Story
        </h2>
        <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#caa472] to-transparent mx-auto my-2" />
        <p className="text-xs sm:text-[13px] font-serif italic text-[#e8cfb5] leading-relaxed">
          Kisah perjalanan cinta kami berdua hingga melangkah menuju ikatan suci
        </p>
      </motion.div>

      {/* Vertical Timeline Tree */}
      <div className="relative z-10 w-full max-w-[390px] mx-auto flex flex-col items-center">
        {/* Central Golden Spine */}
        <div className="absolute top-4 bottom-6 left-6 sm:left-7 w-[2px] bg-gradient-to-b from-[#caa472]/20 via-[#caa472] to-[#caa472]/20 shadow-[0_0_8px_rgba(202,164,114,0.5)] pointer-events-none" />

        <div className="w-full flex flex-col gap-8">
          {events.map((event, idx) => {
            const displayYear = event.year || event.date || `Chapter ${idx + 1}`;
            return (
              <motion.div
                key={event.id || `story-${idx}`}
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, margin: "-20px" }}
                transition={{ duration: 0.7, delay: idx * 0.12 }}
                className="relative w-full flex items-start pl-14 sm:pl-16 pr-1"
              >
                {/* Milestone Node on Spine */}
                <div className="absolute left-[17px] sm:left-[21px] top-3.5 w-5 h-5 rounded-full bg-[#691422] border-2 border-[#caa472] shadow-[0_0_12px_rgba(202,164,114,0.8)] flex items-center justify-center z-20">
                  <span className="w-2 h-2 rounded-full bg-[#fbf7f0] shadow-sm animate-pulse" />
                </div>

                {/* Parchment Story Card */}
                <div className="w-full bg-[#fcf9f2] text-neutral-800 rounded-2xl p-4 sm:p-5 border-2 border-[#caa472] shadow-[0_12px_28px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#dfc093] transition-colors">
                  {/* Card Corner Lace Flourish */}
                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-20 bg-gradient-to-bl from-[#851c2d] to-transparent rounded-bl-3xl" />

                  {/* Year / Chapter Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#751727] border border-[#caa472]/50 text-[#f5ebd8] text-[11px] font-serif font-bold uppercase tracking-widest shadow-xs mb-2">
                    <span className="text-[#caa472] text-xs">❦</span>
                    <span>{displayYear}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-bold text-[#611220] font-serif tracking-wide mb-1.5 leading-snug">
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-neutral-700 font-serif leading-relaxed font-normal">
                    {event.desc}
                  </p>

                  {/* Optional Photo if event has image */}
                  {event.image_url && (
                    <div className="mt-3 w-full h-36 rounded-xl overflow-hidden border border-[#caa472]/40 shadow-inner">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Decorative Bottom Arch */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="relative z-10 mt-10 text-center select-none pointer-events-none"
      >
        <div className="flex items-center justify-center gap-2 text-[#caa472]/70">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#caa472]" />
          <span className="text-sm font-serif text-[#caa472]">
            {brideName} &amp; {groomName}
          </span>
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#caa472]" />
        </div>
      </motion.div>
    </section>
  );
}
