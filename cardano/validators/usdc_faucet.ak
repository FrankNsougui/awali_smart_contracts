/// Awali USDC Faucet Minting Policy — Cardano (Aiken)
///
/// A minting policy that allows the designated minter to mint test USDC tokens.
/// On Cardano, tokens are minted via minting policies rather than contracts.

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Transaction}

pub type FaucetRedeemer {
  /// Mint new tokens (minter only)
  Mint
  /// Burn tokens (anyone who holds them)
  Burn
}

/// Parameter: the minter's verification key hash (set at deployment)
validator usdc_faucet(minter: VerificationKeyHash) {
  mint(redeemer: FaucetRedeemer, _policy_id: ByteArray, tx: Transaction) -> Bool {
    when redeemer is {
      Mint -> {
        // Only the designated minter can mint
        list.any(tx.extra_signatories, fn(sig) { sig == minter })
      }
      Burn -> {
        // Anyone can burn their own tokens
        True
      }
    }
  }
}
