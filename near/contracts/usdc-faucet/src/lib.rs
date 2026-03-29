use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::LookupMap;
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, AccountId, Promise, NearToken, log, require};

/// NEP-141 compatible USDC faucet for testnet
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
#[borsh(crate = "near_sdk::borsh")]
pub struct UsdcFaucet {
    owner: AccountId,
    total_supply: u128,
    balances: LookupMap<AccountId, u128>,
    decimals: u8,
}

impl Default for UsdcFaucet {
    fn default() -> Self {
        env::panic_str("Contract must be initialized with new()")
    }
}

#[near_bindgen]
impl UsdcFaucet {
    #[init]
    pub fn new() -> Self {
        require!(!env::state_exists(), "Already initialized");
        Self {
            owner: env::predecessor_account_id(),
            total_supply: 0,
            balances: LookupMap::new(b"b"),
            decimals: 6,
        }
    }

    /// Mint tokens to a recipient (owner only)
    pub fn mint(&mut self, to: AccountId, amount: U128) {
        require!(env::predecessor_account_id() == self.owner, "Only owner can mint");
        let mint_amount: u128 = amount.into();
        let current = self.balances.get(&to).unwrap_or(0);
        self.balances.insert(&to, &(current + mint_amount));
        self.total_supply += mint_amount;
        log!("EVENT_JSON:{{\"standard\":\"nep141\",\"event\":\"ft_mint\",\"data\":{{\"owner_id\":\"{}\",\"amount\":\"{}\"}}}}", to, mint_amount);
    }

    // ── NEP-141 Standard ──

    pub fn ft_transfer(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>) {
        require!(env::attached_deposit() == NearToken::from_yoctonear(1), "Requires 1 yoctoNEAR");
        let sender = env::predecessor_account_id();
        let transfer_amount: u128 = amount.into();
        let sender_balance = self.balances.get(&sender).unwrap_or(0);
        require!(sender_balance >= transfer_amount, "Insufficient balance");

        self.balances.insert(&sender, &(sender_balance - transfer_amount));
        let receiver_balance = self.balances.get(&receiver_id).unwrap_or(0);
        self.balances.insert(&receiver_id, &(receiver_balance + transfer_amount));

        if let Some(m) = memo {
            log!("Transfer memo: {}", m);
        }
    }

    pub fn ft_transfer_call(&mut self, receiver_id: AccountId, amount: U128, memo: Option<String>, msg: String) -> Promise {
        self.ft_transfer(receiver_id.clone(), amount, memo);
        // Call ft_on_transfer on the receiver contract
        Promise::new(receiver_id).function_call(
            "ft_on_transfer".to_string(),
            near_sdk::serde_json::json!({
                "sender_id": env::predecessor_account_id(),
                "amount": amount,
                "msg": msg,
            }).to_string().into_bytes(),
            NearToken::from_yoctonear(0),
            near_sdk::Gas::from_tgas(30),
        )
    }

    // ── View methods ──

    pub fn ft_balance_of(&self, account_id: AccountId) -> U128 {
        U128(self.balances.get(&account_id).unwrap_or(0))
    }

    pub fn ft_total_supply(&self) -> U128 {
        U128(self.total_supply)
    }

    pub fn ft_metadata(&self) -> FtMetadata {
        FtMetadata {
            spec: "ft-1.0.0".to_string(),
            name: "USD Coin".to_string(),
            symbol: "USDC".to_string(),
            decimals: self.decimals,
        }
    }
}

#[derive(near_sdk::serde::Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct FtMetadata {
    pub spec: String,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
}
