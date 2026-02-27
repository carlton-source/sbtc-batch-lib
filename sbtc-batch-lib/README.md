# sBTC Batch Transfer

<div align="center">

![sBTC Batch Transfer](https://img.shields.io/badge/sBTC-Batch%20Transfer-7c3aed?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Stacks](https://img.shields.io/badge/Stacks-Blockchain-5546ff?style=for-the-badge)](https://www.stacks.co/)

**Enterprise-grade payment distribution for Bitcoin on Stacks**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Demo](#-demo) • [Contributing](#-contributing)

</div>

---

## 🎯 Overview

sBTC Batch Transfer is a smart contract library and web application that enables businesses, DAOs, and individuals to send sBTC (Bitcoin on Stacks) to multiple recipients in a single atomic transaction. Save up to **95% on gas fees** while distributing payments to up to **200 addresses** simultaneously.

### Why Batch Transfer?

- **💰 Massive Gas Savings**: Up to 95% reduction in network fees vs. individual transfers
- **⚡ Lightning Fast**: Send to 200 addresses in one transaction
- **🔒 Atomic Execution**: All transfers succeed or fail together—no partial batches
- **✅ Real-Time Validation**: Instant address verification before broadcasting
- **📊 Enterprise Ready**: Built for payroll, airdrops, and treasury management

---

## ✨ Features

### Smart Contract Layer
- **Batch Processing**: Transfer to up to 200 recipients in a single transaction
- **SIP-010 Compatible**: Works with any SIP-010 fungible token (optimized for sBTC)
- **Gas Optimization**: Efficient iteration and validation for minimal fees
- **Fail-Safe Design**: Atomic operations with comprehensive error handling
- **Audit Trail**: Full on-chain record of all distributions

### Frontend Application
- **Modern UI**: Premium dark mode interface with deep violet/gold design system
- **Multiple Input Methods**: Manual entry, CSV upload, or pre-built templates
- **Template Library**: Pre-configured batches for payroll, airdrops, and treasury
- **Real-Time Preview**: See total amounts and fee estimates before execution
- **Transaction History**: Track all past batches with detailed status
- **Wallet Integration**: Seamless Stacks wallet connectivity

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ and npm
- [Clarinet](https://github.com/hirosystems/clarinet) for smart contract development
- A Stacks wallet ([Leather](https://leather.io/) or [Xverse](https://www.xverse.app/))

### Installation

```bash
# Clone the repository
git clone https://github.com/carlton-source/sbtc-batch-lib.git
cd sbtc-batch-lib

# Install dependencies
npm install

# Run smart contract tests
npm test

# Start the frontend development server
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:8080`

---

## 🏗️ Project Structure

```
sbtc-batch-lib/
├── contracts/
│   ├── batch-transfer.clar      # Main batch transfer contract
│   └── mock-sbtc.clar           # Mock sBTC token for testing
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── contexts/            # Wallet & app state
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Contract integration & utilities
│   │   └── pages/               # App routes
│   └── package.json
├── tests/
│   └── batch-transfer.test.ts   # Contract unit tests
├── scripts/
│   ├── deploy-testnet.ts        # Testnet deployment script
│   └── test-testnet.ts          # Testnet integration tests
├── Clarinet.toml                # Clarinet configuration
└── package.json
```

---

## 📖 Documentation

### Smart Contract Usage

Deploy the contract and call the batch transfer function:

```clarity
(contract-call? .batch-transfer batch-transfer
  .sbtc-token
  (list 
    {to: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ, amount: u500000}
    {to: 'SP3GWX3NE58KJET25ZZ6D193D4D3EMXT5E8KXNJV, amount: u250000}
    {to: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8K, amount: u750000}
  )
)
```

### Frontend Integration

The web application provides three ways to create batches:

1. **Manual Entry**: Add recipients one at a time with address and amount
2. **CSV Upload**: Upload a CSV file with columns: `address,amount,unit`
3. **Templates**: Use pre-built templates for common scenarios (payroll, airdrops, treasury)

For detailed frontend documentation, see [docs/FRONTEND_PRD.md](docs/FRONTEND_PRD.md)

---

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:report

# Watch mode (auto-run on file changes)
npm run test:watch
```

### Testnet Deployment

```bash
# Deploy to testnet
npm run deploy:testnet

# Run testnet integration tests
npm run test:testnet
```

---

## 🎨 Demo

**Live Demo**: [Coming Soon]

### Use Cases

| Use Case | Description | Ideal For |
|----------|-------------|-----------|
| 💼 **Payroll** | Distribute monthly salaries to team members | Companies, DAOs |
| 🎁 **Airdrops** | Send equal amounts to community members | Marketing, Growth |
| 🏦 **Treasury** | Allocate funds across sub-wallets | Organizations, Treasuries |

---

## 🛠️ Technology Stack

### Smart Contracts
- **Clarity**: Stacks smart contract language
- **Clarinet**: Development and testing framework
- **Vitest**: Unit testing with Clarinet SDK

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Premium component library
- **@stacks/connect**: Wallet integration
- **React Query**: Data fetching and caching

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for all new features
- Follow the existing code style
- Update documentation for API changes
- Ensure all tests pass before submitting PR

---

## 📋 Roadmap

- [x] Core batch transfer contract
- [x] Frontend web application
- [x] CSV upload support
- [x] Template library
- [ ] Multi-token support (beyond sBTC)
- [ ] Scheduled/recurring batches
- [ ] Multi-signature support
- [ ] Mobile application
- [ ] API for programmatic access

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built on the [Stacks blockchain](https://www.stacks.co/)
- Inspired by the need for efficient treasury management in DAOs
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Developed with support from the Stacks community

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/carlton-source/sbtc-batch-lib/issues)
- **Discussions**: [GitHub Discussions](https://github.com/carlton-source/sbtc-batch-lib/discussions)
- **Twitter**: [@sBTCBatch](https://twitter.com/sBTCBatch)

---

<div align="center">

**[⬆ back to top](#sbtc-batch-transfer)**

Made with ❤️ by the sBTC community

</div>
