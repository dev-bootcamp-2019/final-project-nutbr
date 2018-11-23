# Currency Exchange
I developed a sample application for trading currencies via smart contracts, including the management of adding/removing/editing exchanges and manage the orders executed.
A quick video demonstrating some functionalities was added to Youtube on:
https://youtu.be/dQSpdMt3dqE

Based on the final project requirements below, see the answers in red for a checklist of required items:

Requirements
●  	User Interface Requirements:
○  	Run the app on a dev server locally for testing/grading
#    - Sample file `sample-data.json` must be run after compile/migrate with command `npm run fill`
○  	You should be able to visit a URL and interact with the application
#    - http://localhost:3000/
■  	App recognizes current account
#    - 3 types of account: contract owner, exchange owner and user accounts
■  	Sign transactions using MetaMask / uPort
#    - Using just Metamask
■  	Contract state is updated
#    - Yes
■  	Update reflected in UI
#    - Yes

●  	Test Requirements:
○  	Write 5 tests for each contract you wrote
#    - 12 tests for contract `TraderExchange` and 5 tests for `TraderExchangeRegistration`
■  	Solidity or JavaScript
○  	Explain why you wrote those tests
#    - see file `design_patter_decision.md`
○  	Tests run with truffle test
#    - All of them passed after running `truffle test`

●  	Design Pattern Requirements:
○  	Implement a circuit breaker (emergency stop) pattern
#    - On 'Dashboard for admin' there is a red button with this functionality
○  	What other design patterns have you used / not used?
#    - see file `design_patter_decision.md`
■  	Why did you choose the patterns that you did?
#    - see file `design_patter_decision.md`
■  	Why not others?
#    - see file `design_patter_decision.md`

●  	Security Tools / Common Attacks:
○  	Explain what measures you’ve taken to ensure that your contracts are not susceptible to common attacks
#    - see file `avoiding_common_attacks.md`
●  	Use a library or extend a contract
○  	Via EthPM or write your own
#    - Zeppelin was used


●    Deploy your application onto one of the test networks. Include a document called deployed_addresses.txt that describes where your contracts live (which testnet and address).
○  	Students can verify their source code using etherscan for the appropriate testnet https://etherscan.io/verifyContract
#    - https://ropsten.etherscan.io/address/0x7730fc9b06ccb7b93e7934506bdf23344d7e1a45
○  	Evaluators can check by getting the provided contract ABI and calling a function on the deployed contract at https://www.myetherwallet.com/#contracts or checking the verification on etherscan
#      - Contract was deployed on Ropsten test network and all the addresses are on the `deployed_addresses.txt`


    ●  	Stretch requirements (for bonus points, not required):

    Implement an upgradable design pattern
    Write a smart contract in LLL or Vyper
#    - One contract wrote in Vyper `TraderExchangeRegistration.vy`

    ○  	Integrate with an additional service, maybe even one we did not cover in this class
    For example:
    ■      IPFS
    Users can dynamically upload documents to IPFS that are referenced via their smart contract
    ■      uPort
    ■      Ethereum Name Service
    A name registered on the ENS resolves to the contract, verifiable on rinkeby.etherscan.io/contract_name
    ■      Oracle
#    - Integrated with IPFS, for uploading the logo and Infura.



# Pre-requisites and programs used versions:
- Truffle v4.1.14 (core: 4.1.14)
- Solidity v0.4.24 (solc-js)
- Metamask 5.0.2
- NodeJS: 10.13.0
- npm: 6.4.1
- Ganache CLI v6.1.8 (ganache-core: 2.2.1) or ganache UI 1.2.2
- IPFS:  0.4.18


# Installing/Running (after installing/configuring the pre-requisites):
1. Clone the repository
git clone https://github.com/nutbr/currencyExchange.git
2. Go to directory
`cd currencyExchange`
3. Install npm:
`npm install`
4. Run Ganache:
If you are running `ganache-cli` or the UI, you need to make sure it is listening at `127.0.0.1:8545`; copy the MNEMONIC seed to Metamask and connect Metamask as private network on the port listed above.
5. Compile the contracts:
`truffle compile`
6. Deploy the contracts to the network:
`truffle migrate --reset`
7. For the purpose of the final project you need to fill the application with data from `sample-data.json`, so it is easy to play with the contract and you can change data there for initial data fill.
`npm run fill`
8. Run the browser
`npm run start`. However if you want to build the project, run `npm run build`.
If you find any problems or delay on initializing, please verify if ganache is really connected to Metamask and running. One reported bug on Metamask is that sometimes it does not synchronize properly.
If you want to run on Ropsten network, please comment the actual code and uncomment the network connections on file `truffle.js`.
9. Using the browser:
There are basically 4 tabs.

# Search Trading Pairs - available to everyone
- Type from/to which currency you want to trade and search
- After sucessful search, 'Book' the currencies you want to trade for and a new window will pop up
- Fill first and last name to buy, after approving on Metamask

# My Purchases - available to everyone
 - Check which transactions you've done

# My Dashboard - for contract owner admin - available for contract owner AND exchange owners
- All above +
- Exchange owner can select which of his exchanges he wants to manage, in case he has more than 1
- See traded pairs that were negotiated
- Add/manage/edit pairs to Trade
- Manage quantity of remaining contracts


# Dashboard for admin - only avalable for contract owner
- All above +
- Pause/Resume the contracts
- Add/remove/edit exchange name/contract/logo



# Structure of program
`TraderExchange` is the main contract, coded in Solidity. It uses `SafeMath` library and `Pausable`/`Destructible` from Zeppelin EthPM package.
`TraderExchangeRegistration` contract, coded in Vyper.


# Tests:
- emergency stop
- searching for currencies
- input data validation
- verification of the data stored
- ownership of the contract and management (add/remove/edit exchanges)
- trading currencies
Must run `truffle test` on the directory folder


# Author
Rui Toledo - https://github.com/nutbr  - rui.toledo@uol.com.br - https://youtu.be/dQSpdMt3dqE
