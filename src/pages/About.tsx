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
            <h2 className="text-2xl font-semibold mb-4">Purpose</h2>
            <p className="text-muted-foreground mb-4">
              Myflation is a personal side project I built to explore what can be done with Lovable in just a short time. 
              The idea is to make inflation more relatable by showing how official statistics can be reweighted to 
              reflect your own spending pattern.
            </p>
            <p className="text-muted-foreground">
              This app is intended as a proof of concept and functionality test — not an official calculator. 
              Still, it demonstrates the value of combining open data, analytics, and simple web apps.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-soft border border-border mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Source</h2>
            <p className="text-muted-foreground mb-4">
              The app uses official Consumer Price Index (CPI) data from Statistics Sweden (SCB):
            </p>
            <ul className="text-muted-foreground mb-4 space-y-2">
              <li>• <strong>Headline CPI</strong> (yearly change, %): dataset KPItotM</li>
              <li>• <strong>12 COICOP expenditure groups</strong> (yearly change, %): dataset KPICOI80MN</li>
              <li>• <strong>Weights</strong> (promille, normalized to 100%): also from KPICOI80MN</li>
            </ul>
            <p className="text-muted-foreground">
              Data is fetched directly via <a href="https://www.scb.se/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SCB's PXWeb API</a>. 
              If the API is unavailable, the app falls back to embedded demo data.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-soft border border-border mb-8">
            <h2 className="text-2xl font-semibold mb-4">Methodology</h2>
            <p className="text-muted-foreground mb-4">
              Your personal inflation rate is calculated as a weighted sum of the yearly changes in the 12 COICOP groups, 
              using either your own spending shares or the official SCB weights:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm mb-4">
              Personal Inflation (t) = Σ ( weight_group × yearly change_group,t )
            </div>
            <p className="text-muted-foreground mb-4">
              This is then compared against Sweden's headline CPI (yearly change, %).
            </p>
            <p className="text-muted-foreground">
              The difference is expressed in percentage points (pp) to show whether your inflation runs 
              higher or lower than the national average.
            </p>
          </div>


          <div className="bg-card p-6 rounded-xl shadow-soft border border-border mb-8">
            <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
            <p className="text-muted-foreground mb-4">
              This app is a concept illustration, built quickly to test Lovable's functionality.
              While based on official SCB data, the numbers may not be entirely accurate due to 
              rounding, simplifications, and calculation assumptions.
            </p>
            <p className="text-muted-foreground">
              For the official CPI, please visit <a href="https://www.scb.se/PR0101" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">SCB's website</a>.
            </p>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-soft border border-border">
            <h2 className="text-2xl font-semibold mb-4">Author</h2>
            <p className="text-muted-foreground">
              Created by <strong>Oxana Falk</strong> — connect with me on <a href="https://www.linkedin.com/in/oxanafalk/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">LinkedIn</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;