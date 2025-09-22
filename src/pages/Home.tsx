import { Button } from "@/components/ui/button";
import { TrendingUp, Calculator, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-primary/10 p-4 rounded-2xl shadow-soft">
              <TrendingUp className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            My<span className="text-primary">flation</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Compare your personal inflation to Sweden's CPI. 
            Enter your spending mix and discover how inflation affects you personally.
          </p>
          
          <Link to="/simulator">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 transform hover:scale-105 px-8 py-6 text-lg font-semibold"
            >
              Start Calculating
              <Calculator className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        
        {/* Features Preview */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-xl shadow-soft border border-border">
            <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Personal CPI Calculator</h3>
            <p className="text-muted-foreground">
              Input your spending across different categories in percentages or SEK amounts
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-xl shadow-soft border border-border">
            <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-time Comparison</h3>
            <p className="text-muted-foreground">
              Compare your personal inflation to Sweden's headline CPI with interactive charts
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-xl shadow-soft border border-border">
            <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Insights</h3>
            <p className="text-muted-foreground">
              Get AI-powered explanations of what drives your personal inflation differences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;