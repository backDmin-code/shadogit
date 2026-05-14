"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Handshake, ShieldCheck, Cpu } from "lucide-react";

const PRINCIPLES = [
  {
    icon: Handshake,
    badge: "01",
    title: "Связь вместо конкуренции",
    body:
      "Малый бизнес перестаёт быть одиночным. Если мастер занят — команда подхватывает. Клиенты не теряются, они перенаправляются внутри сети.",
    accent: "lime",
  },
  {
    icon: ShieldCheck,
    badge: "02",
    title: "Доверие вместо хаоса",
    body:
      "Каждый переход прозрачен, каждая рекомендация учтена. Мы превращаем человеческие отношения в устойчивую экономику доверия.",
    accent: "pink",
  },
  {
    icon: Cpu,
    badge: "03",
    title: "Система вместо ручного режима",
    body:
      "Запись автоматизирована. Лояльность управляется алгоритмом. Реферальная сеть работает без хаоса. Один мастер — это бизнес. Сквад — это система.",
    accent: "mint",
  },
];

export function SquadyPrinciples() {
  return (
    <section id="principles" className="sq-section">
      <div className="sq-container">
        <SectionHeader
          eyebrow="Философия"
          title={
            <>
              Три принципа, которые{" "}
              <span className="sq-it" style={{ color: "var(--magenta)" }}>
                меняют логику рынка
              </span>
            </>
          }
          subtitle="Сквады — это не инструмент. Это инфраструктура сотрудничества."
        />

        <div className="sq-principles-grid">
          {PRINCIPLES.map((p, i) => (
            <motion.div
              key={p.badge}
              initial={{ opacity: 0, y: 30, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className={`sq-principle sq-principle-${i + 1}`}
            >
              <div className="sq-principle-num">{p.badge}</div>
              <div className="sq-principle-icon">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="sq-principle-title">{p.title}</h3>
              <p className="sq-principle-body">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`sq-section-header sq-align-${align}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="sq-section-eyebrow"
      >
        {eyebrow}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="sq-h2-big"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="sq-section-sub"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
