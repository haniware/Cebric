
import { Card } from "@/components/ui/card";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-gradient-to-br from-background via-card to-background">
      <Card className="rounded-none border-0 bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Brand Section */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <i className="fas fa-flag-checkered text-white text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    F1 Analytics
                  </h3>
                  <p className="text-xs text-muted-foreground">Powered by FastF1</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional F1 telemetry and performance analysis platform
              </p>
            </div>

            {/* Creator Section */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Designed & Developed by</p>
              <p className="text-lg font-semibold text-foreground mb-1">Artin Zomorodian & Hani Bikdeli</p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <i className="fas fa-users text-primary text-sm"></i>
                <span className="text-sm font-medium text-primary">DeepInk Team</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Powered by FastF1</p>
            </div>
            
            {/* Social Links Section */}
            <div className="flex flex-col items-center md:items-end gap-4">
              <p className="text-sm text-muted-foreground">Connect with us</p>
              <div className="flex items-center gap-3">
                <a 
                  href="https://t.me/CEBRICF1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-[#0088cc] hover:to-[#0088cc] transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#0088cc]/50"
                  aria-label="Join us on Telegram"
                  title="Telegram"
                >
                  <i className="fab fa-telegram text-2xl text-muted-foreground group-hover:text-white transition-colors"></i>
                </a>
                <a 
                  href="https://www.instagram.com/an.zomorodian" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-[#833AB4] hover:via-[#E1306C] hover:to-[#F77737] transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#E1306C]/50"
                  aria-label="Follow us on Instagram"
                  title="Instagram"
                >
                  <i className="fab fa-instagram text-2xl text-muted-foreground group-hover:text-white transition-colors"></i>
                </a>
                <a 
                  href="https://discord.gg/7ft5D8N5" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-[#5865F2] hover:to-[#5865F2] transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#5865F2]/50"
                  aria-label="Join our Discord"
                  title="Discord"
                >
                  <i className="fab fa-discord text-2xl text-muted-foreground group-hover:text-white transition-colors"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                © 2024 F1 Analytics. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-primary transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </footer>
  );
}
