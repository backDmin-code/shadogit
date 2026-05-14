"use client";

import * as React from "react";

const ITEMS = [
  "Bot Layer",
  "Squad Network",
  "Loyalty Engine",
  "30 дней бесплатно",
  "Без BotFather",
  "Голос → запись",
  "Реферал 5–15%",
  "QR в Wallet",
  "Без хаоса",
];

export function Marquee() {
  return (
    <div className="sq-marquee" aria-hidden>
      <div className="sq-marquee-track">
        {[0, 1].map((k) => (
          <span key={k}>
            {ITEMS.map((it, i) => (
              <React.Fragment key={`${k}-${i}`}>
                {it}
                <span className="sq-marquee-star">★</span>
              </React.Fragment>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
