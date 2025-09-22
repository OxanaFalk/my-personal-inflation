import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">About Myflation</h1>
          </div>
        </div>

        <div className="prose prose-gray max-w-none">
          <div className="bg-card p-6 rounded-xl shadow-soft border border-border mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Source</h2>
            <p className="text-muted-foreground mb-4">
              Myflation uses official Consumer Price Index (CPI) data from Statistics Sweden (SCB), 
              specifically the COICOP classification with 2020 as the base year (2020=100). The data 
              covers the last 24 months across all 13 main expenditure divisions.
            </p>
            <p className="text-muted-foreground">
              Data is fetched from SCB's PXWeb API (dataset: KPI2020COICOP2M) with a fallback to 
              embedded demo data if the API is unavailable.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-soft border border-border mb-8">
            <h2 className="text-2xl font-semibold mb-4">Methodology</h2>
            <p className="text-muted-foreground mb-4">
              Your personal CPI is calculated as a weighted sum of the 13 COICOP division indices 
              using your spending mix as weights:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-4">
              Personal CPI = Σ (weight_division × CPI_division)
            </div>
            <p className="text-muted-foreground mb-4">
              The 12-month inflation rate is then calculated by comparing your personal CPI to 
              the same period 12 months earlier, and compared against Sweden's headline CPI.
            </p>
            <p className="text-muted-foreground">
              The difference is expressed in percentage points (pp) to show how much your 
              personal inflation deviates from the national average.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-soft border border-border mb-8">
            <h2 className="text-2xl font-semibold mb-4">COICOP Divisions</h2>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">01</span>
                <span className="text-muted-foreground">Food and non-alcoholic beverages</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">02</span>
                <span className="text-muted-foreground">Alcoholic beverages, tobacco and narcotics</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">03</span>
                <span className="text-muted-foreground">Clothing and footwear</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">04</span>
                <span className="text-muted-foreground">Housing, water, electricity, gas and other fuels</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">05</span>
                <span className="text-muted-foreground">Furnishings, household equipment and routine maintenance</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">06</span>
                <span className="text-muted-foreground">Health</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">07</span>
                <span className="text-muted-foreground">Transport</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">08</span>
                <span className="text-muted-foreground">Information and communication</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">09</span>
                <span className="text-muted-foreground">Recreation, sport and culture</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">10</span>
                <span className="text-muted-foreground">Education services</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">11</span>
                <span className="text-muted-foreground">Restaurants and accommodation services</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="font-medium">12</span>
                <span className="text-muted-foreground">Insurance and financial services</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium">13</span>
                <span className="text-muted-foreground">Personal care, social protection and miscellaneous</span>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-soft border border-border">
            <h2 className="text-2xl font-semibold mb-4">Limitations</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>• This is a simplified reweighting model for educational purposes</li>
              <li>• SCB indices reflect average price movements, not specific products you buy</li>
              <li>• Quality changes and substitution effects are not captured</li>
              <li>• Regional price differences within Sweden are not considered</li>
              <li>• The model assumes constant spending patterns over time</li>
            </ul>
          </div>

          <div className="mt-8 text-center">
            <a 
              href="https://www.scb.se/hitta-statistik/statistik-efter-amne/priser-och-konsumtion/konsumentprisindex/konsumentprisindex-kpi/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              Visit SCB for official CPI data
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;