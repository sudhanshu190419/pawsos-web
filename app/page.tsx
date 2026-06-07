import LocationInitializer from "./components/home/LocationInitializer";
import HeroSection from "./components/home/HeroSection";
import CategoryCards from "./components/home/CategoryCards";
import HowItWorks from "./components/home/HowItWorks";
import ServicesBento from "./components/home/ServicesBento";
import VolunteerSection from "./components/home/VolunteerSection";
import JoinMovement from "./components/home/JoinMovement";
import MarketplaceSection from "./components/home/MarketplaceSection";
import FinalCTA from "./components/home/FinalCTA";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FDF8F3] text-[#1C1614] selection:bg-orange-100">
      <LocationInitializer />
      
      {/* 1. Original Hero Section */}
      <HeroSection />
      
      {/* 2. Original Four Horizontal Category Cards Section */}
      <CategoryCards />
      
      {/* 3. Redesigned How It Works Section */}
      <HowItWorks />
      
      {/* 4. Redesigned Services Bento Section */}
      <ServicesBento />
      
      {/* 5. Standalone Volunteer ID Card Section */}
      <VolunteerSection />
      
      {/* 6. Join the Movement (NGO / Clinic / Hospital Onboarding) */}
      <JoinMovement />
      
      {/* 7. Marketplace Shop Section */}
      <MarketplaceSection />
      
      {/* 8. Final CTA Section */}
      <FinalCTA />
    </main>
  );
}
