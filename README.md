# AWALI - Smart Contracts

Solidity smart contracts for on-chain liquidity pools, swap deposits, fee distribution, and token faucets. Also includes Solana Anchor programs, NEAR smart contracts, and Cardano Aiken validators for multi-chain support.

## Tech Stack

| Category | Technology |
|----------|-----------|
| EVM Framework | Hardhat |
| Solidity | 0.8.20 (EVM version: london) |
| Libraries | OpenZeppelin Contracts v5.4 |
| Blockchain SDK | ethers.js v5 |
| Testing | Hardhat + Chai + Waffle |
| Non-EVM | Solana Anchor, NEAR (Rust/WASM), Cardano Aiken |

## Contracts

### LiquidityPool.sol

On-chain liquidity pool for ERC-20 tokens. Manages deposits and withdrawals by liquidity providers and swap-related balance changes.

**Key functions:**
- `addLiquidity(uint256 amount)` -- Deposit ERC-20 tokens into the pool
- `removeLiquidity(uint256 amount)` -- Withdraw tokens from the pool
- `balanceOf(address provider)` -- Get LP balance for a provider
- `releaseToPool(address recipient, uint256 amount)` -- Release tokens during swap (backend-triggered)

### SwapReceiver.sol

Receives crypto deposits from users initiating swaps. Holds deposits until the backend confirms the swap and triggers the release.

**Key functions:**
- `depositForSwap(uint256 amount, bytes32 swapId)` -- User deposits crypto for a swap
- `confirmSwap(bytes32 swapId)` -- Backend confirms swap completion
- `refund(bytes32 swapId)` -- Refund deposit if swap fails

### PoolFactory.sol

Factory contract for creating new liquidity pools. Deploys LiquidityPool instances for different token pairs.

**Key functions:**
- `createPool(address token)` -- Deploy a new LiquidityPool for an ERC-20 token
- `getPool(address token)` -- Get the pool address for a token
- `allPools()` -- List all deployed pools

### FeeDistributor.sol

Distributes WAL token fees to liquidity providers proportionally based on their pool share.

**Key functions:**
- `distributeFees(address pool, uint256 amount)` -- Distribute WAL tokens to LPs of a pool
- `claimFees()` -- LP claims their accumulated WAL rewards
- `pendingFees(address provider)` -- Check unclaimed fee balance

### USDCFaucet.sol

Testnet faucet for USDC tokens. Allows users to claim test USDC for development and testing.

**Key functions:**
- `claim()` -- Claim testnet USDC tokens
- `fund(uint256 amount)` -- Owner funds the faucet

### WAL.sol (Wal.sol)

ERC-20 token for the AWALI protocol. Used for fee distribution and LP rewards. Pegged at $1 equivalent.

**Key functions:**
- `mint(address to, uint256 amount)` -- Mint WAL tokens (restricted to authorized minters)
- `burn(uint256 amount)` -- Burn WAL tokens
- Standard ERC-20 functions (transfer, approve, etc.)

## Deployed Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| PoolFactory | `0xC0b64881920280259c3f9068bb7Ea7588d05F7d6` |
| USDCFaucet | `0xD7A79666c6e86E53376B52BB77596590DB1859F1` |
| LiquidityPool (USDC) | `0xD0B92E0bCA334B50390FC0DEa6f714dCA017b472` |
| SwapReceiver | Configured via env vars |
| WAL | Configured via env vars |
| FeeDistributor | Configured via env vars |

## Non-EVM Contracts

### Solana (Anchor)

- **Status**: Deployed on Devnet
- **Program ID**: `EYaDS4eUhePsSgb5Pr31zCAiDWvcuAHoL8pqmnHtgZuM`
- **Location**: `solana/`
- **Programs**: liquidity-pool, pool-factory, swap-receiver, usdc-faucet
- **Build**: `anchor build`

### NEAR (Rust/WASM)

- **Status**: Compiled (147KB WASM), not yet deployed (testnet account creation blocked)
- **Location**: `near/contracts/`
- **Build**: `cargo build --target wasm32-unknown-unknown --release`

### Cardano (Aiken)

