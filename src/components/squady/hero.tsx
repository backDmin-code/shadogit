"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Calendar, Network, Gift } from "lucide-react";

export function SquadyHero() {
  return (
    <section className="sq-hero">
      <div className="sq-hero-bg">
        <div className="sq-orb sq-orb-1" />
        <div className="sq-orb sq-orb-2" />
        <div className="sq-orb sq-orb-3" />
        <div className="sq-grid" />
      </div>

      <div className="sq-container relative z-10">
        <div className="sq-hero-grid">
          <div className="sq-hero-copy">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="sq-eyebrow"
            >
              <Sparkles className="h-3 w-3" />
              Сквады · v0.1 · концепция
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="sq-h1"
            >
              Инфраструктура{" "}
              <span className="sq-grad-text">сотрудничества</span>
              <br />
              для малого бизнеса.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12 }}
              className="sq-lead"
            >
              Умный бот записи в Telegram, реферальная сеть мастеров и
              встроенная программа лояльности — в одной платформе. Без разработки,
              без BotFather, без хаоса.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="sq-cta-row"
            >
              <Link href="#pricing" className="sq-btn-primary">
                Попробовать 30 дней бесплатно
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#stack" className="sq-btn-secondary">
                Как это работает
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="sq-hero-chips"
            >
              <span className="sq-chip">
                <Calendar className="h-3 w-3" /> Бот записи
              </span>
              <span className="sq-chip">
                <Network className="h-3 w-3" /> Squad Network
              </span>
              <span className="sq-chip">
                <Gift className="h-3 w-3" /> Программа лояльности
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="sq-hero-visual"
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
    <div className="sq-phone-wrap">
      <div className="sq-phone-shadow" />
      <div className="sq-phone">
        <div className="sq-phone-notch" />
        <div className="sq-phone-screen">
          <div className="sq-tg-header">
            <div className="sq-tg-avatar">A</div>
            <div className="sq-tg-name">
              <div className="sq-tg-name-l1">Анна · Барбер</div>
              <div className="sq-tg-name-l2">bot · онлайн</div>
            </div>
          </div>

          <div className="sq-tg-chat">
            <Bubble side="in" delay={0}>
              Привет! Я бот Анны. Запишу вас на стрижку — напишите или скажите
              голосом 🎙️
            </Bubble>
            <Bubble side="out" delay={0.6}>
              Хочу постричься в пятницу вечером
            </Bubble>
            <Bubble side="in" delay={1.2}>
              Свободно пт, 18:30 или 19:00. Какое подходит?
            </Bubble>
            <Bubble side="out" delay={1.8}>
              19:00 👍
            </Bubble>
            <Bubble side="in" delay={2.4} highlight>
              Записал! Анна получит уведомление. Сохранил +50 бонусов 💎
            </Bubble>
          </div>

          <div className="sq-tg-input">
            <span>Поделиться номером</span>
            <span className="sq-tg-mic">🎙️</span>
          </div>
        </div>
      </div>

      <FloatingCard
        className="sq-float-card-1"
        delay={0.4}
        title="Реферал засчитан"
        subtitle="Мастер А → Б · +8.5 BYN"
        emoji="🔗"
      />
      <FloatingCard
        className="sq-float-card-2"
        delay={0.7}
        title="Уровень: Золото"
        subtitle="10 визитов · +20% бонусов"
        emoji="🏆"
      />
    </div>
  );
}

function Bubble({
  side,
  children,
  delay,
  highlight,
}: {
  side: "in" | "out";
  children: React.ReactNode;
  delay: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5 + delay }}
      className={`sq-bubble sq-bubble-${side} ${highlight ? "sq-bubble-hl" : ""}`}
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
  className?: string;
  delay: number;
  title: string;
  subtitle: string;
  emoji: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 1 + delay, ease: [0.16, 1, 0.3, 1] }}
      className={`sq-float-card ${className ?? ""}`}
    >
      <div className="sq-float-emoji">{emoji}</div>
      <div>
        <div className="sq-float-title">{title}</div>
        <div className="sq-float-sub">{subtitle}</div>
      </div>
    </motion.div>
  );
}
