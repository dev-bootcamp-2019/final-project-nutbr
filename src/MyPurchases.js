import React from 'react';
import BidAsk from './BidAsk';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';

/**
 * Displays a list of user's purchased bidasks.
 * @param web3 - instance of web3
 * @param contract - instance of the smart contract
 * @param account - address of the user
 * @param myBidAsks - list of bidasks purchased by the user
 */
class MyPurchases extends React.Component {

  priceETH = price => {
    return this.props.web3.fromWei(price, 'ether') + ' ETH';
  }

  render() {
    let bidasks = this.props.myBidAsks;
    bidasks.sort((a, b) => (b.purchaseId - a.purchaseId));

    return (
      <div>
        <h1>My Purchases</h1>
        {bidasks.length === 0 ? (
          <div>
            You haven't purchased anything yet
          </div>
        ) :
          bidasks.map((bidask, i) => (
            <Paper key={`mp-${i}`} className="my-purchase-paper">
              <Grid container spacing={16}>
                <Grid item xs={1}>
                  <div className="purchase-id">{bidask.purchaseId}</div>
                </Grid>
                <Grid item xs={8}>
                  {bidask.isLoading ? (
                    <div className="my-purchase-loading">
                      <CircularProgress size={20} />
                    </div>
                  ) : (
                      <BidAsk
                        bidask={bidask}
                        priceETH={this.priceETH}
                      />
                    )}
                </Grid>
                {bidask.ccyCustomer ? (
                  <Grid item xs={3}>
                    <div className="bidask-ccyCustomer-details">
                      <div>Customer Details</div>
                      <div>First name: <span className="ccyCustomer-details-value">{bidask.ccyCustomer.firstName}</span></div>
                      <div>Last name: <span className="ccyCustomer-details-value">{bidask.ccyCustomer.lastName}</span></div>
                    </div>
                  </Grid>
                ) : null}
              </Grid>
            </Paper>
          ))
        }
      </div>
    );
  }

}

export default MyPurchases;
