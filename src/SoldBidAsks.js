import React from 'react';
import BidAsk from './BidAsk';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';

//Displays a list of bidasks sold by an trader.

class SoldBidAsks extends React.Component {

  priceETH = price => {
    return this.props.web3.fromWei(price, 'ether') + ' ETH';
  }

  render() {
    let bidasks = this.props.soldBidAsks;
    bidasks.sort((a, b) => (b.purchaseId - a.purchaseId));

    if (bidasks.length === 0) {
      return (
        <div>
          Your Exchange has not traded any pairs yet
        </div>
      );
    } else {
      return (
        <div className="sold-bidasks-container">
          {bidasks.map((bidask, i) => (
            <Paper key={`mp-${i}`} className="sold-bidask-paper">
              <Grid container spacing={16}>
                <Grid item xs={1}>
                  <div className="purchase-id">{bidask.purchaseId}</div>
                </Grid>
                <Grid item xs={2}>
                  <div className="bidask-id">Transaction ID: {bidask.baId}</div>
                </Grid>
                <Grid item xs={6}>
                  {bidask.isLoading ? (
                    <div className="bidask-loading">
                      <CircularProgress size={20} />
                    </div>
                  ) : (
                      <div className="bidask">
                        <BidAsk
                          bidask={bidask}
                          priceETH={this.priceETH}
                        />
                      </div>
                    )}
                </Grid>
                {bidask.ccyCustomer ? (
                  <Grid item xs={3}>
                    <div className="bidask-ccyCustomer-details">
                      <div>Customer Details</div>
                      <div>First name: <span className="ccyCustomer-details-value">{bidask.ccyCustomer.firstName}</span></div>
                      <div>Last name: <span className="ccyCustomer-details-value">{bidask.ccyCustomer.lastName}</span></div>
                      <div className="bidask-buyer">Buyer: {bidask.buyer}</div>
                    </div>
                  </Grid>
                ) : null}
              </Grid>
            </Paper>
          ))}
        </div>
      );
    }
  }

}

export default SoldBidAsks;
