"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Coins, MapPin, Users } from "lucide-react";
import { SectionHeader } from "./principles";

export function SquadNetworkSection() {
  return (
    <section id="squad-network" className="sq-section sq-section-network">
      <div className="sq-container">
        <SectionHeader
          eyebrow="Squad Network"
          title={
            <>
              Когда мастер занят — <br className="hidden md:block" />
              <span className="sq-grad-text">клиент не уходит к конкуренту.</span>
            </>
          }
          subtitle="Сквад — это группа мастеров, которые доверяют друг другу. Бот автоматически предлагает коллегу из сети, мастер-источник получает реферальный процент."
        />

        <div className="sq-network-grid">
          <div className="sq-network-vis">
            <NetworkVisualization />
          </div>

          <div className="sq-network-steps">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="sq-net-step"
              >
                <div className="sq-net-step-num">{s.num}</div>
                <div>
                  <div className="sq-net-step-title">{s.title}</div>
                  <div className="sq-net-step-body">{s.body}</div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="sq-net-callout"
            >
              <Coins className="h-4 w-4" />
              <span>
                <b>Пример:</b> услуга 100 BYN, реферал 10% → мастер-источник
                получает <b>8.5 BYN</b>, платформа — 1.5 BYN.
              </span>
            </motion.div>
          </div>
        </div>

        <div className="sq-network-extras">
          <ExtraCard
            icon={Users}
            title="Создатель задаёт правила"
            body="% комиссии, условия входа: открытый сквад, по приглашению, по одобрению. Размер 3–10 мастеров одной ниши."
          />
          <ExtraCard
            icon={MapPin}
            title="Маршрутизация умная"
            body="Фильтр по нише, рейтингу, ближайшему слоту, геолокации. Клиент видит карточку: имя, услуга, цена, время."
          />
          <ExtraCard
            icon={Coins}
            title="База клиентов защищена"
            body="Клиент остаётся за источником. Каждый повторный переход — снова процент мастеру-источнику."
          />
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    num: "1",
    title: "Клиент пишет мастеру А",
    body: "Все слоты на эту неделю заняты — обычно тут клиент уходит навсегда.",
  },
  {
    num: "2",
    title: "Бот предлагает альтернативу",
    body: "«Хотите записаться к другому мастеру в ближайшее время?»",
  },
  {
    num: "3",
    title: "Клиент выбирает мастера Б",
    body: "Видит карточку коллеги из сквада — рейтинг, цена, ближайший слот.",
  },
  {
    num: "4",
    title: "Мастер А получает процент",
    body: "Автоматически после подтверждения. Выплата через внутренний баланс.",
  },
];

function ExtraCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="sq-extra-card"
    >
      <div className="sq-extra-icon">
        <Icon className="h-4 w-4" />
      </div>
      <div className="sq-extra-title">{title}</div>
      <div className="sq-extra-body">{body}</div>
    </motion.div>
  );
}

function NetworkVisualization() {
  // Animated nodes: 1 source master + 4 squad members + flow lines
  return (
    <div className="sq-net-canvas">
      <svg viewBox="0 0 360 360" className="sq-net-svg">
        <defs>
          <linearGradient id="sqLink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="sqGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* connector lines */}
        {NODES.map((n, i) => (
          <motion.line
            key={`l-${i}`}
            x1="180"
            y1="180"
            x2={n.x}
            y2={n.y}
            stroke="url(#sqLink)"
            strokeWidth="1.5"
            strokeDasharray="3 6"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }}
          />
        ))}

        {/* animated pulse along one line */}
        <motion.circle
          r="4"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            cx: [180, 280],
            cy: [180, 100],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: "easeInOut",
          }}
        />

        {/* center node (mastery source) */}
        <circle cx="180" cy="180" r="50" fill="url(#sqGlow)" />
        <circle
          cx="180"
          cy="180"
          r="28"
          fill="hsl(var(--surface))"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
        <text
          x="180"
          y="186"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="hsl(var(--primary))"
        >
          А
        </text>

        {/* squad nodes */}
        {NODES.map((n, i) => (
          <g key={`n-${i}`}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r="20"
              fill="hsl(var(--surface))"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
            />
            <motion.text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="hsl(var(--text-dim))"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
            >
              {n.label}
            </motion.text>
          </g>
        ))}
      </svg>

      <div className="sq-net-legend">
        <span className="sq-legend-dot sq-legend-source" />
        Мастер-источник
        <span className="sq-legend-dot sq-legend-squad" />
        Сквад
      </div>
    </div>
  );
}

const NODES = [
  { x: 280, y: 100, label: "Б" },
  { x: 300, y: 220, label: "В" },
  { x: 80, y: 110, label: "Г" },
  { x: 60, y: 230, label: "Д" },
  { x: 180, y: 50, label: "Е" },
  { x: 180, y: 310, label: "Ж" },
];
