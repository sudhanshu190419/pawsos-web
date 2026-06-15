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
      <div className="content-visibility-auto">
        <CategoryCards />
      </div>
      
      {/* 3. Redesigned How It Works Section */}
      <div className="content-visibility-auto">
        <HowItWorks />
      </div>
      
      {/* 4. Redesigned Services Bento Section */}
      <div className="content-visibility-auto">
        <ServicesBento />
      </div>
      
      {/* 5. Standalone Volunteer ID Card Section */}
      <div className="content-visibility-auto">
        <VolunteerSection />
      </div>
      
      {/* 6. Join the Movement (NGO / Clinic / Hospital Onboarding) */}
      <div className="content-visibility-auto">
        <JoinMovement />
      </div>
      
      {/* 7. Marketplace Shop Section */}
      <div className="content-visibility-auto">
        <MarketplaceSection />
      </div>
      
      {/* 8. Final CTA Section */}
      <div className="content-visibility-auto">
        <FinalCTA />
      </div>
    </main>
  );
}
