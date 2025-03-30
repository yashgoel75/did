"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultWallets, lightTheme } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a QueryClient instance with smaller cache size
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60, // 1 hour
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false
    }
  }
});

// Configure Wagmi with minimal storage footprint
const config = createConfig({
  chains: [sepolia],
  connectors: getDefaultWallets({
    appName: "DID Authenticator",
    projectId: "499be632850c11c2f47084ec5c1a1760",
    chains: [sepolia],
  }).connectors,
  transports: {
    [sepolia.id]: http(
      "https://eth-sepolia.g.alchemy.com/v2/-DcT-NFdhaJSS6OR8zR_itZiCcnsJEMC"
    ),
  },
});

export default function RootLayout({ children }) {
  // Add mounted state to prevent hydration errors
  const [mounted, setMounted] = useState(false);
  
  // Clear any problematic localStorage items on mount
  useEffect(() => {
    try {
      // Clear known large items that might be causing issues
      localStorage.removeItem('wagmi.store');
      localStorage.removeItem('wagmi.wallet');
      localStorage.removeItem('wagmi.connected');
      
      // Now set the mounted state
      setMounted(true);
    } catch (e) {
      console.error('Error clearing localStorage:', e);
      setMounted(true);
    }
  }, []);

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider 
              chains={[sepolia]}
              theme={lightTheme({
                borderRadius: 'medium'
              })}
              coolMode
            >
              {/* Only render UI when mounted to prevent hydration errors */}
              {mounted ? children : (
                <div style={{ visibility: "hidden" }}>Loading wallet connections...</div>
              )}
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}