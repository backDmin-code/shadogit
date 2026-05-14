"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Calendar, Network, Gift } from "lucide-react";

export function SquadyHero() {
  return (
    <section className="sq-hero">
      <div className="sq-hero-dots" aria-hidden />
      <div className="sq-hero-blob sq-hero-blob-1" aria-hidden />
      <div className="sq-hero-blob sq-hero-blob-2" aria-hidden />
      <div className="sq-hero-blob sq-hero-blob-3" aria-hidden />

      <div className="sq-container">
        <div className="sq-hero-grid">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -1.5 }}
              transition={{ duration: 0.6 }}
              className="sq-eyebrow"
            >
              <Sparkles className="h-3 w-3" />
              Сквады · платформа для микро-бизнеса
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="sq-display"
              style={{ marginTop: 20 }}
            >
              Малый бизнес — это{" "}
              <span className="sq-it" style={{ color: "var(--magenta)" }}>
                не одиночество.
              </span>
              <br />
              Это{" "}
              <span
                style={{
                  background: "var(--lime)",
                  padding: "0 12px",
                  borderRadius: 14,
                  border: "3px solid var(--ink)",
                  boxShadow: "5px 5px 0 var(--ink)",
                  display: "inline-block",
                  transform: "rotate(-2deg)",
                }}
              >
                сквад.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="sq-lead"
              style={{ marginTop: 24 }}
            >
              Бот записи в Telegram, реферальная сеть мастеров и программа
              лояльности — в одной платформе. Без разработки, без BotFather, без
              хаоса. С первого дня.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              style={{
                marginTop: 30,
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                alignItems: "center",
              }}
            >
              <Link href="#pricing" className="sq-btn sq-btn-primary sq-btn-lg">
                30 дней бесплатно
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#stack" className="sq-btn sq-btn-secondary sq-btn-lg">
                Как это работает
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="sq-hero-stickers"
            >
              <span className="sq-pill sq-pill-lime">
                <Calendar className="h-3 w-3" /> Бот записи
              </span>
              <span className="sq-pill sq-pill-sky">
                <Network className="h-3 w-3" /> Squad Network
              </span>
              <span className="sq-pill sq-pill-pink">
                <Gift className="h-3 w-3" /> Лояльность
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="sq-pile"
              style={{ marginTop: 28 }}
            >
              <span
                className="sq-pile-avatar"
                style={{ background: "var(--lime)" }}
              >
                А
              </span>
              <span
                className="sq-pile-avatar"
                style={{ background: "var(--magenta)", color: "var(--cream)" }}
              >
                М
              </span>
              <span
                className="sq-pile-avatar"
                style={{ background: "var(--sky)" }}
              >
                К
              </span>
              <span
                className="sq-pile-avatar"
                style={{ background: "var(--yellow)" }}
              >
                Н
              </span>
              <span className="sq-pile-text">
                <b>Уже работают</b>: барберы, психологи, репетиторы,
                <br />
                салоны, мастера ногтевого сервиса.
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="sq-phone-stage"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <>
      <div className="sq-phone">
        <div className="sq-phone-notch" />
        <div className="sq-phone-screen">
          <div className="sq-tg-header">
            <div className="sq-tg-avatar">А</div>
            <div>
              <div className="sq-tg-name-l1">Анна · Барбер</div>
              <div className="sq-tg-name-l2">bot · online</div>
            </div>
          </div>

          <div className="sq-tg-chat">
            <Bubble side="in" delay={0}>
              Привет! Я бот Анны. Запишу вас на стрижку — напишите или скажите
              голосом 🎙️
            </Bubble>
            <Bubble side="out" delay={0.5}>
              Хочу постричься в пятницу
            </Bubble>
            <Bubble side="in" delay={1.0}>
              Свободно пт, 18:30 или 19:00 — какое?
            </Bubble>
            <Bubble side="out" delay={1.5}>
              19:00 👍
            </Bubble>
            <Bubble side="in" delay={2.0} highlight>
              Записал! +50 бонусов 💎
            </Bubble>
          </div>

          <div className="sq-tg-input">
            <span>Сообщение…</span>
            <span className="sq-tg-mic">🎙️</span>
          </div>
        </div>
      </div>

      <FloatingCard
        className="sq-phone-float sq-phone-float-1"
        delay={0.4}
        title="+8.5 BYN"
        subtitle="реферал засчитан"
        emoji="🔗"
      />
      <FloatingCard
        className="sq-phone-float sq-phone-float-2"
        delay={0.7}
        title="Silver"
        subtitle="2 280 бонусов"
        emoji="🥈"
      />
    </>
  );
}

function Bubble({
  side,
  delay,
  highlight,
  children,
}: {
  side: "in" | "out";
  delay: number;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 + delay }}
      className={`sq-bubble sq-bubble-${side} ${
        highlight ? "sq-bubble-hl" : ""
      }`}
    >
      {children}
    </motion.div>
  );
}

function FloatingCard({
  className,
  delay,
  title,
  subtitle,
  emoji,
}: {
  className: string;
  delay: number;
  title: string;
  subtitle: string;
  emoji: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: 0.9 + delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      <div className="sq-float-emoji">{emoji}</div>
      <div>
        <div className="sq-float-title">{title}</div>
        <div className="sq-float-sub">{subtitle}</div>
      </div>
    </motion.div>
  );
}
