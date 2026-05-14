"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";

export function FinalCta() {
  return (
    <section id="cta" className="sq-final">
      <div className="sq-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="sq-cta-banner"
        >
          <div className="sq-cta-eyebrow">
            <Rocket className="h-3 w-3" />
            Готовы соединить бизнес в систему?
          </div>
          <h2 className="sq-cta-title">
            Мы соединяем людей{" "}
            <span className="sq-it" style={{ color: "var(--lime)" }}>
              в&nbsp;системы.
            </span>
          </h2>
          <p className="sq-cta-sub">
            Запустите Telegram-бота, подключите лояльность и присоединитесь к
            Squad Network — за один вечер. 30 дней бесплатно, без привязки карты.
          </p>
          <div className="sq-cta-row">
            <Link href="/login" className="sq-btn sq-btn-primary sq-btn-lg">
              Начать бесплатно
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/docs" className="sq-btn sq-btn-secondary sq-btn-lg">
              Документация
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
