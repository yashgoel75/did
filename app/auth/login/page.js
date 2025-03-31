'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseAbi } from 'viem';
import dynamic from 'next/dynamic';

const CONTRACT_ADDRESS = '0xaF52fF3fe18434226749f2CC8652900Cb7f23937';
const abi = parseAbi([
  'function profiles(address) public view returns (string did, string name, string email)'
]);

// Helper function to parse contract response
function parseProfileData(data) {
  if (!data) return null;
  
  // If data is an array [did, name, email]
  if (Array.isArray(data)) {
    return {
      did: data[0] || '',
      name: data[1] || '',
      email: data[2] || ''
    };
  }
  
  // If data is already in object format
  if (typeof data === 'object' && 'did' in data) {
    return data;
  }
  
  return null;
}

function LoginPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState({});
  const [parsedProfile, setParsedProfile] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const { address, isConnected } = useAccount();
  
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  
  console.log("Login page params:", { clientId, redirectUri, state });
  
  // Read profile directly from the contract when wallet is connected
  const { data: rawProfile, isLoading: isLoadingProfile, isError, error: contractError } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'profiles',
    args: [address],
    enabled: !!address
  });
  
  // Process the raw profile data when it changes
  useEffect(() => {
    if (rawProfile) {
      const profile = parseProfileData(rawProfile);
      setParsedProfile(profile);
      
      console.log('Raw profile from contract:', rawProfile);
      console.log('Parsed profile:', profile);
    } else {
      setParsedProfile(null);
    }
  }, [rawProfile]);
  
  // Update debug info whenever the contract data changes
  useEffect(() => {
    if (address) {
      setDebug(prev => ({
        ...prev,
        address,
        profileLoading: isLoadingProfile,
        profileError: isError ? contractError?.message : null,
        rawProfileData: rawProfile,
        parsedProfileData: parsedProfile
      }));
    }
  }, [address, isLoadingProfile, isError, contractError, rawProfile, parsedProfile]);

  const handleAuthorize = async () => {
    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }
    
    if (!parsedProfile || !parsedProfile.did) {
      setError("No DID found for this address. Please register first.");
      return;
    }

    try {
      // Set loading state
      setLoading(true);
      setError("");
      
      // Simple timeout to simulate processing
      setTimeout(() => {
        // Display success notification with user's name if available
        setNotification(`${parsedProfile.name || 'Account'} verified successfully!`);
        setLoading(false);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }, 1500); // Show after 1.5 seconds of simulated "loading"
      
    } catch (err) {
      console.error("Authorization error:", err);
      setError("Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in with DID Authenticator</h1>
        
        {/* Show notification when active */}
        {notification && (
          <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{notification}</span>
          </div>
        )}
        
        <div className="mb-6 flex justify-center">
          <ConnectButton />
        </div>
        
        {isConnected && (
          <div className="mb-6">
            <p className="mb-2">Connected Wallet: {address}</p>
            <p className="mb-4">DID: {isLoadingProfile ? "Loading..." : (parsedProfile?.did || "Not registered")}</p>
            
            {parsedProfile?.did && (
              <div className="mb-4 text-sm">
                <p>Name: {parsedProfile.name || "Not provided"}</p>
                <p>Email: {parsedProfile.email || "Not provided"}</p>
              </div>
            )}
            
            <button
              onClick={handleAuthorize}
              disabled={loading || isLoadingProfile || !parsedProfile?.did}
              className={`w-full p-3 text-white rounded ${
                loading || isLoadingProfile || !parsedProfile?.did ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
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
        
        {/* Debug section - only in development */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
            <p className="font-bold">Debug Info:</p>
            <pre className="overflow-auto max-h-40">{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
