"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseAbi } from "viem";

const CONTRACT_ADDRESS = "0xaF52fF3fe18434226749f2CC8652900Cb7f23937";
const abi = parseAbi([
  "function registerDID(string did, string name, string email) public",
  "function getProfileByDid(string did) public view returns (string name, string email, address owner)",
  "event DIDRegistered(string did, address indexed owner, string name, string email)",
  "function profiles(address) public view returns (string did, string name, string email)",
]);

export default function Home() {
  const { address, isConnected } = useAccount();
  const [isClient, setIsClient] = useState(false); // New state to track client-side rendering
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [searchDid, setSearchDid] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [message, setMessage] = useState("");
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: profile, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "profiles",
    args: [address],
    query: { enabled: !!address }, // Only fetch when address is available
  });

  const { data: searchedProfile, refetch: refetchSearch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getProfileByDid",
    args: [searchDid],
    query: { enabled: !!searchDid },
  });

  // Set isClient to true only on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log("Profile data:", profile);
  }, [profile]);

  useEffect(() => {
    console.log("Searched profile data:", searchedProfile);
    if (searchedProfile) {
      setSearchResult({
        name: searchedProfile[0],
        email: searchedProfile[1],
        owner: searchedProfile[2],
      });
    } else if (searchDid && !searchedProfile) {
      setSearchResult(null);
      setMessage("No profile found for this DID");
    }
  }, [searchedProfile, searchDid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      setMessage("Please connect your wallet first");
      return;
    }

    setMessage("");
    const didString = `did:eth:${address}`;
    try {
      await writeContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: "registerDID",
        args: [didString, formData.name, formData.email],
      });
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchDid) {
      setMessage("Please enter a DID to search");
      return;
    }
    setMessage("");
    setSearchResult(null);
    refetchSearch();
  };

  useEffect(() => {
    if (hash && !isConfirming && !isConfirmed) {
      setMessage("Transaction submitted, waiting for confirmation...");
    }
    if (isConfirmed) {
      setMessage("DID Registered Successfully!");
      setFormData({ name: "", email: "" });
      refetch();
    }
    if (error) {
      setMessage(`Error: ${error.message}`);
    }
  }, [hash, isConfirming, isConfirmed, error, refetch]);

  // Render minimal content on the server, full content on the client
  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <ConnectButton />
        <h1 className="text-3xl font-bold mt-6 mb-4">DID Authenticator</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <ConnectButton />
      <h1 className="text-3xl font-bold mt-6 mb-4">DID Authenticator</h1>
      {!isConnected && <p>Please connect your wallet to continue.</p>}
      {isConnected && (
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
          <p className="mb-4">Wallet: {address}</p>
          <p className="mb-4">DID: {profile?.did || "Not registered yet"}</p>
          <p className="mb-4">Name: {profile?.name || "Not set"}</p>
          <p className="mb-4">Email: {profile?.email || "Not set"}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className={`w-full p-2 text-white rounded ${
                isPending || isConfirming ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPending ? "Registering..." : isConfirming ? "Confirming..." : "Register DID"}
            </button>
          </form>
          {message && <p className="mt-4">{message}</p>}
        </div>
      )}
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-bold mb-4">Search by DID</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <input
            type="text"
            placeholder="Enter DID (e.g., did:eth:0x...)"
            value={searchDid}
            //onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onChange={(e) => setSearchDid(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="w-full p-2 text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            Search
          </button>
        </form>
        {searchResult && (
          <div className="mt-4">
            <p>Name: {searchResult.name}</p>
            <p>Email: {searchResult.email}</p>
            <p>Owner: {searchResult.owner}</p>
          </div>
        )}
        {message && !searchResult && searchDid && <p className="mt-4">{message}</p>}
      </div>
    </div>
  );
}