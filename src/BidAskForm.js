import React from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

//Form to create a new BidAsk

class BidAskForm extends React.Component {
  state = {
    // input data
    baFrom: '',
    baTo: '',
    baPrice: '',
    baQuantity: '',
    // errors for the inputs
    tFromError: '',
    tToError: '',
    tPriceError: '',
    baQuantityError: '',
  };

  /** Update the data in the state whenever an input value is changed */
  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  /** Submit the data */
  onSubmit = e => {
    e.preventDefault();
    // Clear the errors first
    this.setState({
      tFromError: '',
      tToError: '',
      tPriceError: '',
      baQuantityError: '',
    });
    // Bring together the bidask data and cast it to proper formats
    let data = {
      baFrom: this.state.baFrom.trim(),
      baTo: this.state.baTo.trim(),
      baPrice: parseFloat(this.state.baPrice),
      baQuantity: parseInt(this.state.baQuantity, 10)
    };
    // Validate the data
    let errors = this.props.onValidate(data);
    if (Object.keys(errors).length > 0) {
      // Set errors if any
      this.setState(errors);
    } else {
      // Submit the data otherwise
      this.props.onSubmit(data);
      // And clear the form
      this.setState({
        baFrom: '',
        baTo: '',
        baPrice: '',
        baQuantity: '',
      });
    }
  };

  render() {
    return (
      <form onSubmit={e => this.onSubmit(e)}>
        <h3 style={{marginTop: 10, marginLeft: 100, marginBottom: 5}}>Add Pair for trade</h3>
        <Grid container spacing={24}>
          <Grid item xs={6}>
            <TextField
              name="baFrom"
              placeholder="From Currency 1"
              label="From"
              fullWidth={true}
              value={this.state.baFrom}
              onChange={e => this.change(e)}
              helperText={this.state.tFromError}
              error={this.state.tFromError.length > 0}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              name="baTo"
              placeholder="To Currency 2"
              label="To"
              fullWidth={true}
              value={this.state.baTo}
              onChange={e => this.change(e)}
              helperText={this.state.tToError}
              error={this.state.tToError.length > 0}
            />
          </Grid>
        </Grid>
        <Grid container spacing={24}>
          <Grid item xs={6}>
            <TextField
              name="baPrice"
              placeholder="Price in ETH"
              label="Price, ETH"
              fullWidth={true}
              value={this.state.baPrice}
              onChange={e => this.change(e)}
              helperText={this.state.tPriceError}
              error={this.state.tPriceError.length > 0}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              name="baQuantity"
              placeholder="Number of contracts Available"
              label="Quantity"
              fullWidth={true}
              value={this.state.baQuantity}
              onChange={e => this.change(e)}
              helperText={this.state.baQuantityError}
              error={this.state.baQuantityError.length > 0}
            />
          </Grid>
        </Grid>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Add pair
            </Button>
          </Grid>
        </Grid>
      </form>
    );
  }
}

export default BidAskForm;
