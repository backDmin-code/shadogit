"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionHeader } from "./principles";

const FAQ = [
  {
    q: "Нужно ли мне разбираться в Telegram, BotFather, токенах?",
    a: "Нет. Мы — manager bot в терминах Telegram Bot API 9.6. После регистрации платформа сама создаёт персонального бота для вас. Все настройки — через дашборд.",
  },
  {
    q: "Что если я работаю один — мне нужен Squad?",
    a: "Не обязательно. Можно подключить только бот записи или только лояльность. Squad Network подключается в любой момент, когда захотите расширяться.",
  },
  {
    q: "Я не теряю клиента, если он ушёл к коллеге через сквад?",
    a: "Нет. Клиент остаётся в вашей базе. После визита к коллеге следующий раз бот снова предложит вас как основного. И вы получаете процент с каждого повторного перехода.",
  },
  {
    q: "Платформа берёт % с каждой записи?",
    a: "Нет. У нас подписка + комиссия только с реферальных переходов в Squad. Никаких процентов с записей и никаких оплат за лиды — это разрушает доверие.",
  },
  {
    q: "Можно начать без оплаты?",
    a: "Да. 30 дней бесплатно, без привязки карты. Этого достаточно, чтобы убедиться в ценности продукта до первого платежа.",
  },
  {
    q: "Есть ли модуль только для кофейни / розницы (без записи)?",
    a: "Да. Можно подключить только Loyalty Engine. Раздел записи не отображается, тариф ниже. Подходит для кафе, ресторанов, цветочных и розницы.",
  },
  {
    q: "А клиника с несколькими врачами?",
    a: "Тариф Clinic. Общий бот клиники + индивидуальные боты врачей, общая CRM, фильтрация по кабинету и специализации, единая аналитика.",
  },
  {
    q: "Как обеспечена надёжность и масштабирование?",
    a: "Stateless-боты с сессиями в Redis, разделённые webhook + worker, изоляция данных по бизнесам на уровне схемы, snapshot базы каждые 6 часов, rate limiting на каждом уровне.",
  },
];

export function FaqSection() {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id="faq" className="sq-section">
      <div className="sq-container sq-faq-container">
        <SectionHeader
          eyebrow="Вопросы"
          title={
            <>
              Часто задают <span className="sq-grad-text">именно это.</span>
            </>
          }
        />

        <div className="sq-faq-list">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
                className={`sq-faq-item ${isOpen ? "sq-faq-open" : ""}`}
              >
                <button
                  type="button"
                  className="sq-faq-q"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`sq-faq-chev ${isOpen ? "sq-faq-chev-open" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="sq-faq-a-wrap"
                    >
                      <div className="sq-faq-a">{item.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
