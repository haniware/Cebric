import { useState } from "react";
import FilterPanel from "@/components/filter-panel";
import LapChart from "@/components/lap-chart";
import TelemetrySection from "@/components/telemetry-section";
import StatisticsCards from "@/components/statistics-cards";
import AdditionalAnalysis from "@/components/additional-analysis";
import DriverComparison from "@/components/driver-comparison";
import AdvancedAnalysis from "@/components/advanced-analysis";
import { F1SessionResponse, F1TelemetryResponse } from "@shared/schema";

export default function Dashboard() {
  const [sessionData, setSessionData] = useState<F1SessionResponse | null>(null);
  const [telemetryData, setTelemetryData] = useState<F1TelemetryResponse | null>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    year: "",
    gp: "",
    session: "",
    drivers: [] as string[]
  });
  const timeFormat = 'seconds';

  // Placeholder for year options, to be updated with 2018, 2019, 2025
  const availableYears = ["2023", "2022", "2021", "2020", "2019", "2018", "2025"]; 

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-main">
      {/* Header Section */}
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-foreground">CEBRIC</h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">Real-time F1 Data Analysis</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Section */}
        <FilterPanel 
          onDataLoaded={setSessionData}
          onFiltersChange={setSelectedFilters}
          filters={selectedFilters}
          years={availableYears} // Pass updated years
        />

        {/* Lap Chart Section */}
        <LapChart 
          sessionData={sessionData}
          timeFormat={timeFormat} // Pass time format
          onLapSelect={(driver, lap) => {
            // Handle lap selection for telemetry
            console.log("Lap selected:", driver, lap);
          }}
        />

        {/* Statistics Cards */}
        <StatisticsCards sessionData={sessionData} timeFormat={timeFormat} />

        {/* Telemetry Section */}
        <TelemetrySection 
          telemetryData={telemetryData}
          sessionData={sessionData}
          filters={selectedFilters}
          onTelemetryDataLoaded={setTelemetryData}
          timeFormat={timeFormat} // Pass time format
        />

        <div className="h-8"></div>

        {/* Driver Comparison Section */}
        <DriverComparison sessionData={sessionData} />

        {/* Additional Analysis Section */}
        <AdditionalAnalysis sessionData={sessionData} timeFormat={timeFormat} />

        {/* Advanced Analysis Section */}
        <AdvancedAnalysis sessionData={sessionData} filters={selectedFilters} />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-card" data-testid="footer-main">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                Designed with <span className="text-primary font-semibold">FastF1</span> by Artin Zomorodian & Hani Bikdeli
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Design Group: DeepInk Team | Powered by Replit
              </p>
            </div>
            <div className="flex items-center gap-5">
              <a 
                href="https://t.me/f1analytics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-[#0088cc] transition-all duration-300 hover:scale-110"
                aria-label="Join us on Telegram"
                title="Telegram"
                data-testid="link-telegram"
              >
                <i className="fab fa-telegram text-xl text-white transition-colors"></i>
              </a>
              <a 
                href="https://instagram.com/f1analytics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#E1306C] hover:to-[#F77737] transition-all duration-300 hover:scale-110"
                aria-label="Follow us on Instagram"
                title="Instagram"
                data-testid="link-instagram"
              >
                <i className="fab fa-instagram text-xl text-muted-foreground group-hover:text-white transition-colors"></i>
              </a>
              <a 
                href="https://discord.gg/f1analytics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-[#5865F2] transition-all duration-300 hover:scale-110"
                aria-label="Join our Discord"
                title="Discord"
                data-testid="link-discord"
              >
                <i className="fab fa-discord text-xl text-white transition-colors"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}