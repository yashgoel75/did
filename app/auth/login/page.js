'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseAbi } from 'viem';

const CONTRACT_ADDRESS = '0xaF52fF3fe18434226749f2CC8652900Cb7f23937';
const abi = parseAbi([
  'function profiles(address) public view returns (string did, string name, string email)'
]);

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { address, isConnected } = useAccount();
  
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  
  console.log("Login page params:", { clientId, redirectUri, state });
  
  // Read profile directly from the contract when wallet is connected
  const { data: profile, isLoading: isLoadingProfile } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'profiles',
    args: [address],
    enabled: !!address
  });

  const handleAuthorize = async () => {
    if (!isConnected || !profile || !profile.did) {
      setError("Please connect your wallet and ensure you have a registered DID");
      return;
    }

    try {
      setLoading(true);
      
      // Generate auth code
      const codeRes = await fetch('/api/auth/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          address,
          did: profile.did
        })
      });
      
      if (!codeRes.ok) {
        const errorData = await codeRes.json();
        throw new Error(errorData.error || "Failed to generate authorization code");
      }
      
      const { code } = await codeRes.json();
      
      // Redirect back to client with the auth code
      const finalRedirectUri = new URL(redirectUri);
      finalRedirectUri.searchParams.append('code', code);
      if (state) finalRedirectUri.searchParams.append('state', state);
      
      router.push(finalRedirectUri.toString());
      
    } catch (err) {
      console.error("Authorization error:", err);
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in with DID Authenticator</h1>
        
        <div className="mb-6 flex justify-center">
          <ConnectButton />
        </div>
        
        {isConnected && (
          <div className="mb-6">
            <p className="mb-2">Connected Wallet: {address}</p>
            <p className="mb-4">DID: {isLoadingProfile ? "Loading..." : (profile?.did || "Not registered")}</p>
            
            <button
              onClick={handleAuthorize}
              disabled={loading || isLoadingProfile || !profile?.did}
              className={`w-full p-3 text-white rounded ${
                loading || isLoadingProfile || !profile?.did ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? "Authorizing..." : "Authorize"}
            </button>
            
            {error && <p className="mt-4 text-red-600">{error}</p>}
          </div>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Authorizing will share your DID information with the requesting application.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
