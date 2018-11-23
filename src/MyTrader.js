import React from 'react';
import BidAskForm from "./BidAskForm";
import EditableTable from "./EditableTable";
import SoldBidAsks from './SoldBidAsks';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';


const ipfsGatewayPrefix = 'https://ipfs.io/ipfs/';

class MyTrader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      contract: null,
      // the index of the row that's being edited right now, -1 means none are edited
      editBidAskIdx: -1,
      // errors to display during the edit mode
      editBidAskErrors: {},
      // saved version of an trader before editing, to restore the values on cancel
      bidaskBeforeEditing: null,
      // current trader whose bidasks are being managed
      traderIdx: 0,
      // list of bidasks the current trader has
      bidasks: [],
      // list of bidasks sold already
      soldBidAsks: []
    };
  }

  componentDidMount() {
    this.props.setOnContractReady((web3, contract) => {
      this.setState({
        web3: web3,
        contract: contract
      }, () => {
        // Load the list of bidasks from the contract
        this.loadBidAsks().then(result => {
          // Update the list every time when a bidask is added/updated/removed
          let updateBidAsksCallback = (error, result) => {
            if (error) {
              console.log(error);
              return;
            }
            // Update the list of bidasks
            this.loadBidAsks();
          }
          this.state.contract.LogBidAskAdded().watch(updateBidAsksCallback);
          this.state.contract.LogBidAskUpdated().watch(updateBidAsksCallback);
          this.state.contract.LogBidAskRemoved().watch(updateBidAsksCallback);
          // Fill and update Sold BidAsks
          this.initSoldBidAsks();
        }).catch(error => {
          console.log(error);
        });
      });
    });
  }

  initSoldBidAsks() {
    if (this.soldBidAsksFilter) {
      this.soldBidAsksFilter.stopWatching();
    }
    this.soldBidAsksFilter = this.state.contract.LogBidAskPurchased(
      { ccyId: this.props.currencies[this.state.traderIdx].ccyId },
      { fromBlock: 0, toBlock: 'latest' }
    ).watch(this.updateBidAsksSold);
  }

  /** Get the list of bidasks from the contract and save it to the state */
  loadBidAsks = () => {
    // First we get the total number of bidasks that the trader has
    const ccyId = this.props.currencies[this.state.traderIdx].ccyId;
    return this.state.contract.getBidAsksCount.call(ccyId).then(bidasksCount => {
      // Then we iterate over the array of bidasks to load each of them
      let promises = [];
      for (let i = 0; i < bidasksCount; i++) {
        promises.push(
          this.state.contract.getBidAskByTrader.call(ccyId, i)
        );
      }
      return Promise.all(promises);
    }).then(results => {
      // Now as we have all our bidasks loaded, we save them to the state
      let bidasks = [];
      results.forEach(row => {
        bidasks.push({
          baId: row[0].toString(),
          ccyId: row[1].toString(),
          baFrom: this.state.web3.toUtf8(row[2]),
          baTo: this.state.web3.toUtf8(row[3]),
          baPrice: this.state.web3.fromWei(row[4], 'ether').toFixed(),
          baQuantity: row[5].toString(),
          inProgress: false
        });
      });
      bidasks.sort((a, b) => (parseInt(a.baId, 10) < parseInt(b.baId, 10) ? -1 : 1));
      return this.setState({ bidasks: bidasks });
    }).catch(error => {
      console.log(error);
    });
  }

  /** When user chooses one of the currencies he owns */
  selectTrader = (e) => {
    this.setState({
      traderIdx: e.target.value,
      soldBidAsks: []
    }, () => {
      this.loadBidAsks();
      this.initSoldBidAsks();
    });
  }

  //Validate the input before a bidask is added.

  bidaskValidateSubmit = (bidask) => {
    let errors = {};
    if (bidask.baFrom.length === 0) {
      errors.tFromError = 'Your Currency is required';
    }
    if (bidask.baTo.length === 0) {
      errors.tToError = 'Another Currency different from yours is required';
    }
    if (isNaN(bidask.baPrice) || bidask.baPrice < 0) {
      errors.tPriceError = 'Price must be a non-negative number';
    }
    if (isNaN(bidask.baQuantity) || bidask.baQuantity < 1) {
      errors.baQuantityError = 'Quantity must be positive number';
    }
    return errors;
  }

  //Validate the input before a pair is changed.

  bidaskValidateEdit = (bidask) => {
    let errors = {};
    if (bidask.baPrice < 0) {
      errors.tPriceError = 'Price must not be negative';
    }
    if (bidask.baQuantity < 0) {
      errors.baQuantityError = 'Quantity must not be negative';
    }
    return errors;
  }

  /** Add a new bidask to the contract and update the state to display the change */
  bidaskSubmit = (bidask) => {
    const ccyId = this.props.currencies[this.state.traderIdx].ccyId;
    // Add the bidask to the contract
    const priceWei = this.state.web3.toWei(bidask.baPrice, 'ether');
    this.state.contract.addBidAsk(
      ccyId,
      this.state.web3.toHex(bidask.baFrom),
      this.state.web3.toHex(bidask.baTo),
      priceWei,
      bidask.baQuantity,
      { from: this.props.account }
    ).then(() => {
      // Add the new bidask to the list, but grayed out (inProgress: true)
      // It will update to normal automatically when the transaction completes
      this.setState(state => ({
        bidasks: [...state.bidasks, {
          baId: null,
          baFrom: bidask.baFrom,
          baTo: bidask.baTo,
          baPrice: bidask.baPrice,
          baQuantity: bidask.baQuantity,
          inProgress: true
        }]
      }));
    }).catch(error => {
      console.log(error);
    });
  }

  /** Remove a bidask from the contract and update the state to display the change */
  bidaskRemove = (i) => {
    // Remove the bidask from the contract
    this.state.contract.removeBidAsk(
      this.state.bidasks[i].baId,
      { from: this.props.account, gas: 80000 }
    ).then(() => {
      this.setState(state => ({
        bidasks: state.bidasks.map((bidask, j) => {
          if (j === i) {
            bidask.inProgress = true;
          }
          return bidask;
        })
      }));
    }).catch(error => {
      console.log(error);
    });
  }

  //Enable edit mode

  startEditing = (i) => {
    if (this.state.editBidAskIdx === -1) {
      this.setState(state => ({
        editBidAskIdx: i,
        bidaskBeforeEditing: state.bidasks[i]
      }));
    }
  }

  /** Finish editing, save the changes to the contract and update the table */
  finishEditing = () => {
    let bidaskEdited = this.state.bidasks[this.state.editBidAskIdx];
    bidaskEdited.baPrice = parseFloat(bidaskEdited.baPrice);
    bidaskEdited.baQuantity = parseInt(bidaskEdited.baQuantity, 10);
    // Clear the old errors first
    this.setState({
      editBidAskErrors: {}
    });
    // If nothing changed, just turn off the edit mode, no need to submit anything
    if (bidaskEdited === this.state.bidaskBeforeEditing) {
      return this.setState({
        editBidAskIdx: -1,
        bidaskBeforeEditing: null
      });
    }
    // Validate the new values
    let errors = this.bidaskValidateEdit(bidaskEdited);
    // If anything is wrong with the input, display the errors and remain in the edit mode
    if (Object.keys(errors).length > 0) {
      return this.setState({
        editBidAskErrors: errors
      });
      // If everything is fine, update the bidask in the contract
    } else {
      const priceWei = this.state.web3.toWei(bidaskEdited.baPrice, 'ether');
      this.state.contract.editBidAsk(
        this.state.bidaskBeforeEditing.baId,
        priceWei,
        bidaskEdited.baQuantity,
        { from: this.props.account }
      ).then(() => {
        // Turn off the edit mode and gray out the bidask in the table until the transaction completes
        this.setState(state => ({
          bidasks: state.bidasks.map((bidask, j) => {
            if (j === state.editBidAskIdx) {
              bidask.inProgress = true;
            }
            return bidask;
          }),
          editBidAskIdx: -1,
          bidaskBeforeEditing: null
        }));
      }).catch(error => {
        console.log(error);
      });
    }
    return errors;
  }

  /** Quit the edit mode and revert the changes */
  cancelEditing = () => {
    this.setState(state => ({
      bidasks: state.bidasks.map((bidask, j) => j === state.editBidAskIdx ? state.bidaskBeforeEditing : bidask),
      editBidAskIdx: -1,
      editBidAskErrors: {},
      bidaskBeforeEditing: null
    }));
  }

  /** Handle changes in the inputs when in the edit mode */
  onInputChanged = (e, name, i) => {
    const { value } = e.target;
    this.setState(state => ({
      bidasks: state.bidasks.map((bidask, j) => j === i ? { ...bidask, [name]: value } : bidask)
    }));
  }

  updateBidAsksSold = (error, result) => {
    if (error) {
      console.log(error);
      return;
    }
    let purchaseId = Number(result.args.purchaseId);
    // Add the bidask to sold bidasks in the loading state first
    let newBidAskSold = {
      isLoading: true,
      purchaseId: purchaseId,
      baId: Number(result.args.baId),
      buyer: result.args.customer,
      ccyCustomer: {
        firstName: result.args.ccyCustomerFirstName,
        lastName: result.args.ccyCustomerLastName
      }
    }
    this.setState(state => ({
      soldBidAsks: [...state.soldBidAsks, newBidAskSold]
    }));
    return this.props.getBidAskData(result.args.baId).then(bidask => {
      // Update the bidask with actual data and quit the loading state
      this.setState(state => ({
        soldBidAsks: state.soldBidAsks.map(sold => {
          if (sold.purchaseId === newBidAskSold.purchaseId) {
            bidask.purchaseId = newBidAskSold.purchaseId;
            bidask.ccyCustomer = newBidAskSold.ccyCustomer;
            bidask.buyer = newBidAskSold.buyer;
            bidask.isLoading = false;
            return bidask;
          }
          return sold;
        })
      }));
    });
  };

  render() {
    return (
      <div>
        <FormControl>
          <InputLabel htmlFor="trader-select">Exchange</InputLabel>
          <Select
            value={this.state.traderIdx}
            onChange={this.selectTrader}
            inputProps={{ id: 'trader-select' }}
          >
            {this.props.currencies.map((trader, i) => (
              <MenuItem value={i} key={'asi-' + i}>{trader.ccyName}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <div>
          <img
            src={ipfsGatewayPrefix + this.props.currencies[this.state.traderIdx].imgLogo}
            className="trader-logo"
            alt="logo"
          />
        </div>

        <h2>Traded Pairs</h2>

        <SoldBidAsks
          web3={this.state.web3}
          contract={this.state.contract}
          account={this.props.account}
          soldBidAsks={this.state.soldBidAsks}
        />

        <h2>Manage pairs</h2>

        <Grid container spacing={24}>
          <Grid item xs={4}>
            <Paper style={{ padding: 10 }}>
              <BidAskForm
                onValidate={this.bidaskValidateSubmit}
                onSubmit={this.bidaskSubmit} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <EditableTable
              handleChange={this.onInputChanged}
              handleRemove={this.bidaskRemove}
              startEditing={this.startEditing}
              finishEditing={this.finishEditing}
              cancelEditing={this.cancelEditing}
              editIdx={this.state.editBidAskIdx}
              data={this.state.bidasks}
              dataErrors={this.state.editBidAskErrors}
              dataStructure={[
                {
                  name: 'ID',
                  prop: 'baId',
                  editable: false,
                  type: 'text'
                },
                {
                  name: 'From',
                  prop: 'baFrom',
                  editable: false,
                  errorProp: 'tFromError',
                  type: 'text'
                },
                {
                  name: 'To',
                  prop: 'baTo',
                  editable: false,
                  errorProp: 'tToError',
                  type: 'text'
                },
                {
                  name: 'Price, ETH',
                  prop: 'baPrice',
                  editable: true,
                  errorProp: 'tPriceError',
                  type: 'text'
                },
                {
                  name: 'Quantity',
                  prop: 'baQuantity',
                  editable: true,
                  errorProp: 'baQuantityError',
                  type: 'text'
                }
              ]} />
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default MyTrader;
