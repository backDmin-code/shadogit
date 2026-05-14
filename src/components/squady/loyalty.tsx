"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Gift, Star, Cake, Sparkles, Wallet } from "lucide-react";
import { SectionHeader } from "./principles";

const LEVELS = [
  { name: "Бронза", color: "#cd7f32", perk: "Базовое начисление", from: 1 },
  { name: "Серебро", color: "#c0c0c0", perk: "+10% к бонусам, скидка 5%", from: 5 },
  { name: "Золото", color: "#febc2e", perk: "+20% к бонусам, скидка 10%", from: 10 },
  { name: "Платина", color: "#a4f3ff", perk: "VIP-условия", from: 20 },
];

const MECHANICS = [
  { icon: Gift, title: "N-я покупка в подарок", body: "10-я чашка кофе или 10-я шаурма бесплатно — штамп-карта в Telegram." },
  { icon: Cake, title: "Бонус в день рождения", body: "Автоматическое начисление в нужную дату — клиент возвращается." },
  { icon: Sparkles, title: "Двойные бонусы", body: "Акция на период или услугу — мастер настраивает в один клик." },
  { icon: Wallet, title: "QR-карта в Wallet", body: "Apple/Google Wallet или сразу в боте — без пластика." },
];

export function LoyaltySection() {
  return (
    <section id="loyalty" className="sq-section sq-section-loyalty">
      <div className="sq-container">
        <SectionHeader
          eyebrow="Loyalty Engine"
          title={
            <>
              Программа лояльности, которой{" "}
              <span className="sq-grad-text">пользуются на самом деле.</span>
            </>
          }
          subtitle="Бонусы, уровни и акции прямо в Telegram-боте мастера. От штамп-карты в кофейне до курсовой механики у косметолога."
        />

        <div className="sq-loyalty-grid">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="sq-loyalty-card-wrap"
          >
            <LoyaltyCardVisual />
          </motion.div>

          <div className="sq-loyalty-content">
            <div className="sq-loyalty-levels">
              {LEVELS.map((l, i) => (
                <motion.div
                  key={l.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="sq-level-row"
                >
                  <div
                    className="sq-level-badge"
                    style={{
                      background: `linear-gradient(135deg, ${l.color}33, ${l.color}11)`,
                      color: l.color,
                      borderColor: `${l.color}55`,
                    }}
                  >
                    <Star className="h-3 w-3" />
                    {l.name}
                  </div>
                  <div className="sq-level-perk">{l.perk}</div>
                  <div className="sq-level-from">от {l.from} визитов</div>
                </motion.div>
              ))}
            </div>

            <div className="sq-mechanics-grid">
              {MECHANICS.map((m, i) => (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.06 }}
                  className="sq-mech-item"
                >
                  <div className="sq-mech-icon">
                    <m.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="sq-mech-title">{m.title}</div>
                    <div className="sq-mech-body">{m.body}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoyaltyCardVisual() {
  return (
    <div className="sq-card-3d">
      <motion.div
        className="sq-loyalty-card"
        animate={{
          rotateX: [0, 4, 0, -4, 0],
          rotateY: [0, -4, 0, 4, 0],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="sq-loyalty-card-bg" />
        <div className="sq-loyalty-card-grain" />

        <div className="sq-loyalty-card-top">
          <div className="sq-loyalty-card-brand">
            <span className="sq-loyalty-logo">сq</span>
            <span className="sq-loyalty-card-name">Squady · Loyalty</span>
          </div>
          <div className="sq-loyalty-level-pill">
            <Star className="h-3 w-3" />
            Золото
          </div>
        </div>

        <div className="sq-loyalty-card-mid">
          <div className="sq-loyalty-balance">
            <span className="sq-loyalty-balance-label">Баланс</span>
            <span className="sq-loyalty-balance-value">1 240 <small>бонусов</small></span>
          </div>
          <div className="sq-loyalty-progress">
            <div className="sq-loyalty-progress-bar">
              <motion.div
                className="sq-loyalty-progress-fill"
                initial={{ width: 0 }}
                whileInView={{ width: "68%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
              />
            </div>
            <div className="sq-loyalty-progress-meta">
              <span>До Платины</span>
              <span>7 / 20 визитов</span>
            </div>
          </div>
        </div>

        <div className="sq-loyalty-card-bottom">
          <div className="sq-loyalty-name">Анна К.</div>
          <div className="sq-loyalty-qr" aria-hidden>
            <QrIcon />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor">
      <rect x="2" y="2" width="8" height="8" rx="1" />
      <rect x="14" y="2" width="8" height="8" rx="1" />
      <rect x="2" y="14" width="8" height="8" rx="1" />
      <rect x="14" y="14" width="3" height="3" />
      <rect x="19" y="14" width="3" height="3" />
      <rect x="14" y="19" width="3" height="3" />
      <rect x="19" y="19" width="3" height="3" />
      <rect x="5" y="5" width="2" height="2" fill="hsl(var(--surface))" />
      <rect x="17" y="5" width="2" height="2" fill="hsl(var(--surface))" />
      <rect x="5" y="17" width="2" height="2" fill="hsl(var(--surface))" />
    </svg>
  );
}
