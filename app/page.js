'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseAbi } from 'viem';

const CONTRACT_ADDRESS = '0xc84fE0C202E1f00698Fe577363609Df6adD127e3';
const abi = parseAbi([
    'function registerDID(string did, string name, string email) public',
    'function getDID(address user) public view returns (string)'
]);

export default function Home() {
    const [loaded, setLoaded] = useState(false);
    const { address, isConnected } = useAccount();
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [message, setMessage] = useState('');
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const { writeContract, isPending, isSuccess, error } = useWriteContract();
    
    const { data: did, refetch: refetchDID } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getDID',
        args: [address],
        enabled: !!address,
    });
    
    // Add a local DID state 
    const [localDID, setLocalDID] = useState('');

    useEffect(() => {
        setLoaded(true);
        // If user already has a DID, default to login mode
        if (did && did.length > 0) {
            setAuthMode('login');
            setLocalDID(did);
        }
    }, [did]);

    useEffect(() => {
        if (isSuccess && address) {
            console.log("Transaction successful, refetching DID...");
            setTimeout(() => {
                refetchDID();
            }, 2000);
        }
    }, [isSuccess, address, refetchDID]);

    // Authentication - used for login
    const authenticateUser = async () => {
        if (!isConnected) {
            setMessage('Please connect your wallet first');
            return;
        }
      
        try {
            setMessage('Authenticating with DID...');
          
            // Try MongoDB-based auth that verifies DID
            let res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            });
         
            const data = await res.json();
          
            if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
            if (data.authenticated) {
                setMessage(`Welcome back! Your identity has been verified.`);
                if (data.did) {
                    setLocalDID(data.did);
                    refetchDID();
                }
            } else {
                setMessage('Identity verification failed. Please register first.');
                setAuthMode('register');
            }
        } catch (err) {
            console.error(err.message);
            setMessage(`Authentication Error: ${err.message}`);
        }
};

    // Registration handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConnected) {
            setMessage('Please connect your wallet first');
            return;
        }

        const didString = `did:eth:${address}`;
        try {
            setMessage('Registering your decentralized identity...');
            
            // Save to MongoDB
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address,
                    did: didString,
                    name: formData.name,
                    email: formData.email
                })
            });
            if (!res.ok) throw new Error('Failed to save identity data');

            // Set local DID
            setLocalDID(didString);
            
            // Register DID on blockchain
            await writeContract({
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'registerDID',
                args: [didString, formData.name, formData.email]
            });
            
            setMessage('DID Registration Successful! You can now log in with your wallet.');
            setAuthMode('login');
            
        } catch (err) {
            console.error(err.message);
            setMessage('Error: Registration failed. Please try again.');
        }
    };

    // Toggle between login and register modes
    const toggleAuthMode = () => {
        setAuthMode(authMode === 'login' ? 'register' : 'login');
        setMessage('');
    };

    const displayDID = did || localDID;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <ConnectButton />
            <h1 className="text-3xl font-bold mt-6 mb-2">DID Authenticator</h1>
            
            {/* Auth Mode Toggle */}
            {loaded && isConnected && (
                <div className="flex bg-white rounded-lg p-1 mb-6 shadow-sm">
                    <button
                        onClick={() => setAuthMode('login')}
                        className={`px-6 py-2 rounded-md ${
                            authMode === 'login'
                                ? 'bg-blue-600 text-white'
                                : 'bg-transparent text-gray-700'
                        }`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setAuthMode('register')}
                        className={`px-6 py-2 rounded-md ${
                            authMode === 'register'
                                ? 'bg-blue-600 text-white'
                                : 'bg-transparent text-gray-700'
                        }`}
                    >
                        Register
                    </button>
                </div>
            )}
            
            {loaded && isConnected && (
                <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                    <p className="mb-4">Wallet: {address}</p>
                    <p className="mb-4">DID Status: {displayDID ? 'Registered' : 'Not registered'}</p>
                    
                    {/* Login Mode */}
                    {authMode === 'login' && (
                        <div className="text-center">
                            <p className="mb-6 text-gray-600">Authenticate with your wallet to verify your decentralized identity</p>
                            <button
                                onClick={authenticateUser}
                                className="w-full p-3 text-white rounded-lg bg-green-600 hover:bg-green-700 font-medium"
                            >
                                Authenticate with DID
                            </button>
                            <p className="mt-4 text-sm text-gray-600">
                                Don't have a DID yet?{' '}
                                <button
                                    onClick={toggleAuthMode}
                                    className="text-blue-600 hover:underline"
                                >
                                    Register now
                                </button>
                            </p>
                        </div>
                    )}
                    
                    {/* Register Mode */}
                    {authMode === 'register' && (
                        <div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value
                                            })
                                        }
                                        required
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value
                                            })
                                        }
                                        required
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className={`w-full p-3 text-white rounded-lg font-medium ${
                                        isPending
                                            ? 'bg-gray-400'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                >
                                    {isPending ? 'Registering...' : 'Register DID'}
                                </button>
                            </form>
                            <p className="mt-4 text-sm text-gray-600 text-center">
                                Already have a DID?{' '}
                                <button
                                    onClick={toggleAuthMode}
                                    className="text-blue-600 hover:underline"
                                >
                                    Login instead
                                </button>
                            </p>
                        </div>
                    )}
                    
                    {/* Messages */}
                    {message && (
                        <div className={`mt-6 p-3 rounded-lg ${
                            message.includes('Error') || message.includes('failed')
                                ? 'bg-red-50 text-red-700'
                                : message.includes('Success') || message.includes('verified') || message.includes('Welcome')
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-blue-50 text-blue-700'
                        }`}>
                            {message}
                        </div>
                    )}
                    
                    {error && (
                        <p className="mt-4 text-red-600 p-3 bg-red-50 rounded-lg">
                            Error: Transaction failed
                        </p>
                    )}
                    
                    {isSuccess && (
                        <p className="mt-4 text-green-600 p-3 bg-green-50 rounded-lg">
                            Transaction successful!
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
