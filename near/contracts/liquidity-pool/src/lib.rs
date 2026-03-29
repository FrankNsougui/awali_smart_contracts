use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::LookupMap;
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, AccountId, Promise, NearToken, log, require};
use near_sdk::serde::{Deserialize, Serialize};

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
#[borsh(crate = "near_sdk::borsh")]
pub struct LiquidityPool {
    owner: AccountId,
    token_id: AccountId,
    pool_name: String,
    total_deposited: u128,
    deposits: LookupMap<AccountId, u128>,
}

impl Default for LiquidityPool {
    fn default() -> Self {
        env::panic_str("Contract must be initialized with new()")
    }
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct DepositEvent {
    pub provider: AccountId,
    pub amount: U128,
    pub deposit_ref: String,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct WithdrawEvent {
    pub to: AccountId,
    pub amount: U128,
    pub withdraw_ref: String,
}

#[near_bindgen]
impl LiquidityPool {
    #[init]
    pub fn new(token_id: AccountId, pool_name: String) -> Self {
        require!(!env::state_exists(), "Already initialized");
        Self {
            owner: env::predecessor_account_id(),
            token_id,
            pool_name,
            total_deposited: 0,
            deposits: LookupMap::new(b"d"),
        }
    }

    /// Called by NEP-141 ft_on_transfer callback when tokens are sent to this contract
    pub fn ft_on_transfer(&mut self, sender_id: AccountId, amount: U128, msg: String) -> U128 {
        let token_id = env::predecessor_account_id();
        require!(token_id == self.token_id, "Wrong token");

        let deposit_amount: u128 = amount.into();
        require!(deposit_amount > 0, "Zero amount");

        // Track deposit
        let current = self.deposits.get(&sender_id).unwrap_or(0);
        self.deposits.insert(&sender_id, &(current + deposit_amount));
        self.total_deposited += deposit_amount;

        // Emit event
        let event = DepositEvent {
            provider: sender_id,
            amount,
            deposit_ref: msg,
        };
        let event_json = near_sdk::serde_json::to_string(&event).unwrap();
        log!("EVENT_JSON:{{\"standard\":\"awali\",\"event\":\"liquidity_added\",\"data\":{}}}", event_json);

        // Return 0 = keep all tokens (don't refund)
        U128(0)
    }

    /// Owner withdraws tokens to a destination account
    pub fn withdraw_to(&mut self, to: AccountId, amount: U128, withdraw_ref: String) -> Promise {
        require!(env::predecessor_account_id() == self.owner, "Only owner");
        let withdraw_amount: u128 = amount.into();
        require!(withdraw_amount > 0, "Zero amount");
        require!(self.total_deposited >= withdraw_amount, "Insufficient pool balance");

        self.total_deposited -= withdraw_amount;

        let event = WithdrawEvent {
            to: to.clone(),
            amount,
            withdraw_ref,
        };
        let event_json = near_sdk::serde_json::to_string(&event).unwrap();
        log!("EVENT_JSON:{{\"standard\":\"awali\",\"event\":\"liquidity_removed\",\"data\":{}}}", event_json);

        // NEP-141 ft_transfer call
        Promise::new(self.token_id.clone()).function_call(
            "ft_transfer".to_string(),
            near_sdk::serde_json::json!({
                "receiver_id": to,
                "amount": amount,
            }).to_string().into_bytes(),
            NearToken::from_yoctonear(1), // 1 yoctoNEAR for storage
            near_sdk::Gas::from_tgas(30),
        )
    }

    // ── View methods ──

    pub fn pool_balance(&self) -> U128 {
        U128(self.total_deposited)
    }

    pub fn get_deposit(&self, account_id: AccountId) -> U128 {
        U128(self.deposits.get(&account_id).unwrap_or(0))
    }

    pub fn get_pool_name(&self) -> String {
        self.pool_name.clone()
    }

    pub fn get_token_id(&self) -> AccountId {
        self.token_id.clone()
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner.clone()
    }
}
