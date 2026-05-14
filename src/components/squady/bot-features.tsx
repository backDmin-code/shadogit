"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Mic,
  Brain,
  CalendarClock,
  Bell,
  ShieldAlert,
  Sparkles,
  BotIcon,
  KeyRound,
} from "lucide-react";
import { SectionHeader } from "./principles";

const FEATURES = [
  {
    icon: Mic,
    title: "Голос, текст, кнопки",
    body: "Клиент общается как удобно. Whisper транскрибирует голос, AI понимает свободную форму, кнопки — для тех, кто не хочет писать.",
  },
  {
    icon: Brain,
    title: "AI-понимание контекста",
    body: "Из «хочу постричься в пятницу» бот извлекает услугу, время, срочность. Уточнит один вопрос, а не анкету.",
  },
  {
    icon: CalendarClock,
    title: "Google Calendar + слоты",
    body: "Двусторонняя синхронизация. Буферное время, выходные, перерывы. Закрыть слот вручную — два тапа.",
  },
  {
    icon: Bell,
    title: "Умные напоминания",
    body: "Подтверждение, напоминание за 24ч и за 1ч. Ссылка на отмену/перенос — без звонков и переписок.",
  },
  {
    icon: ShieldAlert,
    title: "Триаж и безопасные ответы",
    body: "При острой боли — экстренный слот или прямой контакт. Мастер сам выбирает темы, на которые отвечает бот.",
  },
  {
    icon: BotIcon,
    title: "Managed Bots: без BotFather",
    body: "Платформа создаёт и обновляет бота за клиента. Telegram Bot API 9.6 — токены управляются автоматически.",
  },
  {
    icon: Sparkles,
    title: "Персонализация",
    body: "Имя бота, приветствие, прайс, тон общения, логотип. Витрина мастера — отдельная ссылка с формой записи.",
  },
  {
    icon: KeyRound,
    title: "Rate limiting с первого дня",
    body: "Защита от спама и петель: лимиты на сообщения, голосовые, AI-запросы. Безопасность не докручивается потом.",
  },
];

export function BotFeaturesSection() {
  return (
    <section id="bot" className="sq-section sq-section-features">
      <div className="sq-container">
        <SectionHeader
          eyebrow="Bot Layer"
          title={
            <>
              Персональный ассистент записи —{" "}
              <span className="sq-grad-text">для каждого мастера.</span>
            </>
          }
          subtitle="Появляется автоматически после регистрации. Без копирования токенов, без визита в BotFather, без разработки."
        />

        <div className="sq-features-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
              className="sq-feature-card"
            >
              <div className="sq-feature-icon">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="sq-feature-title">{f.title}</h3>
              <p className="sq-feature-body">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
