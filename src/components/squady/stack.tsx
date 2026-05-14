"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bot, Network, Trophy, Check } from "lucide-react";
import { SectionHeader } from "./principles";

const LAYERS = [
  {
    n: "Слой 01",
    title: "Bot Layer",
    sub: "Умный бот записи",
    desc:
      "Telegram-бот, который создаётся автоматически для каждого мастера. Голос, текст, кнопки — клиент общается как удобно.",
    icon: Bot,
    points: [
      "Распознаёт имя, услугу и время из сообщения",
      "Голос через Whisper, AI понимает контекст",
      "Двусторонняя синхронизация с Google Calendar",
      "Managed Bots: без BotFather, в один клик",
    ],
  },
  {
    n: "Слой 02",
    title: "Squad Network",
    sub: "Реферальная сеть",
    desc:
      "Если мастер занят — клиент уходит к коллеге из сквада. Мастер-источник получает процент. Клиенты не теряются.",
    icon: Network,
    points: [
      "Авто-маршрутизация по нише, рейтингу, слоту",
      "Реферальный процент 5–15%",
      "Защита базы: клиент закреплён за источником",
      "Открытый сквад, по приглашению или по одобрению",
    ],
  },
  {
    n: "Слой 03",
    title: "Loyalty Engine",
    sub: "Программа лояльности",
    desc:
      "Бонусы, уровни, акции и QR-карта прямо в Telegram. От штамп-карты в кофейне до курсов у косметолога.",
    icon: Trophy,
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
              Один продукт.{" "}
              <span className="sq-it" style={{ color: "var(--lime)" }}>
                три независимых модуля.
              </span>
            </>
          }
          subtitle="Подключите всё сразу или начните с одного. Незадействованные модули не отображаются — интерфейс адаптируется под ваш стек."
        />

        <div className="sq-stack-grid">
          {LAYERS.map((l, i) => (
            <motion.div
              key={l.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className={`sq-stack-card sq-stack-card-${i + 1}`}
            >
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
                    <span className="sq-stack-check">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
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
