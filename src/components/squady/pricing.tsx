"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { SectionHeader } from "./principles";

const PLANS = [
  {
    name: "Solo",
    price: "$15",
    period: "/ мес",
    desc: "Для мастера-одиночки",
    cta: "Начать 30 дней бесплатно",
    highlight: false,
    features: [
      "1 Telegram-бот",
      "До 300 клиентов в CRM",
      "AI-ассистент и голос",
      "Базовая программа лояльности",
      "Доступ к Squad Network",
    ],
  },
  {
    name: "Clinic",
    price: "$49",
    period: "/ мес",
    desc: "Для студии или клиники",
    cta: "Попробовать Clinic",
    highlight: true,
    features: [
      "До 10 ботов, общий + индивидуальные",
      "Общая CRM по всем мастерам",
      "Расширенная аналитика",
      "Курсы, абонементы, лояльность",
      "Приоритет в маршрутизации Squad",
    ],
  },
  {
    name: "Corp",
    price: "по запросу",
    period: "",
    desc: "Сети, франшизы, корп. клиенты",
    cta: "Связаться",
    highlight: false,
    features: [
      "Белый лейбл",
      "SLA и выделенная поддержка",
      "HR-интеграция и брендинг",
      "Минимальная комиссия со Squad",
      "Безлимит ботов и точек",
    ],
  },
];

const EXTRAS = [
  { name: "Дополнительный бот", price: "+$5 / бот / мес" },
  { name: "SMS-пакет (100 шт)", price: "$3" },
  { name: "Расширенная аналитика", price: "+$10 / мес" },
  { name: "Белый лейбл", price: "от $99 / мес" },
  { name: "Импорт базы клиентов", price: "разово $19" },
  { name: "Приоритетная поддержка", price: "+$15 / мес" },
];

export function PricingSection() {
  return (
    <section id="pricing" className="sq-section sq-pricing">
      <div className="sq-container">
        <SectionHeader
          eyebrow="Тарифы"
          title={
            <>
              30 дней бесплатно.{" "}
              <span className="sq-it" style={{ color: "var(--magenta)" }}>
                без привязки карты.
              </span>
            </>
          }
          subtitle="Платите за подписку, расширения подключаются по мере роста. Никаких процентов с каждой записи и оплаты за лиды — только понятная экономика."
        />

        <div className="sq-pricing-grid">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`sq-plan ${p.highlight ? "sq-plan-highlight" : ""}`}
            >
              {p.highlight && (
                <div className="sq-plan-badge">
                  <Sparkles className="h-3 w-3" /> Популярный выбор
                </div>
              )}
              <div className="sq-plan-name">{p.name}</div>
              <div className="sq-plan-desc">{p.desc}</div>
              <div className="sq-plan-price">
                <span className="sq-plan-price-main">{p.price}</span>
                {p.period && <span className="sq-plan-price-period">{p.period}</span>}
              </div>
              <ul className="sq-plan-features">
                {p.features.map((f) => (
                  <li key={f}>
                    <span className="sq-plan-check">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="#cta"
                className={
                  p.highlight
                    ? "sq-btn sq-btn-primary sq-btn-block"
                    : "sq-btn sq-btn-secondary sq-btn-block"
                }
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="sq-extras"
        >
          <div className="sq-extras-title">Расширения сверху</div>
          <div className="sq-extras-grid">
            {EXTRAS.map((e) => (
              <div key={e.name} className="sq-extra-line">
                <span>{e.name}</span>
                <span>{e.price}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
