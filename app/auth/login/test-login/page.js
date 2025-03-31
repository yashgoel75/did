"use client";

import { useState } from 'react';

export default function TestLoginPage() {
  const [clientId, setClientId] = useState('c910e5d9118d3417234f556887765d73');
  const [address, setAddress] = useState('0xBA75D46B76C542fC85E6917d3aEB637CBeDC6b21');
  const [did, setDid] = useState('did:eth:0xBA75D46B76C542fC85E6917d3aEB637CBeDC6b21');
  const [redirectUri, setRedirectUri] = useState('https://did-demo-weld.vercel.app/callback.html');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    
    try {
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
      
      const responseData = await codeRes.json();
      setResult(responseData);
      
      if (!codeRes.ok) {
        throw new Error(responseData.error || "Failed to generate authorization code");
      }
      
      // Redirect to the callback URL with the code
      if (redirectUri && responseData.code) {
        const finalRedirectUri = new URL(redirectUri);
        finalRedirectUri.searchParams.append('code', responseData.code);
        finalRedirectUri.searchParams.append('state', 'test-state');
        
        // Optional: uncomment to enable automatic redirect
        // window.location.href = finalRedirectUri.toString();
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.message);
    }
  };
  
  return (
    <div className="p-4 max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Test Login</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block mb-1">Wallet Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block mb-1">DID</label>
          <input
            type="text"
            value={did}
            onChange={(e) => setDid(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div>
          <label className="block mb-1">Redirect URI</label>
          <input
            type="text"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generate Auth Code
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          
          {result.code && (
            <div className="mt-4">
              <p>Redirect URL:</p>
              <a 
                href={`${redirectUri}?code=${result.code}&state=test-state`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {`${redirectUri}?code=${result.code}&state=test-state`}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}