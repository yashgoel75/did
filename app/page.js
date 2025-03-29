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
    const { writeContract, isPending, isSuccess, error } = useWriteContract();
    const { data: did } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'getDID',
        args: [address]
    });

    useEffect(() => {
        setLoaded(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isConnected) {
            setMessage('Please connect your wallet first');
            return;
        }

        const didString = `did:eth:${address}`;
        try {
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
            if (!res.ok) throw new Error('Failed to save to MongoDB');

            // Register DID on blockchain
            await writeContract({
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'registerDID',
                args: [didString, formData.name, formData.email]
            });
            setMessage('DID Registered Successfully!');
        } catch (err) {
            console.error(err.message);
            setMessage('Error: Something went wrong');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <ConnectButton />
            <h1 className="text-3xl font-bold mt-6 mb-4">DID Authenticator</h1>
            {loaded && isConnected && (
                <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                    <p className="mb-4">Wallet: {address}</p>
                    <p className="mb-4">DID: {did || 'Not registered yet'}</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            name="name"
                            placeholder="Name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value
                                })
                            }
                            required
                            className="w-full p-2 border rounded"
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value
                                })
                            }
                            required
                            className="w-full p-2 border rounded"
                        />
                        <button
                            type="submit"
                            disabled={isPending}
                            className={`w-full p-2 text-white rounded ${
                                isPending
                                    ? 'bg-gray-400'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isPending ? 'Registering...' : 'Register DID'}
                        </button>
                    </form>
                    {message && <p className="mt-4">{message}</p>}
                    {error && (
                        <p className="mt-4 text-red-600">
                            Oops! Something went wrong
                        </p>
                    )}
                    {isSuccess && (
                        <p className="mt-4 text-green-600">
                            Transaction successful!
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
