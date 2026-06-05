import LocationInitializer from "./components/home/LocationInitializer";
import HeroSection from "./components/home/HeroSection";
import CategoryCards from "./components/home/CategoryCards";
import HowItWorks from "./components/home/HowItWorks";
import Ecosystem from "./components/home/Ecosystem";
import MarketplaceSection from "./components/home/MarketplaceSection";


import VolunteerSection from "./components/home/VolunteerSection";
import PlayDatePromo from "./components/home/PlayDatePromo";
import PartnershipSection from "./components/home/PartnershipSection";
import DonationSection from "./components/home/DonationSection";

import FinalCTA from "./components/home/FinalCTA";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-orange-100">
      <LocationInitializer />
      <HeroSection />
      <CategoryCards />
      <HowItWorks />
      <Ecosystem />
      <MarketplaceSection />
      
      <VolunteerSection />
      <PlayDatePromo />
      <PartnershipSection />
      
     
      <FinalCTA />
    </main>
  );
}
