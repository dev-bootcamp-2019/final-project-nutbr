import React from 'react';
import TraderForm from "./TraderForm";
import EditableTable from "./EditableTable";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import grey from '@material-ui/core/colors/grey';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardMedia from '@material-ui/core/CardMedia';

const defaultLogoHash = 'QmSGwhJNAqoDmtZXXtaE57Hs95Ys149q8cuhKbSqV1NSEc';
const ipfsGatewayPrefix = 'https://ipfs.io/ipfs/';

//List of currencies with a form to add a new exchange and edit/remove

class DashboardAdmin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // the index of the row that's being edited right now, -1 means none are edited
      editTraderIdx: -1,
      // errors to display during the edit mode
      editTraderErrors: {},
      // saved version of an trader before editing, to restore the values on cancel
      traderBeforeEditing: null,
      editTraderLogoFile: '',
      isEditUploading: false,
      isContractPaused: false,
      isPausing: false,
      isUnpausing: false
    };

    this.editTraderLogoInput = React.createRef();

    // Check contract Paused state and listen for updates on that
    this.props.contract.paused.call().then(paused => {
      this.setState({ isContractPaused: paused });
    });
    this.props.contract.Pause().watch(() => {
      this.setState({ isContractPaused: true, isPausing: false });
    });
    this.props.contract.Unpause().watch(() => {
      this.setState({ isContractPaused: false, isUnpausing: false });
    });
  }

  //Validate the input before an exchange is added/changed.

  traderValidate = (trader) => {
    let errors = {};
    if (trader.ccyName.length < 3) {
      errors.aNameError = 'Exchange name needs to be at least 3 characters long';
    }
    if (trader.ccyName.length > 32) {
      errors.aNameError = 'Exchange name must not exceed 32 characters';
    }
    if (!this.props.web3.isAddress(trader.ccyOwner)) {
      errors.aOwnerError = 'Exchange owner must be a valid Ethereum address';
    }
    // If we're in edit mode and ccyName remained unchanged, skip the uniqueness check
    if (this.state.editTraderIdx !== -1 && this.state.traderBeforeEditing.ccyName === trader.ccyName) {
      // We should still return a promise here
      return new Promise((resolved, rejected) => {
        resolved(errors);
      });
    }
    // Check that trader name is unique
    return this.props.contract.traderExists.call(this.props.web3.toHex(trader.ccyName)).then(exists => {
      if (exists) {
        errors.aNameError = 'This Exchange name already exists';
      }
      return errors;
    });
  }

  /** Add a new trader to the contract and update the state to display the change */
  traderSubmit = (trader) => {
    // Add the trader to the contract
    this.props.contract.addTrader(
      this.props.web3.toHex(trader.ccyName),
      trader.ccyOwner,
      trader.imgLogo,
      { from: this.props.account }
    ).then(() => {
      // Add the new trader to the list, but grayed out (inProgress: true)
      // It will update to normal automatically when the transaction completes
      this.props.setCurrencies(
        [...this.props.currencies, {
          ccyId: null,
          ccyName: trader.ccyName,
          ccyOwner: trader.ccyOwner,
          inProgress: true
        }]
      );
    }).catch(error => {
      console.log(error);
    });
  }

  /** Remove an trader from the contract and update the state to display the change */
  traderRemove = (i) => {
    const trader = this.props.currencies[i];
    // Remove the trader from the contract
    this.props.contract.removeTrader(
      trader.ccyId,
      // Gas limit is explicitly set here
      { from: this.props.account, gas: 120000 }
    ).then(() => {
      // Gray out the trader in our table
      // It will disappear completely automatically when the transaction completes
      this.props.setCurrencies(
        this.props.currencies.map((trader, j) => {
          if (j === i) {
            trader.inProgress = true;
          }
          return trader;
        })
      );
    }).catch(error => {
      console.log(error);
    });
  }

  //Enable edit mode
  startEditing = (i) => {
    if (this.state.editTraderIdx === -1) {
      this.setState(state => ({
        editTraderIdx: i,
        traderBeforeEditing: this.props.currencies[i]
      }));
    }
  }

  /** Finish editing, save the changes to the contract and update the table */
  finishEditing = () => {
    if (this.state.isEditUploading)
      return;
    let traderEdited = this.props.currencies[this.state.editTraderIdx];
    // Clear the old errors first
    this.setState({
      editTraderErrors: {}
    });
    // If nothing changed, just turn off the edit mode, no need to submit anything
    if (traderEdited === this.state.traderBeforeEditing) {
      return this.setState({
        editTraderIdx: -1,
        editTraderLogoFile: '',
        traderBeforeEditing: null
      });
    }
    // Validate the new values
    return this.traderValidate(traderEdited).then(errors => {
      // If anything is wrong with the input, display the errors and remain in the edit mode
      if (Object.keys(errors).length > 0) {
        return this.setState({
          editTraderErrors: errors
        });
        // If everything is fine, update the trader in the contract
      } else {
        this.props.contract.editTrader(
          this.state.traderBeforeEditing.ccyId,
          this.props.web3.toHex(traderEdited.ccyName),
          traderEdited.ccyOwner,
          traderEdited.imgLogo,
          { from: this.props.account }
        ).then(() => {
          // Turn off the edit mode and gray out the trader in the table until the transaction completes
          this.props.setCurrencies(
            this.props.currencies.map((trader, j) => {
              if (j === this.state.editTraderIdx) {
                trader.inProgress = true;
              }
              return trader;
            })
          );
          this.setState({
            editTraderIdx: -1,
            editTraderLogoFile: '',
            traderBeforeEditing: null
          });
        }).catch(error => {
          console.log(error);
        });
      }
    });
  }

  /** Quit the edit mode and revert the changes */
  cancelEditing = () => {
    this.props.setCurrencies(
      this.props.currencies.map((trader, j) => {
        return j === this.state.editTraderIdx ? this.state.traderBeforeEditing : trader
      })
    );
    this.setState({
      editTraderIdx: -1,
      editTraderErrors: {},
      traderBeforeEditing: null
    });
  }

  /** Handle changes in the inputs when in the edit mode */
  onInputChanged = (e, name, i) => {
    const { value } = e.target;
    this.props.setCurrencies(
      this.props.currencies.map((trader, j) => j === i ? { ...trader, [name]: value } : trader)
    );
  }

  pauseContract = () => {
    this.setState({ isPausing: true });
    this.props.contract.pause({ from: this.props.account }).catch(() => {
      this.setState({ isPausing: false });
    });
  }

  unpauseContract = () => {
    this.setState({ isUnpausing: true });
    this.props.contract.unpause({ from: this.props.account }).catch(() => {
      this.setState({ isUnpausing: false });
    });
  }

  editCaptureFile = (e) => {
    e.stopPropagation();
    e.preventDefault();
    this.setState({ isEditUploading: true });
    let file = e.target.files[0];
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = async () => {
      // File is converted to a buffer to prepare for uploading to IPFS
      let buffer = await Buffer.from(reader.result);
      // Upload the file to IPFS and save the hash
      this.props.ipfs.add(buffer).then(result => {
        let fileHash = result[0].hash;
        console.log('Logo uploaded: ', fileHash);
        this.setState({ isEditUploading: false });
        this.props.setCurrencies(
          this.props.currencies.map((trader, j) => (
            j === this.state.editTraderIdx ? { ...trader, imgLogo: fileHash } : trader
          ))
        );
      }).catch(err => {
        console.log('Failed to upload the logo to IPFS: ', err);
      })
    };
  };

  editRemoveLogo = () => {
    this.setState({ isEditUploading: false });
    this.props.setCurrencies(
      this.props.currencies.map((trader, j) => (
        j === this.state.editTraderIdx ? { ...trader, imgLogo: defaultLogoHash } : trader
      ))
    );
  }

  renderEditLogo = (value) => {
    return (
      <div>
        <input
          className="trader-logo-input"
          ref={this.editTraderLogoInput}
          type="file"
          value={this.state.editTraderLogoFile}
          onChange={this.editCaptureFile}
        />
        <Card className="trader-logo-card">
          {this.state.isEditUploading ? (
            <CircularProgress size={40} style={{ color: grey[200] }} className="trader-logo-loader" />
          ) : null}
          <CardMedia
            className="trader-logo-form-image"
            image={ipfsGatewayPrefix + value}
            title="Trader Logo"
          />
          <CardActions className="trader-logo-actions">
            <Button
              size="small"
              color="primary"
              onClick={() => this.editTraderLogoInput.current.click()}
              className="trader-logo-button"
            >
              Upload Logo
            </Button>
            <Button
              size="small"
              color="primary"
              className="trader-logo-button"
              onClick={this.editRemoveLogo}
            >
              Remove Logo
            </Button>
          </CardActions>
        </Card>
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.state.isContractPaused ? (
          <Button  class="stop" onClick={this.unpauseContract} color="secondary" variant="contained">
            {this.state.isUnpausing ? (
              <CircularProgress size={20} style={{ color: grey[100] }} />
            ) : 'Resume Contract'}
          </Button>
        ) : (
            <Button class="stop" onClick={this.pauseContract} color="secondary" variant="contained">
              {this.state.isPausing ? (
                <CircularProgress size={20} style={{ color: grey[100] }} />
              ) : 'Emergency Stop'}
            </Button>
          )}

        <h1>Exchanges</h1>
        <Grid item xs={12}>
          <TraderForm
            onValidate={this.traderValidate}
            onSubmit={this.traderSubmit}
            ipfs={this.props.ipfs}
          />
        </Grid>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <EditableTable
              handleChange={this.onInputChanged}
              handleRemove={this.traderRemove}
              startEditing={this.startEditing}
              finishEditing={this.finishEditing}
              cancelEditing={this.cancelEditing}
              editIdx={this.state.editTraderIdx}
              data={this.props.currencies}
              dataErrors={this.state.editTraderErrors}
              dataStructure={[
                {
                  name: 'ID',
                  prop: 'ccyId',
                  editable: false,
                  type: 'text'
                },

                {
                  name: 'Exchange Name',
                  prop: 'ccyName',
                  editable: true,
                  errorProp: 'aNameError',
                  type: 'text'
                },
                {
                  name: 'Owner Address',
                  prop: 'ccyOwner',
                  editable: true,
                  errorProp: 'aOwnerError',
                  type: 'text'
                },
                {
                  name: 'Logo',
                  prop: 'imgLogo',
                  editable: true,
                  type: 'custom',
                  renderField: (value) => (
                    <img src={ipfsGatewayPrefix + value} className="trader-logo" alt="logo" />
                  ),
                  renderEditField: this.renderEditLogo
                }
              ]} />
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default DashboardAdmin;
