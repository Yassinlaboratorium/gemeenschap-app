import { MapPin, Clock, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary font-sans">
      {/* Header */}
      <header className="bg-dark text-secondary px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">vzw De Gemeenschap</span>
        </div>
        <span className="text-sm text-secondary/60 hidden sm:block">Sint-Niklaas</span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Jeugdhuis · Sint-Niklaas
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-dark leading-tight">
            Jouw plek.{" "}
            <span className="text-primary">Jouw activiteiten.</span>
          </h1>

          <p className="text-lg text-dark/70 leading-relaxed">
            Schrijf je in voor workshops, uitstappen en alles wat we samen doen.
          </p>

          {/* Coming soon card */}
          <div className="mt-8 rounded-2xl border-2 border-dashed border-primary/30 bg-white/60 backdrop-blur-sm p-8 space-y-4 text-left shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-bold text-dark">Binnenkort beschikbaar</p>
                <p className="text-sm text-dark/50">we bouwen nog!</p>
              </div>
            </div>
            <p className="text-dark/60 text-sm leading-relaxed">
              De inschrijvingsmodule en het activiteitenoverzicht zijn in aanbouw.
              Kom binnenkort terug voor het volledige platform.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["Workshops", "Uitstappen", "Evenementen"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary border border-dark/10 px-3 py-1 text-xs font-medium text-dark/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-secondary/60 px-6 py-5 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span>Mercatorstraat 24, Sint-Niklaas</span>
        </div>
        <p className="mt-1 text-xs text-secondary/30">
          © {new Date().getFullYear()} vzw De Gemeenschap
        </p>
      </footer>
    </div>
  );
}
