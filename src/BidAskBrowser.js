import React from 'react';
import SearchBidAskForm from "./SearchBidAskForm";
import BookTraderDialog from './BookTraderDialog';
import TraderSummary from './TraderSummary';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';


function SuccessDialog(props) {
  const { isOpen, onClose } = props;
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Booking completed!
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          You have exchanged your currency!
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} color="primary">
          Continue Searching
        </Button>
        <Button onClick={() => onClose(true)} color="primary" variant="contained" autoFocus>
          Go To My Purchases
        </Button>
      </DialogActions>
    </Dialog>
  );
}


/** Display results of a search */
function SearchBidAskResults(props) {
  const { resultsReady, currencies, priceETH, sorting, onClickBook } = props;

  if (resultsReady) {
    if (currencies.length === 0) {
      return (
        <div>
          <h2>Results</h2>
          <div>Sorry, no currencies found. Try searching another currencies pair!</div>
        </div>
      );
    } else {
      switch (sorting) {
        case 'cheapest':
        default:
          currencies.sort((a, b) => (a.priceTotal > b.priceTotal));
      }
      return (
        <div>
          <h2>Results</h2>
          <div>
            {currencies.map((trader, i) => (
              <Paper key={`sr-${i}`} className="search-result-paper">
                <TraderSummary
                  trader={trader}
                  priceETH={priceETH}
                  onClickBook={() => { onClickBook(trader); }}
                />
              </Paper>
            ))}
          </div>
        </div>
      );
    }
  } else {
    return '';
  }
}


class BidAskBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currencies: [],
      resultsReady: false,
      sorting: 'cheapest',
      isBookDialogOpen: false,
      traderChosen: null,
      isSuccessDialogOpen: false
    }
  }


  searchValidate = (search) => {
    let errors = {};
    if (search.sFrom.length === 0) {
      errors.sFromError = 'Your currency';
    }
    if (search.sTo.length === 0) {
      errors.sToError = 'Which currency do you want to trade to?';
    }

    return errors;
  }

  //Search the bidasks via the contract and display the result
  searchSubmit = (search, onProcessed) => {
    // Clear existing results first
    this.setState({
      currencies: [],
      resultsReady: false
    }, () => {
      // Find only direct currencies
        this.props.contract.findDirectTraders.call(
          this.props.web3.toHex(search.sFrom),
          this.props.web3.toHex(search.sTo),
        ).then(results => {
          for (let i = 0; i < results.length; i++) {
            let baId = Number(results[i]);
            if (baId === 0) {
              // end of results
              break;
            }
            this.props.getBidAskData(baId).then(bidask => {
              // display the result
              this.setState(state => ({
                  currencies: [...state.currencies, {
                  priceTotal: bidask.baPrice,
                  bidasks: [bidask]
                }]
              }));
            });
          }
          onProcessed();
          return this.setState({
            resultsReady: true
          });
        });
       });
     }



  priceETH = price => {
    return this.props.web3.fromWei(price, 'ether') + ' ETH';
  }


  onClickBook = (trader) => {
    this.setState({
      traderChosen: trader,
      isBookDialogOpen: true
    });
  }

  closeBookDialog = () => {
    this.setState({
      isBookDialogOpen: false
    });
  }

  submitBooking = (data, onSuccess, onFailure) => {
    let ccyId1 = data.trader.bidasks[0].baId;
    let ccyId2 = data.trader.bidasks.length > 1 ? data.trader.bidasks[1].baId : 0;
    this.props.contract.bookTrader(
      [ccyId1, ccyId2],
      data.firstName,
      data.lastName,
      { from: this.props.account, value: data.trader.priceTotal }
    ).then(result => {
      onSuccess();
      this.setState({
        isBookDialogOpen: false,
        isSuccessDialogOpen: true
      });
      // Process results of the transaction
      this.props.onBookingComplete(result);
    }).catch(onFailure);
  }

  closeSuccessDialog = (goToMyPurchases) => {
    this.setState({
      isSuccessDialogOpen: false
    });
    if (goToMyPurchases) {
      this.props.navigateToMyPurchases();
    }
  }

  render() {
    return (
      <div>
        <h1>Which currency pairs are you looking for?</h1>

        <Grid container spacing={24}>
          <Grid item xs={12}>
            <SearchBidAskForm
              onValidate={this.searchValidate}
              onSubmit={this.searchSubmit}
            />
          </Grid>
          <Grid item xs={12}>
            <SearchBidAskResults
              resultsReady={this.state.resultsReady}
              currencies={this.state.currencies}
              priceETH={this.priceETH}
              sorting={this.state.sorting}
              onClickBook={this.onClickBook}
            />
          </Grid>
        </Grid>
        <BookTraderDialog
          isOpen={this.state.isBookDialogOpen}
          trader={this.state.traderChosen}
          onClose={this.closeBookDialog}
          onSubmit={this.submitBooking}
          priceETH={this.priceETH}
        />
        <SuccessDialog
          isOpen={this.state.isSuccessDialogOpen}
          onClose={this.closeSuccessDialog}
        />
      </div>
    );
  }
}

export default BidAskBrowser;
