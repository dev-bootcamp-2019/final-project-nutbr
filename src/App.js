import React from 'react';
import getWeb3 from './utils/getWeb3';
import TraderExchangeContract from '../build/contracts/TraderExchange.json';
import TraderExchangeRegistrationContract from '../build/contracts/TraderExchangeRegistration.json';
import DashboardAdmin from './DashboardAdmin';
import MyTrader from './MyTrader';
import BidAskBrowser from './BidAskBrowser';
import MyPurchases from './MyPurchases';
import Paper from '@material-ui/core/Paper';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SearchIcon from '@material-ui/icons/Search';
import TraderIcon from '@material-ui/icons/AccountBox';
import StorageIcon from '@material-ui/icons/AddToQueue';
import BuildIcon from '@material-ui/icons/Dashboard';

import './css/oswald.css'
import './App.css'


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // to save instances of web3, of the smart contract and the current account
      web3: null,
      contract: null,
      account: null,
      ipfs: null,
      // the list of currencies
      currencies: [],
      // whether the user is the admin or not
      userIsAdmin: false,
      // list of currencies owned by the user
      userOwnsCurrencies: [],
      // list of currencies that user has purchased
      userPurchasedBidAsks: [],
      // the interface tab that is currently open
      activeTab: 0
    };
  }

  componentDidMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        });
        // Instantiate contract once web3 is provided.
        this.init();
      }).catch(() => {
        console.log('Error finding web3.')
      });
  }

  init() {
    // Instantiate the contracts
    const contract = require('truffle-contract');
    const traderExchange = contract(TraderExchangeContract);
    const traderExchangeRegistration = contract(TraderExchangeRegistrationContract);
    traderExchange.setProvider(this.state.web3.currentProvider);
    traderExchangeRegistration.setProvider(this.state.web3.currentProvider);

    // Initialize IPFS interface
    const IPFS = require('ipfs-api');
    const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
    this.setState({ ipfs: ipfs });

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      if (error) {
        console.log('Failed to get accounts. Error: ', error);
        return;
      }
      // Save the current account
      this.setState({ account: accounts[0] });
      // Get registry contract
      traderExchangeRegistration.deployed()
        .then(instance => instance.backendContract.call())
        // Get our main contract from the address stored in the registry
        .then(backendAddress => traderExchange.at(backendAddress))
        // Save the instance of the contract
        .then(instance => this.setState({ contract: instance }))
        .then(() => {
          // Detect when account changes
          setInterval(() => {
            this.state.web3.eth.getAccounts((error, accounts) => {
              if (accounts[0] !== this.state.account) {
                // Update account in the state, update the user rights, flush my purchases
                this.setState({
                  account: accounts[0],
                  userPurchasedBidAsks: []
                }, () => {
                  this.setUserRights();
                  this.initMyPurchases();
                });
              }
            });
          }, 500);
          // Load the list of currencies from the contract
          return this.loadCurrencies();
        }).then(result => {
          // Set the user rights depending on their account
          return this.setUserRights();
        }).then(result => {
          // Update the list every time when an trader is added/updated/removed
          let updateCurrenciesCallback = (error, result) => {
            if (error) {
              console.log(error);
              return;
            }
            // Update the list of currencies and update the rights of the user
            this.loadCurrencies().then(this.setUserRights);
          }
          this.state.contract.LogTraderAdded().watch(updateCurrenciesCallback);
          this.state.contract.LogTraderUpdated().watch(updateCurrenciesCallback);
          this.state.contract.LogTraderRemoved().watch(updateCurrenciesCallback);
          // Update the user rights when the contract changes its owner (very rare case, but still)
          this.state.contract.OwnershipTransferred().watch(this.setUserRights);
          // Fill and update My Purchases
          this.initMyPurchases();
          // Call other callbacks that might be waiting for the contract to get ready
          if (typeof this.onContractReady === 'function') {
            this.onContractReady();
          }
        }).catch(error => {
          console.log(error);
        });
    });
  }

  initMyPurchases() {
    if (this.myPurchasesFilter) {
      this.myPurchasesFilter.stopWatching();
    }
    this.myPurchasesFilter = this.state.contract.LogBidAskPurchased(
      { customer: this.state.account },
      { fromBlock: 0, toBlock: 'latest' }
    ).watch(this.updateBidAsksPurchased);
  }

  setOnContractReady = (callback) => {
    this.onContractReady = () => {
      callback(this.state.web3, this.state.contract);
    }
    if (this.state.web3 !== null && this.state.contract !== null) {
      this.onContractReady();
    }
  };

  /** Figure out the rights of the user and save it to the state */
  setUserRights = () => {
    // Get the owner of the contract
    return this.state.contract.owner.call().then(owner => {
      // Contract owner is admin
      return this.setState({ userIsAdmin: (this.state.account === owner) });
    }).then(() => {
      // If user is an trader owner, find which currencies he owns
      let ownedCurrencies = this.state.currencies.filter((trader, i) => (this.state.account === trader.ccyOwner), this);
      return this.setState({ userOwnsCurrencies: ownedCurrencies });
    });
  };

  /** Get the list of currencies from the contract and save it to the state */
  loadCurrencies = () => {
    // First we get the total number of currencies
    return this.state.contract.getCurrenciesCount.call().then(currenciesCount => {
      // Then we iterate over the array of currencies to load each of them
      let promises = [];
      for (let i = 0; i < currenciesCount; i++) {
        promises.push(
          this.state.contract.currencies.call(i)
        );
      }
      return Promise.all(promises);
    }).then(results => {
      // Now as we have all currencies loaded, we save them to the state
      let currencies = [];
      results.forEach(row => {
        currencies.push({
          ccyId: row[0].toString(),
          ccyName: this.state.web3.toUtf8(row[1]),
          ccyOwner: row[2],
          imgLogo: row[3],
          inProgress: false
        });
      });
      currencies.sort((a, b) => (parseInt(a.ccyId, 10) < parseInt(b.ccyId, 10) ? -1 : 1));
      return this.setState({ currencies: currencies });
    }).catch(error => {
      console.log(error);
    });
  };

  setCurrencies = (currencies) => {
    return this.setState({ currencies: currencies });
  };

  //Loads bidask and trader data from the contract and builds a nice object from it

  getBidAskData = (baId) => {
    return this.state.contract.getBidAskById.call(baId).then(data => {
      let ccyId = Number(data[1]);
      return this.state.contract.getTraderById.call(ccyId).then(result => {
        let trader = {
          ccyId: Number(result[0]),
          ccyName: this.state.web3.toUtf8(result[1]),
          ccyOwner: result[2],
          imgLogo: result[3]
        }
        return {
          baId: Number(data[0]),
          baFrom: this.state.web3.toUtf8(data[2]),
          baTo: this.state.web3.toUtf8(data[3]),
          baPrice: parseInt(data[4].toString(), 10),
          baQuantity: Number(data[5]),
          trader: trader,
        }
      });
    });
  };

  updateBidAsksPurchased = (error, result) => {
    if (error) {
      console.log(error);
      return;
    }
    let purchaseId = Number(result.args.purchaseId);
    // Check for duplicates
    if (this.state.userPurchasedBidAsks.findIndex(x => x.purchaseId === purchaseId) > -1)
      return;
    // Add the bidask to my purchases in the loading state first
    let newPurchase = {
      isLoading: true,
      purchaseId: purchaseId,
      ccyCustomer: {
        firstName: result.args.ccyCustomerFirstName,
        lastName: result.args.ccyCustomerLastName
      }
    }
    this.setState(state => ({
      userPurchasedBidAsks: [...state.userPurchasedBidAsks, newPurchase]
    }));
    return this.getBidAskData(result.args.baId).then(bidask => {
      // Update the bidask with actual data and quit the loading state
      this.setState(state => ({
        userPurchasedBidAsks: state.userPurchasedBidAsks.map(purchased => {
          if (purchased.purchaseId === newPurchase.purchaseId) {
            bidask.purchaseId = newPurchase.purchaseId;
            bidask.ccyCustomer = newPurchase.ccyCustomer;
            bidask.isLoading = false;
            return bidask;
          }
          return purchased;
        })
      }));
    });
  };

  onPurchaseComplete = (txResult) => {
    txResult.logs.forEach(log => {
      if (log.event !== 'LogBidAskPurchased')
        return;
      if (log.args.customer !== this.state.account)
        return;
      this.updateBidAsksPurchased(null, log);
    });
  };

  switchTab = (event, value) => {
    this.setState({ activeTab: value });
  };

  renderMessage = (message) => (
    <div className="App" style={{ textAlign: 'center', marginTop: 100 }}>
      {message}
    </div>
  );

  render() {
    if (!this.state.web3) {
      return this.renderMessage('Waiting for web3...');
    }
    // Make sure the user does not accidentially spend real ETH here
    // Remove this block in production
    if (this.state.web3.version.network === '1') {
      return this.renderMessage('You are connected to Ethereum mainnet! You should switch to a testnet.');
    }
    if (!this.state.account) {
      return this.renderMessage('Make sure you are connected to Metamask, so we can retrieve your account.');
    }
    if (!this.state.contract) {
      return this.renderMessage('Wait a moment while Metamask connects to the contract');
    }
    return (
      <div className="App">
        <Paper square>
          <Tabs
            value={this.state.activeTab}
            onChange={this.switchTab}
            fullWidth
            centered
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<SearchIcon />} label="Search Trading pairs" value={0} />
            <Tab icon={<StorageIcon />} label="My Purchases" value={1} />
            {this.state.userIsAdmin && (
              <Tab icon={<BuildIcon />} label="Dashboard for Admin" value={2} />
            )}
            {this.state.userOwnsCurrencies.length > 0 && (
              <Tab icon={<TraderIcon />} label="My Dashboard (for Contract Owner-Admin)" value={3} />
            )}

          </Tabs>
        </Paper>

        <div className="current-account">
          Account: {this.state.account}
        </div>
        <div className="developer-account">
          Developed by Rui Toledo - rui.toledo@uol.com.br
        </div>


        <main className="container">

          {this.state.activeTab === 0 && (
            <BidAskBrowser
              web3={this.state.web3}
              contract={this.state.contract}
              account={this.state.account}
              navigateToMyPurchases={() => { this.switchTab(null, 1); }}
              getBidAskData={this.getBidAskData}
              onBookingComplete={this.onPurchaseComplete}
            />
          )}
          {this.state.activeTab === 1 && (
            <MyPurchases
              web3={this.state.web3}
              contract={this.state.contract}
              account={this.state.account}
              myBidAsks={this.state.userPurchasedBidAsks}
            />
          )}
          {this.state.activeTab === 3 && this.state.userOwnsCurrencies.length > 0 && (
            <MyTrader
              currencies={this.state.userOwnsCurrencies}
              setOnContractReady={this.setOnContractReady}
              account={this.state.account}
              getBidAskData={this.getBidAskData}
            />
          )}
          {this.state.activeTab === 2 && this.state.userIsAdmin && (
            <DashboardAdmin
              currencies={this.state.currencies}
              setCurrencies={this.setCurrencies}
              web3={this.state.web3}
              contract={this.state.contract}
              account={this.state.account}
              ipfs={this.state.ipfs}
            />
          )}

        </main>
      </div>
    );
  }
}

export default App;
