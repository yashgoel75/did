'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a QueryClient instance
const queryClient = new QueryClient();

const config = createConfig({
    chains: [sepolia],
    connectors: getDefaultWallets({
        appName: 'DID Authenticator',
        projectId: '499be632850c11c2f47084ec5c1a1760',
        chains: [sepolia]
    }).connectors,
    transports: {
        [sepolia.id]: http(
            'https://eth-sepolia.g.alchemy.com/v2/-DcT-NFdhaJSS6OR8zR_itZiCcnsJEMC'
        )
    }
});

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossorigin
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Public+Sans:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={config}>
                        <RainbowKitProvider chains={[sepolia]}>
                            {children}
                        </RainbowKitProvider>
                    </WagmiProvider>
                </QueryClientProvider>
            </body>
        </html>
    );
}