- **Status**: Compiled with plutus.json generated, ready for deployment
- **Location**: `cardano/validators/`
- **Validators**: `liquidity_pool.ak`, `swap_receiver.ak`, `usdc_faucet.ak`
- **Script Hashes**:
  - Pool: `234df2d4b882cfa2de87a7ea7f45b929b8a852d0b185ac11f92011ee`
  - Swap: `124eab6e250b42ea5f5230439c7eda5a63d5ccb32818f8b42f1a1975`
  - Faucet: `290fb80e6d8e069e4dd9ba79e8cc2f1fafe3c25b9d3431a578d73768`
- **Build**: `aiken build`

## Folder Structure

```
smart_contracts/
├── contracts/                    # Solidity source files
│   ├── FeeDistributor.sol
│   ├── LiquidityPool.sol
│   ├── PoolFactory.sol
│   ├── SwapReceiver.sol
│   ├── USDCFaucet.sol
│   └── Wal.sol                   # WAL ERC-20 token
├── scripts/
│   └── deploy.js                 # Hardhat deployment script
├── test/                         # Hardhat test suites (37 tests)
│   ├── FeeDistributor.test.js
│   ├── LiquidityPool.test.js
│   ├── PoolFactory.test.js
│   ├── SwapReceiver.test.js
│   ├── USDCFaucet.test.js
│   ├── WAL.test.js
│   └── Lock.js
├── solana/                       # Solana Anchor programs
│   ├── Anchor.toml
│   ├── Cargo.toml
│   ├── programs/
│   │   └── awali/                # Main Anchor program
│   └── target/
├── near/                         # NEAR smart contracts
│   ├── contracts/                # Rust source
│   └── deploy.mjs               # Deployment script
├── cardano/                      # Cardano Aiken validators
│   ├── aiken.toml
│   ├── aiken.lock
│   ├── validators/
│   │   ├── liquidity_pool.ak
│   │   ├── swap_receiver.ak
│   │   └── usdc_faucet.ak
│   ├── lib/
│   ├── build/
│   └── plutus.json               # Compiled Plutus scripts
├── artifacts/                    # Compiled Solidity artifacts
├── cache/                        # Hardhat cache
├── hardhat.config.js             # Hardhat configuration
├── package.json
└── sonar-project.properties      # SonarQube configuration
```

## Setup

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npx hardhat compile
```

### Configure Networks

The `hardhat.config.js` supports multiple EVM testnets:

- **Sepolia** (chainId: 11155111)
- **Polygon Amoy** (chainId: 80002)
- **Arbitrum Sepolia** (chainId: 421614)
- **Base Sepolia** (chainId: 84532)
- **BSC Testnet** (chainId: 97)
- **Linea Sepolia** (chainId: 59141)

Set the deployer key via environment variable:

```env
DEPLOYER_PRIVATE_KEY=<private_key_without_0x>
SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia/<api_key>
```

## Deploy

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to other networks
npx hardhat run scripts/deploy.js --network polygonAmoy
npx hardhat run scripts/deploy.js --network arbitrumSepolia
npx hardhat run scripts/deploy.js --network baseSepolia
npx hardhat run scripts/deploy.js --network bscTestnet
npx hardhat run scripts/deploy.js --network lineaSepolia
```

## Testing

```bash
# Run all tests (37 tests)
npx hardhat test

# With gas reporting
GAS_REPORT=true npx hardhat test

# Run specific test file
npx hardhat test test/LiquidityPool.test.js
```

All 37 tests passing across 6 test suites:

| Test Suite | File |
|-----------|------|
| LiquidityPool | `test/LiquidityPool.test.js` |
| SwapReceiver | `test/SwapReceiver.test.js` |
| PoolFactory | `test/PoolFactory.test.js` |
| FeeDistributor | `test/FeeDistributor.test.js` |
| USDCFaucet | `test/USDCFaucet.test.js` |
| WAL Token | `test/WAL.test.js` |

## Fee Structure

| Fee | Rate | Distribution |
|-----|------|-------------|
| LP Fee | 0.3% | To liquidity providers via LiquidityPool |
| Protocol Fee | 0.1% | To protocol treasury |

WAL tokens are minted by the backend and distributed through the FeeDistributor contract to LP holders proportionally.

## License

Private
