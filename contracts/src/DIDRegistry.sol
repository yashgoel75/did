// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DIDRegistry {
    struct Profile {
        string name;
        string email;
        address owner;
    }

    mapping(string => Profile) public dids;
    mapping(address => string) public addressToDid;

    event DIDRegistered(string did, address indexed owner, string name, string email);

    function registerDID(string memory did, string memory name, string memory email) public {
        require(bytes(addressToDid[msg.sender]).length == 0, "DID already registered for this address");
        require(bytes(dids[did].name).length == 0, "DID already exists");

        dids[did] = Profile(name, email, msg.sender);
        addressToDid[msg.sender] = did;
        emit DIDRegistered(did, msg.sender, name, email);
    }

    function updateProfile(string memory did, string memory name, string memory email) public {
        Profile storage profile = dids[did];
        require(profile.owner == msg.sender, "Not the DID owner");
        profile.name = name;
        profile.email = email;
    }

    function getDID(address user) public view returns (string memory) {
        return addressToDid[user];
    }
}