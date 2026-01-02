import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export const CTASection = () => {
  return (
    <section className="py-24 px-6 md:px-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-hero opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
          Stop letting your best work
          <br />
          <span className="text-gradient">fade into forgotten history</span>
        </h2>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Join thousands of professionals who document their journey as it happens—and 
          never struggle to remember their impact again.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="hero" size="xl">
            Start Your Journal
            <ArrowRight size={20} />
          </Button>
          <p className="text-sm text-muted-foreground">
            Free to start • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
};
