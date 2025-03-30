// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DIDRegistry {
    struct Profile {
        string did;
        string name;
        string email;
    }

    mapping(address => Profile) public profiles;
    mapping(string => address) public didToAddress; // NEW: Store DID-to-Address mapping

    event DIDRegistered(string did, address indexed owner, string name, string email);

    function registerDID(string memory did, string memory name, string memory email) public {
        require(bytes(profiles[msg.sender].did).length == 0, "DID already registered for this address");
        require(didToAddress[did] == address(0), "DID already exists"); // Prevent duplicate DIDs

        profiles[msg.sender] = Profile(did, name, email);
        didToAddress[did] = msg.sender; // Store DID-to-Address mapping

        emit DIDRegistered(did, msg.sender, name, email);
    }

    function getProfileByDid(string memory did) public view returns (string memory name, string memory email, address owner) {
        address user = didToAddress[did]; // Retrieve address from DID mapping
        require(user != address(0), "DID not found");

        Profile memory profile = profiles[user];
        return (profile.name, profile.email, user);
    }
}
