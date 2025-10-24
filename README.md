# D-App Backend (MERN) — Semi DApp with Wallet & Card Payments

## Overview

A backend for a semi-decentralized application (Semi DApp) built with the MERN stack.  
Supports on-chain interactions (read-only or signed transactions via connected wallet), an off-chain wallet system, and card payments (PCI-compliant via a payment gateway). Designed for modularity, security, and easy deployment.

## Key Features

- RESTful API built with **Express** and **Node.js**
- **MongoDB** database for application and user data
- **JWT** authentication + refresh tokens
- On-chain integration (Ethereum-compatible networks) via **ethers.js / web3.js**
- Card payments integration (Stripe behind a payment service)
- Idempotent deposit/withdraw flows and reconciliations
- Role-based access control (admin, user, auditor)
- Auditable transaction log and webhook handlers
- Rate limiting, input validation, and logging

## Architecture (high level)

1. **API Layer** — Express routes, validation, controllers
2. **Service Layer** — Business logic (payments, wallets, on-chain ops)
3. **Data Layer** — Mongoose models and repositories
4. **External Integrations** — Payment gateway, blockchain node/provider, email/SMS provider

## Recommended Tech Stack

- Node.js (LTS)
- Express
- MongoDB (Atlas or self-hosted)
- Mongoose
- ethers.js (or web3.js)
- Stripe (card payments) or another PCI-compliant gateway
- Jest / Supertest for tests
