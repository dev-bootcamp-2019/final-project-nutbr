var SafeMath = artifacts.require('SafeMath');
var TraderExchange = artifacts.require("TraderExchange");
var TraderExchangeRegistration = artifacts.require("TraderExchangeRegistration");

module.exports = function (deployer) {
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, TraderExchange);
  deployer.deploy(TraderExchange)
    .then(() => TraderExchange.deployed())
    .then(traderExchange => deployer.deploy(TraderExchangeRegistration, traderExchange.address));
};
