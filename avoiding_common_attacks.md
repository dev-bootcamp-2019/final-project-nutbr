# A document called avoiding_common_attacks.md that explains what measures you took to ensure that your contracts are not susceptible to common attacks. (Module 9 Lesson 3)

# Overflow protection
`SafeMath` library performs mathematical operations that can be vulnerable to overflow/underflow. It checks if the operation has overflow/underflow and discards if it happened in a way that the transactions does not run/execute.

# Balance of the contract
As we learned, a contract is not supposed to store an ether balance because it should just forward payments/transactions from an user to the exchange. The fallback function always reverts whem it happens and if any ether was sent to the contract, it can be redeemed destroying the contract through another function.

# Owner's right
The execution of contract functions is only available to those who have rights. For instance, just the owner can add another exchange. Just the exchange owner's contract can add another currency pair. Those implementations were implemented on modifiers: `onlyOwner`, `onlyTraderOwner` and `onlyBidAskOwner`
In sum:
- admin: destroy/pause/unpause/add/edit/remove/buy/sell currencies and exchanges
- exchange owner: add/edit/remove/buy/sell currencies
- anyone: buy/sell currencies

# Re-entrancy protection
Ether is sent only by `.transfer()` and it does not provide enough gas to execute any other code.Besides, it is always executed on the end of a function after importantes state changes are made. For example, when a regular account user (not admin nor exchange) executes a transaction, it is forwarded to the exchange/trader owner address that was previously inserted by the administrator/owner of the contract.
So, the exchange owner addresses is considered trusted to be external addresses and not a contract addresses, what could be a bad scenario in which a transaction could revert and the transaction would never be confirmed or exist. In the other hand, in just one case there is a untrusted address, that is the account that is not from owner/admin or owner/exchange. In this case if he sends an excessive amount of ether he will get the change back at end of the operation. In sum, with this function the worst thing a malicious attck can perform will only revert back the gas, but it will not change the state of the contract.
