const TraderExchange = artifacts.require("TraderExchange");

// Function to verify that a contract call has failed (reverted) during execution
async function hasReverted(contractCall) {
  try {
    await contractCall;
    return false;
  } catch (e) {
    return /revert/.test(e.message);
  }
}

// Timestamps to the contract
function toUTCTimestamp(datestr) {
  return Date.parse(datestr + '+00:00') / 1000;
}

// Sample trader logo that we'll use in the tests
const aLogoHash = 'QmSGwhJNAqoDmtZXXtaE57Hs95Ys149q8cuhKbSqV1NSEc';

contract('TraderExchange', accounts => {
  let traderExchange;

  // Deploy the contract
  before(async () => {
    traderExchange = await TraderExchange.new();
  });

  // Check that contract ownership is set properly
  it('Test 1: Sets the owner of the contract', async () => {
    assert.equal(await traderExchange.owner.call(), accounts[0]);
  });

  // Check that only the owner can add an exchange
  it('Test 2: Does not allow to add an exchange from a non-owner', async () => {
    assert.ok(await hasReverted(
      traderExchange.addTrader('Test Trader', accounts[2], aLogoHash, { from: accounts[1] })
    ));
  });

  // Check that an exchange is added when the owner is doing it
  it('Test 3: Ownner adds new exchange', async () => {
    await traderExchange.addTrader('Test Trader', accounts[2], aLogoHash, { from: accounts[0] });
    assert.equal(await traderExchange.getCurrenciesCount.call(), 1);
  });

  // Check that the exchange name is now taken
  it('Test 4: Confirms if exchange exists', async () => {
    let exists = await traderExchange.traderExists.call('Test Trader');
    assert.ok(exists);
  });

  // Check that it's not possible to add an exchange with a non-unique name
  it('Test 5: Does not allow to add an exchange when the name is taken', async () => {
    assert.ok(await hasReverted(
      traderExchange.addTrader('Test Trader', accounts[2], aLogoHash, { from: accounts[0] })
    ));
  });

  // Check that all exchange details are saved correctly
  it('Test 6: Exchange data stored', async () => {
    let [ccyId, ccyName, ccyOwner, imgLogo] = await traderExchange.currencies.call(0);
    ccyName = web3.toUtf8(ccyName);
    assert.equal(ccyId, 1);
    assert.equal(ccyName, 'Test Trader');
    assert.equal(ccyOwner, accounts[2]);
    assert.equal(imgLogo, aLogoHash);
  });

  // Check that an exchange can be edited and new details are saved correctly
  it('Test 7: Edit exchange', async () => {
    let aNewLogoHash = 'QmSGwhJNAqoDmtZXXtaE57Hs95Ys149q8cuhKbSqV1NSEc';
    await traderExchange.editTrader(1, 'New Exchange Name', accounts[3], aNewLogoHash, { from: accounts[0] });
    let [ccyId, ccyName, ccyOwner, imgLogo] = await traderExchange.currencies.call(0);
    ccyName = web3.toUtf8(ccyName);
    assert.equal(ccyId, 1);
    assert.equal(ccyName, 'New Exchange Name');
    assert.equal(ccyOwner, accounts[3]);
    assert.equal(imgLogo, aNewLogoHash);
  });

  // Check that name uniqueness validation works with editing as well
  it('Test 8: Does not allow to edit an exchange when the new name is taken', async () => {
    await traderExchange.addTrader('Second Trader', accounts[4], aLogoHash, { from: accounts[0] });
    assert.ok(await hasReverted(
      traderExchange.editTrader(1, 'Second Trader', accounts[3], aLogoHash, { from: accounts[0] })
    ));
  });

  // Check that exchange is removed correctly
  it('Test 9: Remove exchange', async () => {
    let count = await traderExchange.getCurrenciesCount.call();
    await traderExchange.removeTrader(1, { from: accounts[0] });
    let newCount = await traderExchange.getCurrenciesCount.call();
    assert.equal(newCount, count - 1);
    let exists = await traderExchange.traderExists('New Exchange Name');
    assert.ok(!exists);
  });

  // Check that emergency stop button works
  it('Test 10: Emergency stops the contract', async () => {
    await traderExchange.pause();
    assert.ok(await hasReverted(
      traderExchange.addTrader('New Test Trader', accounts[2], aLogoHash, { from: accounts[0] })
    ));
  });

  // Check that the stopped contract can be resumed
  it('Test 11: Resume paused contract', async () => {
    await traderExchange.unpause();
    await traderExchange.addTrader('New Test Trader', accounts[2], aLogoHash, { from: accounts[0] });
    assert.ok(await traderExchange.traderExists('New Test Trader'));
  });

  // Check that the contract can be destroyed
  it('Test 12: Kill contract', async () => {
    await traderExchange.destroy();
    try {
      await traderExchange.owner.call();
    } catch (e) {
      return;
    }
    assert.fail();
  });

});
