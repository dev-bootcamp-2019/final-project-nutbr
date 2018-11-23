import React from 'react';
import BidAsk from './BidAsk';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

function Trader(props) {
  const { trader, priceETH, onClickBook } = props;

  return (
    <Grid container spacing={16}>
      <Grid item xs={8}>
        {trader.bidasks.map((bidask, j) => (
          <div key={`srt-${j}`}>
            <BidAsk bidask={bidask} priceETH={priceETH} />
          </div>
        ))}
      </Grid>
      <Grid item xs={2}>
        <div className="total">
          Total: <span className="price">{priceETH(trader.priceTotal)}</span>
        </div>
        </Grid>
        <Grid item xs={2}>
        {onClickBook !== null ? (
          <Button
            variant="contained"
            color="primary"
            className="book-button"
            onClick={onClickBook}
          >
            Book
          </Button>
        ) : ''}
      </Grid>
    </Grid>
  );
}

export default Trader;
