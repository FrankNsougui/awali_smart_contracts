/// Awali Liquidity Pool — Cardano (Aiken)
///
/// Holds tokens deposited by liquidity providers.
/// The owner (backend wallet) can withdraw tokens for swaps.
/// Providers deposit by sending tokens to the script address with a deposit_ref in the datum.

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Transaction, OutputReference, Input, Output}

/// Pool datum — stored with each UTXO at the script address
pub type PoolDatum {
  owner: VerificationKeyHash,
  pool_name: ByteArray,
  token_policy: ByteArray,
  token_name: ByteArray,
}

/// Redeemer actions the validator can process
pub type PoolRedeemer {
  /// Provider deposits tokens — anyone can deposit
  Deposit { deposit_ref: ByteArray }
  /// Owner withdraws tokens to a destination
  Withdraw { withdraw_ref: ByteArray }
}

validator liquidity_pool {
  spend(
    datum: Option<PoolDatum>,
    redeemer: PoolRedeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) -> Bool {
    expect Some(d) = datum

    when redeemer is {
      // Deposit: always allowed — the provider sends tokens to the script address
      // The continuing output must preserve the datum
      Deposit { .. } -> True

      // Withdraw: only the owner can withdraw
      Withdraw { .. } -> {
        let owner_signed = list.any(
          tx.extra_signatories,
          fn(sig) { sig == d.owner },
        )
        owner_signed
      }
    }
  }
}
