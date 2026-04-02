import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const lib = await import(
  join(import.meta.dirname, "../../server/node_modules/near-api-js/lib/index.js")
);

const { Account, JsonRpcProvider, KeyPair, KeyPairSigner } = lib;

const ACCOUNT_ID = "awali-pool.testnet";
const WASM_PATH = join(
  import.meta.dirname,
  "contracts/liquidity-pool/target/wasm32-unknown-unknown/release/awali_liquidity_pool.wasm"
);

async function main() {
  // Load credentials
  const credPath = join(homedir(), ".near-credentials/testnet", `${ACCOUNT_ID}.json`);
  const creds = JSON.parse(readFileSync(credPath, "utf8"));
  console.log("Loaded credentials for:", ACCOUNT_ID);
  console.log("Public key:", creds.public_key);

  // Setup provider and signer (v7 API)
  const provider = new JsonRpcProvider({ url: "https://rpc.testnet.near.org" });
  const keyPair = KeyPair.fromString(creds.private_key);
  const signer = new KeyPairSigner(keyPair);

  try {
    // Check account
    const state = await provider.query({
      request_type: "view_account",
      finality: "final",
      account_id: ACCOUNT_ID,
    });
    console.log("Account exists!");
    console.log("Amount:", lib.formatNearAmount(state.amount), "NEAR");
    console.log("Code hash:", state.code_hash);

    // Create account object
    const account = new Account(ACCOUNT_ID, provider, signer);

    // Deploy
    const wasmData = readFileSync(WASM_PATH);
    console.log(`Deploying contract (${wasmData.length} bytes)...`);
    const deployResult = await account.deployContract(wasmData);
    console.log("Deploy TX:", deployResult.transaction.hash);

    // Initialize
    console.log("Initializing contract...");
    const initResult = await account.callFunction({
      contractId: ACCOUNT_ID,
      methodName: "new",
      args: { token_id: "usdc.testnet", pool_name: "USDC Pool" },
      gas: lib.teraToGas(100),
    });
    console.log("Init TX:", initResult.transaction.hash);
    console.log("Done!");
  } catch (err) {
    if (err.message?.includes("does not exist") || err.cause?.name === "UNKNOWN_ACCOUNT") {
      console.log("Account does not exist on-chain.");
      console.log("\nSteps to create the account:");
      console.log("1. Go to https://app.mynearwallet.com/create");
      console.log("2. Create account: awali-pool.testnet");
      console.log("3. Fund it at https://near-faucet.io");
      console.log("4. Import the key from ~/.near-credentials/testnet/awali-pool.testnet.json");
      console.log("5. Re-run: node smart_contracts/near/deploy.mjs");
    } else {
      console.error("Error:", err.message);
      console.error(err);
    }
  }
}

main().catch(console.error);
