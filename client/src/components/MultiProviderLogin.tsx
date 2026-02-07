import { Button } from "@/components/ui/button";
import { Mail, Apple, Twitter } from "lucide-react";

interface OAuthProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
}

const providers: OAuthProvider[] = [
  {
    id: "google",
    name: "Google",
    icon: <Mail className="w-5 h-5" />,
    color: "bg-white border-gray-300 text-gray-700",
    hoverColor: "hover:bg-gray-50",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
      </svg>
    ),
    color: "bg-white border-gray-300 text-blue-600",
    hoverColor: "hover:bg-blue-50",
  },
  {
    id: "apple",
    name: "Apple",
    icon: <Apple className="w-5 h-5" />,
    color: "bg-black text-white border-black",
    hoverColor: "hover:bg-gray-900",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: <Twitter className="w-5 h-5" />,
    color: "bg-white border-gray-300 text-black",
    hoverColor: "hover:bg-gray-50",
  },
];

interface MultiProviderLoginProps {
  onProviderSelect?: (provider: string) => void;
}

export default function MultiProviderLogin({ onProviderSelect }: MultiProviderLoginProps) {
  const handleProviderClick = (providerId: string) => {
    // Construct OAuth login URL with provider parameter
    const loginUrl = new URL(window.location.href);
    loginUrl.pathname = "/api/oauth/login";
    loginUrl.searchParams.set("provider", providerId);
    
    if (onProviderSelect) {
      onProviderSelect(providerId);
    }
    
    window.location.href = loginUrl.toString();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">
            Sign in with your account
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outline"
            onClick={() => handleProviderClick(provider.id)}
            className={`${provider.color} ${provider.hoverColor} border transition-colors`}
          >
            <span className="mr-2">{provider.icon}</span>
            <span className="hidden sm:inline">{provider.name}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
