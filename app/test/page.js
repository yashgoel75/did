'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { parseAbi } from 'viem';

const CONTRACT_ADDRESS = '0xaF52fF3fe18434226749f2CC8652900Cb7f23937';
const abi = parseAbi([
  'function profiles(address) public view returns (string did, string name, string email)'
]);

export default function DirectTestPage() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  
  // Add log function to collect debugging info
  const addLog = (message) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };
  
  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }
      
      addLog('Requesting accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const connectedAccount = accounts[0];
      
      addLog(`Connected to account: ${connectedAccount}`);
      setAccount(connectedAccount);
      setConnected(true);
      
      // Get network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      addLog(`Current chain ID: ${chainId}`);
      
      fetchProfile(connectedAccount);
    } catch (err) {
      addLog(`Error connecting: ${err.message}`);
      setError(`Failed to connect: ${err.message}`);
    }
  };
  
  // Fetch profile directly
  const fetchProfile = async (walletAddress) => {
    try {
      setLoading(true);
      addLog(`Fetching profile for ${walletAddress}...`);
      
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http("https://eth-sepolia.g.alchemy.com/v2/-DcT-NFdhaJSS6OR8zR_itZiCcnsJEMC")
      });
      
      // Normalize address
      const normalizedAddress = getAddress(walletAddress);
      addLog(`Normalized address: ${normalizedAddress}`);
      
      // Read from contract
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "profiles",
        args: [normalizedAddress]
      });
      
      addLog(`Contract response: ${JSON.stringify(result)}`);
      setProfileData(result);
    } catch (err) {
      addLog(`Error fetching profile: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center">Direct DID Contract Test</h1>
      
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {!connected ? (
          <button
            onClick={connectWallet}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Connect MetaMask
          </button>
        ) : (
          <div>
            <div className="p-4 bg-gray-50 rounded mb-4">
              <p><strong>Connected Account:</strong> {account}</p>
            </div>
            
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-2">Profile Data:</h2>
              {loading ? (
                <p>Loading profile data...</p>
              ) : profileData ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <p><strong>DID:</strong> {profileData.did || 'Not set'}</p>
                  <p><strong>Name:</strong> {profileData.name || 'Not set'}</p>
                  <p><strong>Email:</strong> {profileData.email || 'Not set'}</p>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-gray-600">Raw data:</p>
                    <pre className="text-xs overflow-auto mt-1 bg-gray-50 p-2 rounded">
                      {JSON.stringify(profileData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p>No profile data found.</p>
              )}
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Debug Logs:</h2>
              <div className="bg-gray-100 p-3 rounded h-48 overflow-y-auto text-xs font-mono">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}