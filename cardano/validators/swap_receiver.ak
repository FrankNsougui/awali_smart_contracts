/// Awali Swap Receiver — Cardano (Aiken)
///
/// Receives tokens from users for swap processing.
/// Only the owner can release tokens to a pool.

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Transaction, OutputReference}

pub type SwapDatum {
  owner: VerificationKeyHash,
}

pub type SwapRedeemer {
  /// User deposits tokens for swap — includes a unique swap identifier
  DepositForSwap { swap_uid: ByteArray }
  /// Owner releases tokens to pool after processing
  ReleaseToPool { ref_id: ByteArray }
  /// Owner rescues stuck tokens
  Rescue
}

validator swap_receiver {
  spend(
    datum: Option<SwapDatum>,
    redeemer: SwapRedeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) -> Bool {
    expect Some(d) = datum

    when redeemer is {
      // Anyone can deposit for swap
      DepositForSwap { .. } -> True

      // Only owner can release or rescue
      ReleaseToPool { .. } -> {
        list.any(tx.extra_signatories, fn(sig) { sig == d.owner })
      }

      Rescue -> {
        list.any(tx.extra_signatories, fn(sig) { sig == d.owner })
      }
    }
  }
}
