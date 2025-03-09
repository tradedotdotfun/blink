# Blink Provider Server for Tradedotfun

## Overview
This **Blink Provider Server** integrates with the **Dialect Blink framework** to enable seamless on-chain interactions for **Tradedotfun**, allowing users to participate in the trading competition via Blink actions.

## Features
- Responds to Blink client requests.
- Provides **metadata** for Blink UI.
- Generates **Solana transactions** for participation.
- Handles **CORS requests** for cross-origin compatibility.
- Manages **Program Derived Addresses (PDAs)** for secure deposits.

## Setup
### Prerequisites
- **Node.js** (>=16.x)
- **npm** or **yarn**
- **Solana CLI**

### Installation
```sh
git clone <your-repo-url>
cd blink-provider-server
npm install
```
Create a `.env` file:
```sh
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=3001
```

### Start Server
```sh
npm run start
```
Runs on `http://localhost:3001`.

## API Endpoints
- **GET /actions/participate** → Returns metadata for Blink UI.
- **GET /actions.json** → Provides Blink action rules.
- **POST /actions/participate** → Creates and returns a **serialized Solana transaction**.
