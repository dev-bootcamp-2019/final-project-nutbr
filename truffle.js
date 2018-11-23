module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: "8545",
      network_id: "*"
    }
  }
};



/**
//Ropsten connection
var HDWalletProvider = require("truffle-hdwallet-provider");
const MNEMONIC = 'champion erupt top hole spawn science ill oval quiz steel swamp trap';

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/6f860d3694984d63a355721e95041804")
      },
      network_id: 3,
      gas: 8000000
    }
  }
};
*/
