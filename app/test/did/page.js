'use client';

import { useState } from 'react';
import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';

const CONTRACT_ADDRESS = '0xaF52fF3fe18434226749f2CC8652900Cb7f23937';
const abi = parseAbi([
  'function profiles(address) public view returns (string did, string name, string email)'
]);

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://eth-sepolia.g.alchemy.com/v2/-DcT-NFdhaJSS6OR8zR_itZiCcnsJEMC")
});

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

export default function TestDidPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [error, setError] = useState('');
  const [normalizedAddress, setNormalizedAddress] = useState('');
  
  const checkDid = async () => {
    if (!address) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    setRawResponse(null);
    setNormalizedAddress('');
    
    try {
      // Normalize address to checksummed format
      let cleanAddress;
      try {
        cleanAddress = getAddress(address.trim());
        setNormalizedAddress(cleanAddress);
      } catch (addrErr) {
        throw new Error(`Invalid Ethereum address format: ${addrErr.message}`);
      }
      
      console.log(`Checking DID for address: ${cleanAddress}`);
      
      const response = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'profiles',
        args: [cleanAddress]
      });
      
      console.log('Raw contract response:', response);
      setRawResponse(response);
      
      // Parse the response
      const parsedProfile = parseProfileData(response);
      console.log('Parsed profile:', parsedProfile);
      
      setResult(parsedProfile);
    } catch (err) {
      console.error('Error checking DID:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">DID Registration Test</h1>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="address">
            Enter Wallet Address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <button
          onClick={checkDid}
          disabled={loading || !address}
          className={`w-full p-3 text-white rounded ${
            loading || !address ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Checking...' : 'Check DID Registration'}
        </button>
        
        {normalizedAddress && (
          <div className="mt-2 text-xs text-gray-500">
            Normalized address: {normalizedAddress}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <h2 className="font-bold text-green-800 mb-2">Profile Found:</h2>
            <p><strong>DID:</strong> {result.did || 'Not set'}</p>
            <p><strong>Name:</strong> {result.name || 'Not set'}</p>
            <p><strong>Email:</strong> {result.email || 'Not set'}</p>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-gray-600">Raw response:</p>
              <pre className="text-xs overflow-auto mt-1 bg-gray-50 p-2 rounded">
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        {result === null && !error && !loading && (
          <p className="mt-4 text-center text-gray-600">Enter an address and click the button to check.</p>
        )}
      </div>
    </div>
  );
}