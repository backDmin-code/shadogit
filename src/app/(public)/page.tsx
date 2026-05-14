import { SquadyHero } from "@/components/squady/hero";
import { SquadyPrinciples } from "@/components/squady/principles";
import { SquadyStack } from "@/components/squady/stack";
import { BotFeaturesSection } from "@/components/squady/bot-features";
import { SquadNetworkSection } from "@/components/squady/squad-network";
import { LoyaltySection } from "@/components/squady/loyalty";
import { PersonasSection } from "@/components/squady/personas";
import { PricingSection } from "@/components/squady/pricing";
import { FaqSection } from "@/components/squady/faq";
import { FinalCta } from "@/components/squady/final-cta";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="app-main app-main--no-toc !ml-0 !mr-0 relative z-10 sq-page">
      <SquadyHero />
      <SquadyPrinciples />
      <SquadyStack />
      <BotFeaturesSection />
      <SquadNetworkSection />
      <LoyaltySection />
      <PersonasSection />
      <PricingSection />
      <FaqSection />
      <FinalCta />
    </main>
  );
}
