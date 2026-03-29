use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, AccountId, Promise, NearToken, log, require};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
#[borsh(crate = "near_sdk::borsh")]
pub struct SwapReceiver {
    owner: AccountId,
}

impl Default for SwapReceiver {
    fn default() -> Self {
        env::panic_str("Contract must be initialized with new()")
    }
}

#[near_bindgen]
impl SwapReceiver {
    #[init]
    pub fn new() -> Self {
        require!(!env::state_exists(), "Already initialized");
        Self {
            owner: env::predecessor_account_id(),
        }
    }

    /// Called via ft_transfer_call — receives tokens for swap
    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> U128 {
        let token_id = env::predecessor_account_id();
        let deposit_amount: u128 = amount.into();
        require!(deposit_amount > 0, "Zero amount");

        // msg should be the swap_uid
        log!(
            "EVENT_JSON:{{\"standard\":\"awali\",\"event\":\"swap_deposit\",\"data\":{{\"swap_uid\":\"{}\",\"user\":\"{}\",\"token\":\"{}\",\"amount\":\"{}\",\"timestamp\":{}}}}}",
            msg, sender_id, token_id, deposit_amount, env::block_timestamp() / 1_000_000_000
        );

        U128(0) // keep all tokens
    }

    /// Owner releases tokens to a pool after swap processing
    pub fn release_to_pool(
        &self,
        token_id: AccountId,
        pool_id: AccountId,
        amount: U128,
        _ref_id: String,
    ) -> Promise {
        require!(env::predecessor_account_id() == self.owner, "Only owner");
        Promise::new(token_id).function_call(
            "ft_transfer".to_string(),
            near_sdk::serde_json::json!({
                "receiver_id": pool_id,
                "amount": amount,
            }).to_string().into_bytes(),
            NearToken::from_yoctonear(1),
            near_sdk::Gas::from_tgas(30),
        )
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner.clone()
    }
}
