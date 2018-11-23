const TraderExchange = artifacts.require("TraderExchange");
const TraderExchangeRegistration = artifacts.require("TraderExchangeRegistration");

// Function to verify that a contract call has failed (reverted) during execution
async function hasReverted(contractCall) {
  try {
    await contractCall;
    return false;
  } catch (e) {
    return /revert/.test(e.message);
  }
}

contract('TraderExchangeRegistration', accounts => {

  const owner = accounts[0];
  const nonOwner = accounts[1];

  let registry, traderExchange, traderExchangeNew;

  // Deploy the contracts
  before(async () => {
    traderExchange = await TraderExchange.new();
    registry = await TraderExchangeRegistration.new(traderExchange.address);
  });

  // Check that contract ownership is set properly
  it('Test 1: Sets the owner', async () => {
    assert.equal(await registry.owner.call(), owner);
  });

  // Check that the main contract address is set correctly
  it('Test 2: Sets contract address', async () => {
    assert.equal(await registry.backendContract.call(), traderExchange.address);
  });

  // Upgrade to new version: create a new main contract and change it
  // in the registry (that's the main purpose of the registry)
  it('Test 3: Upgrade registry to the new contract', async () => {
    traderExchangeNew = await TraderExchange.new();
    await registry.changeBackend(traderExchangeNew.address, { from: owner });
    assert.equal(await registry.backendContract.call(), traderExchangeNew.address);
  });

  // Check that the previous main contract address is saved for reference
  it('Test 4: Saves previous contract', async () => {
    assert.equal(await registry.previousBackends.call(0), traderExchange.address);
  });

  // Check that only the owner can do such an upgrade
  it('Test 5: Does not allow a non-owner to upgrade the registry', async () => {
    let traderExchangeV3 = await TraderExchange.new();
    assert.ok(await hasReverted(
      registry.changeBackend(traderExchangeV3.address, { from: nonOwner })
    ));
  });

});
