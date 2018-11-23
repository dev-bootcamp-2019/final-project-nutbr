#Design Pattern Requirements:
○  	Implement a circuit breaker (emergency stop) pattern
○  	What other design patterns have you used / not used?
■  	Why did you choose the patterns that you did?
■  	Why not others?


# Emergency Stop (there is a test for it)
There is a button on the admin dashboard which can pause/resume the contract. It was implemented by `.pause()` and `.unpause()` functions of the `TraderExchange` contract. Only the contract admin/owner can call it. If the contract is paused (red button), no one can add/edit/remove currencies/exchanges nor buy any currency, because the Metamask will not allow the transaction to occur. If resumed/unpaused, it reverts to normal mode again.

# Access resttrict (there is a test for it)
The following modifiers:
- `onlyOwner`
- `onlyTraderOwner`
- `onlyBidAskOwner`
implement access restriction making sure that only allowed users/contracts can change the relevant data.

# Mortal (there is a test for it)
`.destroy()` and `.destroyAndSend(recipient)` can be called to destroy `TraderExchange`.

# Upgrad (there is a test for it)
It is implemented by the registry contract `TraderExchangeRegistration`.

# Require()
Many functions use `require()` in the beginning, which means that if anything is wrong with the input data it does not go further and also brings error messages on some cases.


In sum, this patters can make the transactions safer and that is a reason why they were chosen.
