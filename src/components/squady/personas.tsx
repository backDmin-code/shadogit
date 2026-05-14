"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "./principles";

const PERSONAS = [
  { emoji: "✂️", title: "Барбер · парикмахер", modules: "Запись + Лояльность", note: "10-я стрижка бесплатно, маршрутизация по мастерам" },
  { emoji: "💎", title: "Косметолог", modules: "Запись + Лояльность", note: "Курсы, противопоказания, фото до/после в карточке" },
  { emoji: "🦷", title: "Стоматолог · клиника", modules: "Все 3 модуля", note: "Триаж острой боли, зубная формула, врачи по специализации" },
  { emoji: "💪", title: "Тренер · фитнес", modules: "Запись + Лояльность", note: "Абонементы, групповые тренировки, прогресс клиента" },
  { emoji: "🧠", title: "Психолог · терапевт", modules: "Запись", note: "Анонимность, видео-сессии, оплата перед визитом" },
  { emoji: "🔧", title: "Сантехник · электрик", modules: "Запись", note: "Выезд: адрес, окно времени, тип объекта" },
  { emoji: "🚗", title: "Автомеханик · детейлер", modules: "Запись + Лояльность", note: "Привязка к авто, история работ, напоминания о ТО" },
  { emoji: "📚", title: "Репетитор · коуч", modules: "Запись + Лояльность", note: "Пакеты занятий, домашка, прогресс ученика" },
  { emoji: "☕", title: "Кофейня · ресторан", modules: "Только лояльность", note: "Штамп-карта, cashback, акции по сегментам" },
  { emoji: "🥐", title: "Пекарня · кондитерская", modules: "Только лояльность", note: "Реферал «приведи друга», бонус в день рождения" },
  { emoji: "🐾", title: "Ветеринар · груминг", modules: "Запись + Лояльность", note: "Карточка питомца, прививки, выезд на дом" },
  { emoji: "📸", title: "Фотограф · ведущий", modules: "Запись", note: "Длинные слоты, предоплата, бриф через бот" },
];

export function PersonasSection() {
  return (
    <section id="personas" className="sq-section sq-personas">
      <div className="sq-container">
        <SectionHeader
          eyebrow="Persona Templates"
          title={
            <>
              Один продукт —{" "}
              <span className="sq-it" style={{ color: "var(--magenta)" }}>
                десятки шаблонов.
              </span>
            </>
          }
          subtitle="Выбираете нишу при регистрации — платформа подстраивает дашборд, карточку клиента, сценарий бота и формулировки. Шаблон можно сменить в любой момент."
        />

        <div className="sq-personas-grid">
          {PERSONAS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
              className="sq-persona"
            >
              <div className="sq-persona-emoji">{p.emoji}</div>
              <div className="sq-persona-title">{p.title}</div>
              <div className="sq-persona-modules">{p.modules}</div>
              <div className="sq-persona-note">{p.note}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
