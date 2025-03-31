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
  const [isClient, setIsClient] = useState(false);
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
    query: { enabled: !!address },
  });

  const { data: searchedProfile, refetch: refetchSearch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getProfileByDid",
    args: [searchDid],
    query: { enabled: !!searchDid },
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
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

  if (!isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-6">
        <ConnectButton />
        <h1 className="text-4xl font-extrabold text-gray-800 mt-8">DID Authenticator</h1>
        <p className="text-gray-500 mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 p-6">
      <div className="flex flex-col items-center mb-8">
        <ConnectButton />
        <h1 className="text-4xl font-extrabold text-gray-800 mt-6">DID Authenticator</h1>
        {!isConnected && (
          <p className="text-gray-600 mt-2">Please connect your wallet to continue.</p>
        )}
      </div>

      {isConnected && (
        <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-4">
            <div className="text-base text-gray-700 break-words">
              <span className="font-semibold">Wallet:</span> {address}
            </div>
            <div className="text-base text-gray-700 break-words">
              <span className="font-semibold">DID:</span>{" "}
              {profile ? profile[0] : "Not registered yet"}
            </div>
            <div className="text-base text-gray-700">
              <span className="font-semibold">Name:</span>{" "}
              {profile ? profile[1] : "Not set"}
            </div>
            <div className="text-base text-gray-700">
              <span className="font-semibold">Email:</span>{" "}
              {profile ? profile[2] : "Not set"}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className={`w-full p-3 text-white rounded-lg font-semibold transition ${
                isPending || isConfirming
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPending ? "Registering..." : isConfirming ? "Confirming..." : "Register DID"}
            </button>
          </form>
          {message && (
            <p
              className={`mt-4 text-base ${
                message.includes("Error") ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      )}

      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Search by DID</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <input
            type="text"
            placeholder="Enter DID (e.g., did:eth:0x...)"
            value={searchDid}
            onChange={(e) => setSearchDid(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            type="submit"
            className="w-full p-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
          >
            Search
          </button>
        </form>
        {searchResult && (
          <div className="mt-6 space-y-2 text-base text-gray-700">
            <p>
              <span className="font-semibold">Name:</span> {searchResult.name}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {searchResult.email}
            </p>
            <p className="break-words">
              <span className="font-semibold">Owner:</span> {searchResult.owner}
            </p>
          </div>
        )}
        {message && !searchResult && searchDid && (
          <p className="mt-4 text-base text-red-600">{message}</p>
        )}
      </div>
    </div>
  );
}