const Web3 = require('web3');
const contract = require('truffle-contract');
const contractData = require('../build/contracts/TraderExchange.json');
const sampleData = require('../sample-data.json');

const ethRPC = "http://localhost:8545";
const aLogoDefault = 'QmSGwhJNAqoDmtZXXtaE57Hs95Ys149q8cuhKbSqV1NSEc';

var web3 = new Web3(new Web3.providers.HttpProvider(ethRPC));
const TraderExchange = contract(contractData);
TraderExchange.setProvider(web3.currentProvider);

web3.eth.getAccounts((error, accounts) => {
  if (error) {
    console.error('Failed to get accounts. ', error);
    return;
  }
  TraderExchange.deployed().then(async instance => {
    // we're all set, let's stuff the contract with some sample data now
    await populate(instance, accounts);
  }).catch(error => {
    console.error(error);
  });
});

async function populate(traderExchange, accounts) {
  try {
    // check if we have the owner's account
    if (await traderExchange.owner.call() !== accounts[0]) {
      return console.log('Deploy the contract from the first account provided by ', ethRPC);
    }
    for (let i = 0; i < sampleData.data.length; i++) {
      let row = sampleData.data[i];
      // admin will own the first trader, the second account owns second and third currencies,
      // the rest are owned by the third account
      let ccyOwner = i <= 2 ? (i === 0 ? accounts[0] : accounts[1]) : accounts[2];
      console.log('Adding trader: ' + row.trader.ccyName + ' owned by ' + ccyOwner + '...');
      await traderExchange.addTrader(
        row.trader.ccyName,
        ccyOwner,
        row.trader.imgLogo ? row.trader.imgLogo : aLogoDefault,
        { from: accounts[0], gas: 300000 }
      );
      let ccyId = Number(await traderExchange.aIdLast.call());
      for (let j = 0; j < row.bidasks.length; j++) {
        let bidask = row.bidasks[j];
        console.log(
          'Adding bidask: '+bidask.baOrigin+' ' + bidask.baFrom + ' -> ' + bidask.baTo + ', '
          + bidask.baPrice + ' ETH, ' + bidask.baQuantity + ' contracts...'
        );
        let origin = Date.parse(bidask.baOrigin+'+00:00')/1000;
        let destination = Date.parse(bidask.baDest+'+00:00')/1000;
        await traderExchange.addBidAsk(
          ccyId, bidask.baFrom, bidask.baTo,
          web3.toWei(bidask.baPrice, 'ether'), bidask.baQuantity,
          origin, destination,
          { from: ccyOwner, gas: 500000 }
        );
      }
      let count = await traderExchange.getBidAsksCount.call(ccyId);
      console.log(row.trader.ccyName + ' now has ' + count + ' bidasks.');
    }
  } catch (e) {
    if (/revert/.test(e.message)) {
      console.error('Transaction reverted. Contract data not empty?');
    } else {
      console.error('Failed to populate the contract with data. ', e.message);
    }
  }
}
