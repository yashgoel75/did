# DID Authenticator

A decentralized identity (DID) management application built with Next.js, Wagmi, RainbowKit, and a Solidity smart contract. This project allows users to register a unique DID (Decentralized Identifier) along with their name and email, store it on the Ethereum Sepolia testnet, and search for profiles by DID.

## Table of Contents

- [Overview](https://github.com/yashgoel75/did/blob/main/README.md#overview)
- [Features](https://github.com/yashgoel75/did/blob/main/README.md#features)
- [Tech Stack](https://github.com/yashgoel75/did/blob/main/README.md#tech-stack)
- [Prerequisites](https://github.com/yashgoel75/did/blob/main/README.md#prerequisites)
- [Installation](https://github.com/yashgoel75/did/blob/main/README.md#installation)
- [Smart Contract Deployment](https://github.com/yashgoel75/did/blob/main/README.md#smart-contract-deployment)
- [Usage](#usage)
- [Project Structure](https://github.com/yashgoel75/did/blob/main/README.md#project-structure)
- [Contributing](https://github.com/yashgoel75/did/blob/main/README.md#contributing)
- [License](https://github.com/yashgoel75/did/blob/main/README.md#license)

## Overview
The DID Authenticator is a web application that enables users to create and manage decentralized identities on the Ethereum blockchain. Each user can register a unique DID (in the format did:eth:`<address>`), along with their name and email, which is stored on-chain using a Solidity smart contract. The application also allows users to search for profiles by DID. The frontend is built with Next.js, and wallet interactions are handled using Wagmi and RainbowKit.

The smart contract ensures that:
- Each Ethereum address can register only one DID.
- Each DID is unique and cannot be reused.
- Data is stored permanently on the blockchain (Sepolia testnet).

## Features
- **Register a DID:** Users can connect their wallet (e.g., MetaMask), input their name and email, and register a unique DID.
- **Search by DID:** Users can search for a profile (name, email, and owner address) by entering a DID.
- **On-Chain Storage:** All data (DID, name, email) is stored on the Ethereum Sepolia testnet.
- **Wallet Integration:** Seamless wallet connection using RainbowKit and Wagmi.
- **Responsive UI:** Clean and user-friendly interface built with Tailwind CSS.

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Blockchain Interaction:** Wagmi, RainbowKit, Viem
- **Smart Contract:** Solidity (deployed on Sepolia testnet)
- **Development Tool:** Foundry (for compiling, testing, and deploying the smart contract)
- **Network:** Ethereum Sepolia testnet
- **Wallet:** MetaMask (or any wallet supported by RainbowKit)
- **Dependencies:** @tanstack/react-query, @rainbow-me/rainbowkit, wagmi, viem

## Prerequisites
Before setting up the project, ensure you have the following:
- **Node.js** (v16 or higher) and npm/yarn installed.
- **MetaMask** (or another wallet) installed in your browser.
- **Sepolia Testnet ETH:** You’ll need Sepolia ETH to deploy the contract and perform transactions. Get some from a faucet like:
    - Alchemy Sepolia Faucet
    - Infura Sepolia Faucet
- **Alchemy API Key:** For connecting to the Sepolia network. Sign up at Alchemy to get one.
- **WalletConnect Project ID:** For RainbowKit wallet integration. Get one from WalletConnect.
- **Foundry:** Install Foundry by following the official instructions:
```bash
curl -L https://foundry.paradigm.xyz | bash
```

Then run:
```bash
foundryup
```

## Installation
1. **Clone the Repository:**
```bash
git clone https://github.com/yashgoel75/did.git
cd did
```

2. **Install Dependencies:**
```bash
npm install
```

Or, if you prefer Yarn:

```bash
yarn install
```

3. **Set Up Environment Variables:**
Create a [`.env.local`] file in the root directory and add the following:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your-alchemy-api-key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
```

- Replace [`your-alchemy-api-key`] with your Alchemy API key for Sepolia.
- Replace [`your-walletconnect-project-id`] with your WalletConnect Project ID.

4. **Run the Development Server:**
```bash
npm run dev
```

Or with Yarn:
```bash
yarn dev
```

The app will be available at [`http://localhost:3000`].

## Smart Contract Deployment
The smart contract ([`DIDRegistry.sol`]) needs to be deployed to the Sepolia testnet before the app can interact with it. This project uses Foundry for smart contract development and deployment.
1. **Initialize Foundry (if not already done):**
If you haven’t initialized a Foundry project, run:
```bash
forge init
```
This will set up a Foundry project structure. Move your [`DIDRegistry.sol`] into the [`src/`] directory (e.g., [`src/DIDRegistry.sol`]).

2. **Set Up Foundry Configuration:**
Create or update a [`.env`] file in the root directory with the following:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-alchemy-api-key
PRIVATE_KEY=your-private-key
```
- Replace your-alchemy-api-key with your Alchemy API key.
- Replace your-private-key with your wallet’s private key (never share this publicly; use a secure method in production).
- Load the environment variables:

```bash
source .env
```

3. **Compile the Contract:**
Compile the smart contract using Foundry’s [`forge`]:

```bash
forge build
```

This will compile [`src/DIDRegistry.sol`] and output the artifacts to the [`out/`] directory.

4. **Deploy the Contract:**
Deploy the contract to the Sepolia testnet using [`forge`]:

```bash
forge create --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY src/DIDRegistry.sol:DIDRegistry
```

- This command deploys the [`DIDRegistry`] contract to Sepolia.
- After deployment, Foundry will output the contract address (e.g., [`Deployed to: 0x73d45fd6F1B835391161216088CbfBe1CEa62290`]).
- Note the deployed contract address.

5. Update Contract Address in Frontend:
In [`app/page.js`], update the [`CONTRACT_ADDRESS`] with the deployed address:
```javascript
const CONTRACT_ADDRESS = "your-deployed-contract-address";
```

## Usage
1. **Connect Your Wallet:**
- Open the app at http://localhost:3000.
- Click the "Connect Wallet" button (via RainbowKit) and connect your MetaMask wallet on the Sepolia network.

2. **Register a DID:**
- Once connected, you’ll see your wallet address and any existing DID (if registered).
- Enter your name and email in the form.
- Click "Register DID" to submit the transaction. Confirm the transaction in MetaMask.
- After confirmation, the UI will update to show your registered DID, name, and email.

3. **Search by DID:**
- In the "Search by DID" section, enter a DID (e.g., did:eth:0x...).
- Click "Search" to retrieve the associated name, email, and owner address.

## Project Structure
```
did/
├── app/
│   ├── page.js           # Main page with DID registration and search UI
│   ├── layout.js         # Root layout with Wagmi and RainbowKit providers
│   └── globals.css       # Global styles (Tailwind CSS)
├── src/
│   └── DIDRegistry.sol   # Smart contract for DID management
├── public/               # Static assets
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation
```

## Contributing
Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (git checkout -b feature/your-feature).
3. Make your changes and commit (git commit -m "Add your feature").
4. Push to your branch (git push origin feature/your-feature).
5. Open a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.