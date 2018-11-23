import React from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import grey from '@material-ui/core/colors/grey';

//form to search bidasks
class SearchBidAskForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // input data
      sFrom: '',
      sTo: '',
      // errors
      sFromError: '',
      sToError: '',
      // flag to show a loader
      isProcessing: false
    }
  }

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
      sFromError: '',
      sToError: ''
    });
    // Extract the data and remove unnecessary spaces on the sides, if any
    let data = {
      sFrom: this.state.sFrom.trim(),
      sTo: this.state.sTo.trim()
    };
    this.setState({
      sFrom: data.sFrom,
      sTo: data.sTo
    });
    // Validate the data
    let errors = this.props.onValidate(data);
    if (Object.keys(errors).length > 0) {
      // Set errors if any
      this.setState(errors);
    } else {
      // Submit the data otherwise and display a loader
      this.setState({ isProcessing: true });
      this.props.onSubmit(data, () => {
        // When the processing is done, remove the loader
        this.setState({ isProcessing: false });
      });
    }
  };

  render() {
    return (
      <form onSubmit={e => this.onSubmit(e)}>
        <Grid container spacing={24}>
          <Grid item xs={3}>
            <TextField
              name="sFrom"
              placeholder="type your currency"
              label="From"
              fullWidth={true}
              value={this.state.sFrom}
              onChange={e => this.change(e)}
              helperText={this.state.sFromError}
              error={this.state.sFromError.length > 0}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              name="sTo"
              placeholder="type a different currency"
              label="To"
              fullWidth={true}
              value={this.state.sTo}
              onChange={e => this.change(e)}
              helperText={this.state.sToError}
              error={this.state.sToError.length > 0}
            />
       </Grid>
          <Grid item xs={1}>
            <Button type="submit" variant="contained" color="primary" style={{ marginTop: 7 }}>
              {this.state.isProcessing ? (
                <CircularProgress size={20} style={{ color: grey[200] }} />
              ) : 'Search!'}
            </Button>
          </Grid>
        </Grid>
      </form>
    );
  }
}

export default SearchBidAskForm;
