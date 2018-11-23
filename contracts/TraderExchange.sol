pragma solidity ^0.4.24;

import "../installed_contracts/zeppelin/contracts/math/SafeMath.sol";
import "../installed_contracts/zeppelin/contracts/lifecycle/Pausable.sol";
import "../installed_contracts/zeppelin/contracts/lifecycle/Destructible.sol";


  // Trader Exchange by Rui Toledo rui.toledo@uol.com.br

contract TraderExchange is Pausable, Destructible {

  using SafeMath for uint256;

  struct Trader {
    // Unique autoincremented ID
    uint256 ccyId;
    // Unique trader name
    bytes32 ccyName;
    // Ethereum address of the owner who will manage this trader
    address ccyOwner;
    // IPFS hash of the trader logo image
    string imgLogo;
  }

  struct BidAsk {
    // Unique autoincremented ID
    uint256 baId;
    // ID of the exchange
    uint256 ccyId;
    // From and To, currencies traded
    bytes32 baFrom;
    bytes32 baTo;
    // BidAsk price in wei
    uint256 baPrice;
    // Number of multiples contracts available
    uint256 baQuantity;
  }

  // Auxiliary entity to keep a reference to a particular entry in an array
  struct ArrayIndex {
    bool exists;
    uint256 index;
  }

  // Storage of currencies
  Trader[] public currencies;  // The list of currencies
  uint256 public aIdLast;  // Last trader ID generated, used for autoincrementing
  mapping(uint256 => ArrayIndex) private traderIdIndex;  // Index to find Trader by its ID
  mapping(bytes32 => bool) private traderNameExists;  // To keep track of which trader names are taken

  // Storage of bidasks
  BidAsk[] public bidasks;  // The list of bidasks
  uint256 public tIdLast;  // Last bidask ID generated, used for autoincrementing
  mapping(uint256 => ArrayIndex) private bidaskIdIndex;  // Index to find BidAsk by its ID
  mapping(uint256 => uint256[]) private bidasksByTrader;  // To find list of BidAsk IDs by their Trader ID
  // The following is a two-dimensional index to find a certain entry in an array bidasksByTrader[ccyId]
  mapping(uint256 => mapping(uint256 => ArrayIndex)) private bidasksByTraderIndex;

  uint256 public purchaseIdLast;

  // When a trader in the list is added, changed or deleted
  event LogTraderAdded(uint256 indexed ccyId, bytes32 indexed ccyName, address ccyOwner, string imgLogo);
  event LogTraderUpdated(uint256 indexed ccyId, bytes32 newAName, address newAOwner, string newALogo);
  event LogTraderRemoved(uint256 indexed ccyId);
  // When a bidask is added, changed or deleted
  event LogBidAskAdded(
    uint256 indexed baId,
    uint256 ccyId,
    bytes32 baFrom,
    bytes32 baTo,
    uint256 baPrice,
    uint256 baQuantity
  );
  event LogBidAskUpdated(uint256 indexed baId, uint256 newBAPrice, uint256 newBAQuantity);
  event LogBidAskRemoved(uint256 indexed baId);
  // When a bidask is bought
  event LogBidAskPurchased(
    uint256 indexed purchaseId,
    address indexed customer,
    uint256 indexed ccyId,
    uint256 baId,
    string ccyCustomerFirstName,
    string ccyCustomerLastName
  );

  //Make sure the caller is the owner of the trader
  modifier onlyTraderOwner(uint256 _ccyID) {
    require(traderIdIndex[_ccyID].exists, "Trader does not exist");
    require(currencies[traderIdIndex[_ccyID].index].ccyOwner == msg.sender, "Not the trader owner");
    _;
  }

  //Make sure the caller is the owner of the bidask
  modifier onlyBidAskOwner(uint256 _baId) {
    // find the bidask
    require(bidaskIdIndex[_baId].exists, "Traded pair does not exist");
    BidAsk storage bidask = bidasks[bidaskIdIndex[_baId].index];
    // find the trader
    require(traderIdIndex[bidask.ccyId].exists, "Exchange does not exist anymore");
    Trader storage trader = currencies[traderIdIndex[bidask.ccyId].index];
    // make sure the caller is the owner of the trader the bidask belongs to
    require(trader.ccyOwner == msg.sender, "Not the currency pair owner");
    _;
  }

  // Do not accept payments without booking a specific trader
  function () public payable {
    revert("Plain payments not accepted");
  }

  //Book a trade
  function bookTrader(uint256[2] _baIds, string _firstName, string _lastName)
    public
    payable
    whenNotPaused
  {
    // Find the first bidask, it is required
    require(bidaskIdIndex[_baIds[0]].exists, "Pair does not exist");
    BidAsk storage bidask1 = bidasks[bidaskIdIndex[_baIds[0]].index];
    // Find the trader that owns it
    require(traderIdIndex[bidask1.ccyId].exists, "Exchange does not exist");
    Trader storage trader1 = currencies[traderIdIndex[bidask1.ccyId].index];
    // Check the pairs quantity available
    require(bidask1.baQuantity > 0, "No pairs quantity available");
    // Check if there's enough ETH for the first bidask
    require(msg.value >= bidask1.baPrice, "Insufficient funds");
    uint256 ethLeft = msg.value - bidask1.baPrice;
    if (_baIds[1] != 0) {
      // Find the second bidask
      require(bidaskIdIndex[_baIds[1]].exists, "Pair does not exist");
      BidAsk storage bidask2 = bidasks[bidaskIdIndex[_baIds[1]].index];
      // Check if there's enough ETH for the second bidask too
      require(ethLeft >= bidask2.baPrice, "Insufficient funds");
      ethLeft -= bidask2.baPrice;
      // Check the pair available
      require(bidask2.baQuantity > 0, "No pairs quantity available");
      // Find the second bidask's trader
      require(traderIdIndex[bidask2.ccyId].exists, "Exchange does not exist");
      Trader storage trader2 = currencies[traderIdIndex[bidask2.ccyId].index];
      // Reduce the number of quantities available
      bidask1.baQuantity--;
      bidask2.baQuantity--;
      // Save information about the purchase
      uint256 purchaseId1 = purchaseIdLast.add(1);
      purchaseIdLast = purchaseId1;
      emit LogBidAskPurchased(purchaseId1, msg.sender, trader1.ccyId, bidask1.baId, _firstName, _lastName);
      uint256 purchaseId2 = purchaseIdLast.add(1);
      purchaseIdLast = purchaseId2;
      emit LogBidAskPurchased(purchaseId2, msg.sender, trader2.ccyId, bidask2.baId, _firstName, _lastName);
      // Send the money to the trader owners
      trader1.ccyOwner.transfer(bidask1.baPrice);
      trader2.ccyOwner.transfer(bidask2.baPrice);
    } else {
      // There is only one bidask to buy
      // Reduce the number of quantities available
      bidask1.baQuantity--;
      // Save information about the purchase
      uint256 purchaseId = purchaseIdLast.add(1);
      purchaseIdLast = purchaseId;
      emit LogBidAskPurchased(purchaseId, msg.sender, trader1.ccyId, bidask1.baId, _firstName, _lastName);
      // Send the money to the trader owners
      trader1.ccyOwner.transfer(bidask1.baPrice);
    }
    // Send back the change if there is anything left
    if (ethLeft > 0) {
      msg.sender.transfer(ethLeft);
    }
  }

  // check if trader exists
  function traderExists(bytes32 _aName) public view returns (bool) {
    return traderNameExists[_aName];
  }

  //The number of currencies
  function getCurrenciesCount() public view returns (uint256) {
    return currencies.length;
  }

  // Exchange data
  function getTraderById(uint256 _ccyID) public view returns(
    uint256 ccyId,
    bytes32 ccyName,
    address ccyOwner,
    string imgLogo
  ) {
    require(traderIdIndex[_ccyID].exists, "Exchenge does not exist");
    Trader storage trader = currencies[traderIdIndex[_ccyID].index];
    return (trader.ccyId, trader.ccyName, trader.ccyOwner, trader.imgLogo);
  }

  //number of bidasks from a given exchange
  function getBidAsksCount(uint256 _ccyID) public view returns (uint256) {
    require(traderIdIndex[_ccyID].exists, "Exchange does not exist");
    return bidasksByTrader[_ccyID].length;
  }

  //bidask by its ID
   function getBidAskById(uint256 _baId)
    public
    view
    returns(
      uint256 baId,
      uint256 ccyId,
      bytes32 baFrom,
      bytes32 baTo,
      uint256 baPrice,
      uint256 baQuantity
    )
  {
    require(bidaskIdIndex[_baId].exists, "Pair does not exist");
    BidAsk storage bidask = bidasks[bidaskIdIndex[_baId].index];
    return (
      bidask.baId,
      bidask.ccyId,
      bidask.baFrom,
      bidask.baTo,
      bidask.baPrice,
      bidask.baQuantity
    );
  }

  // bidask of a given trader
  function getBidAskByTrader(uint256 _ccyID, uint256 _index)
    public
    view
    returns (
      uint256 baId,
      uint256 ccyId,
      bytes32 baFrom,
      bytes32 baTo,
      uint256 baPrice,
      uint256 baQuantity
    )
  {
    uint256 _baId = bidasksByTrader[_ccyID][_index];
    return getBidAskById(_baId);
  }

  //Just trades direct. E.g.: Not USD->CAD and CAD->EUR. SHould be USD-EUR
  function findDirectTraders(bytes32 _from, bytes32 _to)
    public
    view
    returns (uint256[20])
  {
    uint256[20] memory bidasksFound;
    uint256 i = 0;
    for (uint256 j = 0; j < bidasks.length; j++) {
      BidAsk storage t = bidasks[j];
      if (
        t.baFrom == _from &&
        t.baTo == _to
      ) {
        bidasksFound[i++] = t.baId;
        // When the resulting array is full, stop searching
        if (i == bidasksFound.length || i==0) {
          break;
        }
      }
    }
    return bidasksFound;
  }

  //Add a trader to the list
  function addTrader(bytes32 _aName, address _aOwner, string _aLogo) public onlyOwner whenNotPaused {
    require(!traderExists(_aName), "Trader name already exists");
    // generate new trader ID
    uint256 _ccyID = aIdLast.add(1);
    aIdLast = _ccyID;
    // add a new Trader record to currencies array and save its index in the array
    uint256 _index = currencies.push(Trader(_ccyID, _aName, _aOwner, _aLogo)) - 1;
    traderIdIndex[_ccyID].exists = true;
    traderIdIndex[_ccyID].index = _index;
    // occupy the name
    traderNameExists[_aName] = true;
    emit LogTraderAdded(_ccyID, _aName, _aOwner, _aLogo);
  }

  //Change an existing trader
  function editTrader(uint256 _ccyID, bytes32 _newAName, address _newAOwner, string _newALogo)
    public
    onlyOwner
    whenNotPaused
  {
    require(traderIdIndex[_ccyID].exists, "Exchange does not exist");
    // get index of the array element being changed
    uint256 _index = traderIdIndex[_ccyID].index;
    // if the name has changed, check it's unique and save it
    if (_newAName != currencies[_index].ccyName) {
      require(!traderExists(_newAName), "New exchange name already exists");
      // free the old name, occupy the new one
      traderNameExists[currencies[_index].ccyName] = false;
      traderNameExists[_newAName] = true;
      currencies[_index].ccyName = _newAName;
    }
    // simply update the owner and the logo
    currencies[_index].ccyOwner = _newAOwner;
    currencies[_index].imgLogo = _newALogo;
    emit LogTraderUpdated(_ccyID, _newAName, _newAOwner, _newALogo);
  }

  //Remove a trader from the list
  function removeTrader(uint256 _ccyID) public onlyOwner whenNotPaused {
    require(traderIdIndex[_ccyID].exists, "Trader does not exist");
    uint256 _index = traderIdIndex[_ccyID].index;
    traderIdIndex[_ccyID].exists = false;
    traderNameExists[currencies[_index].ccyName] = false;
    if (currencies.length > 1) {
      currencies[_index] = currencies[currencies.length-1];
      traderIdIndex[currencies[_index].ccyId].index = _index;
    }
    currencies.length--;
    emit LogTraderRemoved(_ccyID);
  }

  //Add an bidask to the list
  function addBidAsk(
    uint256 _ccyID,
    bytes32 _tFrom,
    bytes32 _tTo,
    uint256 _tPrice,
    uint256 _baQuantity

  ) public onlyTraderOwner(_ccyID) whenNotPaused {
    // make sure origin & destination times are valid
    require(_baQuantity > 0, "Quantity must be positive");
    // generate new bidask ID
    uint256 _baId = tIdLast.add(1);
    tIdLast = _baId;
    // add a new BidAsk record to bidasks array and save its index in the array
    BidAsk memory bidask = BidAsk(
      _baId,
      _ccyID,
      _tFrom,
      _tTo,
      _tPrice,
      _baQuantity
    );
    uint256 _index = bidasks.push(bidask) - 1;
    bidaskIdIndex[_baId].exists = true;
    bidaskIdIndex[_baId].index = _index;
    // add the bidask ID to the list of this trader's bidasks
    uint256 _index2 = bidasksByTrader[_ccyID].push(_baId) - 1;
    // and save the index of this entry too, to be able to manage it later
    bidasksByTraderIndex[_ccyID][_baId].exists = true;
    bidasksByTraderIndex[_ccyID][_baId].index = _index2;
    emit LogBidAskAdded(
      _baId,
      _ccyID,
      _tFrom,
      _tTo,
      _tPrice,
      _baQuantity
    );
  }

  //Change an existing pair
  function editBidAsk(uint256 _baId, uint256 _newBAPrice, uint256 _newBAQuantity)
    public
    onlyBidAskOwner(_baId)
    whenNotPaused
  {
    // update the pair data
    uint256 _index = bidaskIdIndex[_baId].index;
    bidasks[_index].baPrice = _newBAPrice;
    bidasks[_index].baQuantity = _newBAQuantity;
    emit LogBidAskUpdated(_baId, _newBAPrice, _newBAQuantity);
  }

  //Remove a pair from the list
  function removeBidAsk(uint256 _baId) public onlyBidAskOwner(_baId) whenNotPaused {
    uint256 _ccyID = bidasks[_index].ccyId;
    bidaskIdIndex[_baId].exists = false;
    if (bidasks.length > 1) {
      uint256 _index = bidaskIdIndex[_baId].index;
      bidasks[_index] = bidasks[bidasks.length-1];
      bidaskIdIndex[bidasks[_index].baId].index = _index;
    }
    bidasksByTraderIndex[_ccyID][_baId].exists = false;
    if (bidasksByTrader[_ccyID].length > 1) {
      uint256 _index2 = bidasksByTraderIndex[_ccyID][_baId].index;
      bidasksByTrader[_ccyID][_index2] = bidasksByTrader[_ccyID][bidasksByTrader[_ccyID].length-1];
      uint256 movedBidAskId = bidasksByTrader[_ccyID][_index2];
      bidasksByTraderIndex[_ccyID][movedBidAskId].index = _index2;
    }
    bidasksByTrader[_ccyID].length--;
    bidasks.length--;
    emit LogBidAskRemoved(_baId);
  }

}
