"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Coins, MapPin, Users } from "lucide-react";
import { SectionHeader } from "./principles";

export function SquadNetworkSection() {
  return (
    <section id="squad-network" className="sq-section sq-network">
      <div className="sq-container">
        <SectionHeader
          eyebrow="Squad Network"
          title={
            <>
              Когда мастер занят —{" "}
              <span className="sq-it" style={{ color: "var(--lime)" }}>
                клиент не уходит.
              </span>
            </>
          }
          subtitle="Сквад — это группа мастеров, которые доверяют друг другу. Бот автоматически предлагает коллегу из сети, мастер-источник получает реферальный процент."
        />

        <div className="sq-network-grid">
          <div>
            <NetworkVisualization />
          </div>

          <div className="sq-steps">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="sq-step"
              >
                <div className="sq-step-num">{s.num}</div>
                <div>
                  <div className="sq-step-title">{s.title}</div>
                  <div className="sq-step-body">{s.body}</div>
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

        <div className="sq-net-extras">
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
      className="sq-net-extra"
    >
      <div className="sq-net-extra-icon">
        <Icon className="h-4 w-4" />
      </div>
      <div className="sq-net-extra-title">{title}</div>
      <div className="sq-net-extra-body">{body}</div>
    </motion.div>
  );
}

function NetworkVisualization() {
  // Animated nodes: 1 source master + 4 squad members + flow lines
  return (
    <div className="sq-net-canvas">
      <svg viewBox="0 0 360 360" className="sq-net-svg">
        <defs>
          <radialGradient id="sqGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FF3F8E" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FF3F8E" stopOpacity="0" />
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
            stroke="#0E0B16"
            strokeWidth="2"
            strokeDasharray="4 6"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }}
          />
        ))}

        {/* animated pulse along one line */}
        <motion.circle
          r="6"
          fill="#FF3F8E"
          stroke="#0E0B16"
          strokeWidth="2"
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

        {/* center node (master source) */}
        <circle cx="180" cy="180" r="60" fill="url(#sqGlow)" />
        <circle
          cx="180"
          cy="180"
          r="32"
          fill="#FF3F8E"
          stroke="#0E0B16"
          strokeWidth="3"
        />
        <text
          x="180"
          y="187"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="#FFF6E5"
          fontFamily="var(--font-display-alt)"
        >
          А
        </text>

        {/* squad nodes */}
        {NODES.map((n, i) => (
          <g key={`n-${i}`}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r="24"
              fill={["#C8F046", "#5BCEFA", "#FFDD55", "#9BF0CC", "#FF8C42", "#FFFAF0"][i % 6]}
              stroke="#0E0B16"
              strokeWidth="2.5"
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
            />
            <motion.text
              x={n.x}
              y={n.y + 6}
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#0E0B16"
              fontFamily="var(--font-display-alt)"
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
