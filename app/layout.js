"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { RainbowKitProvider, getDefaultWallets } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a QueryClient instance
const queryClient = new QueryClient();

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
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider chains={[sepolia]}>{children}</RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}