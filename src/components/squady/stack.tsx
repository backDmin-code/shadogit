"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bot, Network, Trophy } from "lucide-react";
import { SectionHeader } from "./principles";

const LAYERS = [
  {
    n: "Слой 1",
    title: "Bot Layer",
    sub: "Умный бот записи",
    desc:
      "Telegram-бот, который создаётся автоматически для каждого мастера. Голос, текст, кнопки — клиент общается как удобно.",
    icon: Bot,
    color: "lime",
    points: [
      "Распознавание имени, услуги и времени из сообщения",
      "Голос через Whisper и AI-понимание контекста",
      "Синхронизация с Google Calendar",
      "Managed Bots: без BotFather, в 1 клик",
    ],
  },
  {
    n: "Слой 2",
    title: "Squad Network",
    sub: "Реферальная сеть",
    desc:
      "Если мастер занят — клиент уходит к коллеге из сквада. Мастер-источник получает процент. Клиенты не теряются.",
    icon: Network,
    color: "pink",
    points: [
      "Авто-маршрутизация по нише, рейтингу, ближайшему слоту",
      "Реферальный процент 5–15%, настраивается создателем",
      "Защита базы: клиент остаётся за источником",
      "Открытый сквад, по приглашению или по одобрению",
    ],
  },
  {
    n: "Слой 3",
    title: "Loyalty Engine",
    sub: "Программа лояльности",
    desc:
      "Бонусы, уровни, акции и QR-карта прямо в Telegram. От штамп-карты в кофейне до курсовой механики у косметолога.",
    icon: Trophy,
    color: "mint",
    points: [
      "Уровни: Бронза → Серебро → Золото → Платина",
      "N-я покупка в подарок, бонус в день рождения",
      "QR-карта в Apple/Google Wallet",
      "Аналитика: retention, средний чек, активность",
    ],
  },
];

export function SquadyStack() {
  return (
    <section id="stack" className="sq-section sq-section-stack">
      <div className="sq-container">
        <SectionHeader
          eyebrow="Три слоя продукта"
          title={
            <>
              Один продукт. <br className="hidden md:block" />
              <span className="sq-grad-text">Три независимых модуля.</span>
            </>
          }
          subtitle="Подключите всё сразу или начните с одного. Незадействованные разделы не отображаются — интерфейс адаптируется."
        />

        <div className="sq-stack-grid">
          {LAYERS.map((l, i) => (
            <motion.div
              key={l.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className={`sq-stack-card sq-accent-${l.color}`}
            >
              <div className="sq-stack-card-glow" />
              <div className="sq-stack-num">{l.n}</div>
              <div className="sq-stack-icon">
                <l.icon className="h-6 w-6" />
              </div>
              <h3 className="sq-stack-title">{l.title}</h3>
              <div className="sq-stack-sub">{l.sub}</div>
              <p className="sq-stack-desc">{l.desc}</p>
              <ul className="sq-stack-list">
                {l.points.map((pt) => (
                  <li key={pt}>
                    <span className="sq-stack-dot" />
                    {pt}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
