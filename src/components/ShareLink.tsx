import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { SpendingWeights } from '@/utils/weights';
import { useToast } from "@/hooks/use-toast";

interface ShareLinkProps {
  weights: SpendingWeights;
}

const ShareLink = ({ weights }: ShareLinkProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareableURL = () => {
    const params = new URLSearchParams();
    
    // Add weight parameters
    Object.entries(weights).forEach(([key, value]) => {
      if (value > 0) {
        params.set(key, value.toString());
      }
    });

    return `${window.location.origin}/simulator?${params.toString()}`;
  };

  const copyToClipboard = async () => {
    try {
      const url = generateShareableURL();
      await navigator.clipboard.writeText(url);
      
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Shareable link has been copied to your clipboard.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually from your browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copyToClipboard}
      className="transition-all duration-200"
    >
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          Share Link
        </>
      )}
    </Button>
  );
};

export default ShareLink;