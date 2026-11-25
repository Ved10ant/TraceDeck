import { SmoothScroll } from "../components/SmoothScroll";
import { LandingNav } from "../components/LandingNav";
import { HeroSection } from "../components/landing/HeroSection";
import { MarqueeSection } from "../components/landing/MarqueeSection";
import { DifferentiatorsSection } from "../components/landing/DifferentiatorsSection";
import { TabbedShowcase } from "../components/landing/TabbedShowcase";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { DeepDiveSection } from "../components/landing/DeepDiveSection";
import { SelfHostSection } from "../components/landing/SelfHostSection";
import { AudienceSection } from "../components/landing/AudienceSection";
import { FaqSection } from "../components/landing/FaqSection";
import { FinalCtaSection } from "../components/landing/FinalCtaSection";
import { LandingFooter } from "../components/LandingFooter";

export default function HomePage() {
  return (
    <SmoothScroll>
      <div className="dark min-h-screen bg-cosmo-bg text-white flex flex-col selection:bg-cta/25 selection:text-white">
      {/* 1. Sticky Pill Nav */}
      <LandingNav />

      <main className="flex-1">
        {/* 2. Hero with Cosmoq Video Background, Frost, Noise & Parallax */}
        <HeroSection />

        {/* 3. Built With Marquee */}
        <MarqueeSection />

        {/* 4. What Sets Us Apart */}
        <DifferentiatorsSection />

        {/* 5. Tabbed Showcase */}
        <TabbedShowcase />

        {/* 6. How It Works (01. 02. 03. with Glowing Energy Beam) */}
        <HowItWorksSection />

        {/* 7. Engineering Deep Dive (Rim-lit Glassmorphic Dark Card) */}
        <DeepDiveSection />

        {/* 8. Open Source & Self Host */}
        <SelfHostSection />

        {/* 9. Who It's For */}
        <AudienceSection />

        {/* 10. FAQ Accordion */}
        <FaqSection />

        {/* 11. Final Dark Glass CTA Band */}
        <FinalCtaSection />
      </main>

      {/* 12. Multi-column Footer */}
      <LandingFooter />
    </div>
    </SmoothScroll>
  );
}
