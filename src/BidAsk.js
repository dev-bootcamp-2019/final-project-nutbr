import React from 'react';
import Grid from '@material-ui/core/Grid';

const ipfsGatewayPrefix = 'https://ipfs.io/ipfs/';


function BidAsk(props) {
  const { bidask, priceETH } = props;

  return (
    <Grid container spacing={8}>
      <Grid item xs={3}>
        <div className="currency">{bidask.baFrom}</div>
      </Grid>
      <Grid item xs={1}>
        <div className="arrow">&#8594;</div>
      </Grid>
      <Grid item xs={3}>
        <div className="currency">{bidask.baTo}</div>
      </Grid>
      <Grid item xs={2}>
        <img src={ipfsGatewayPrefix + bidask.trader.imgLogo} className="trader-logo-small" alt="logo" />
      </Grid>
      <Grid item xs={2}>
        <div className="trader-and-price">
          <div>From: <span className="trader">{bidask.trader.ccyName}</span></div>
          <div>For: <span className="price">{priceETH(bidask.baPrice)}</span></div>
        </div>
      </Grid>
    </Grid >
  );
}

export default BidAsk;
