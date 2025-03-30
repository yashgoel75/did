'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseAbi } from 'viem';

const CONTRACT_ADDRESS = '0xc84fE0C202E1f00698Fe577363609Df6adD127e3';
const abi = parseAbi([
  'function getDID(address user) public view returns (string)'
]);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { address, isConnected } = useAccount();
  
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  
  // Read DID from contract when wallet is connected
  const { data: did, isLoading: isLoadingDid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'getDID',
    args: [address]
  });

  const handleAuthorize = async () => {
    if (!isConnected || !did) {
      setError("Please connect your wallet and ensure you have a registered DID");
      return;
    }

    try {
      setLoading(true);
      
      // Get user profile from the database
      const profileRes = await fetch(`/api/auth/profile?address=${address}`);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      const profile = await profileRes.json();
      
      // Generate auth code
      const codeRes = await fetch('/api/auth/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          address,
          did
        })
      });
      
      if (!codeRes.ok) throw new Error("Failed to generate authorization code");
      const { code } = await codeRes.json();
      
      // Redirect back to client with the auth code
      const finalRedirectUri = new URL(redirectUri);
      finalRedirectUri.searchParams.append('code', code);
      if (state) finalRedirectUri.searchParams.append('state', state);
      
      router.push(finalRedirectUri.toString());
      
    } catch (err) {
      console.error(err);
      setError("Authentication failed. Please try again.");
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
            <p className="mb-4">DID: {isLoadingDid ? "Loading..." : (did || "Not registered")}</p>
            
            <button
              onClick={handleAuthorize}
              disabled={loading || !did}
              className={`w-full p-3 text-white rounded ${
                loading || !did ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
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