import React from 'react';
import TraderSummary from './TraderSummary';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import CircularProgress from '@material-ui/core/CircularProgress';
import grey from '@material-ui/core/colors/grey';


// Displays a window to buy a pair. Asks to enter Customer details

class BookTraderDialog extends React.Component {

  state = {
    firstName: '',
    lastName: '',
    firstNameError: '',
    lastNameError: '',
    isProcessing: false
  }

  /** Update the data in the state whenever an input value is changed */
  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  submit = e => {
    e.preventDefault();
    this.setState({
      firstNameError: '',
      lastNameError: ''
    });
    let data = {
      trader: this.props.trader,
      firstName: this.state.firstName.trim(),
      lastName: this.state.lastName.trim()
    }
    this.setState({
      firstName: data.firstName,
      lastName: data.lastName
    });
    // Validate
    let errors = {};
    if (data.firstName.length === 0) {
      errors.firstNameError = 'Please enter Customer\'s first name';
    }
    if (data.lastName.length === 0) {
      errors.lastNameError = 'Please enter Customer\'s last name';
    }
    if (Object.keys(errors).length > 0) {
      // Display errors if any
      this.setState(errors);
    } else {
      // Submit the data otherwise and display a loader
      this.setState({ isProcessing: true });
      this.props.onSubmit(data, () => {
        // When the processing is done, remove the loader and clear the form
        this.setState({
          isProcessing: false,
          firstName: '',
          lastName: ''
        });
      }, () => {
        // When error occured, just remove the loader
        this.setState({
          isProcessing: false
        });
      });
    }
  }

  render() {
    const { isOpen, onClose, trader, priceETH } = this.props;

    return (
      <form>
        <Dialog
          open={isOpen}
          onClose={onClose}
          fullWidth
          maxWidth={false}
        >
          <DialogTitle>Book Your Trade</DialogTitle>
          <DialogContent>
            <TraderSummary
              trader={trader}
              priceETH={priceETH}
              onClickBook={null}
            />
            <div className="booking-ccyCustomer-details">
              <p>Please enter Customer details:</p>
              <div>
                <TextField
                  name="firstName"
                  placeholder="First name"
                  label="First name"
                  value={this.state.firstName}
                  onChange={e => this.change(e)}
                  helperText={this.state.firstNameError}
                  erkror={this.state.firstNameError.length > 0}
                  className="booking-details-field"
                />
              </div>
              <div>
                <TextField
                  name="lastName"
                  placeholder="Last name"
                  label="Last name"
                  value={this.state.lastName}
                  onChange={e => this.change(e)}
                  helperText={this.state.lastNameError}
                  error={this.state.lastNameError.length > 0}
                  className="booking-details-field"
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="primary">
              Cancel
            </Button>
            <Button type="submit" variant="contained" onClick={this.submit} color="primary" className="buy-now-button">
              {this.state.isProcessing ? (
                <CircularProgress size={20} style={{ color: grey[200] }} />
              ) : 'Buy Now'}
            </Button>
          </DialogActions>
          <p>If an error occurs contact the owner. Causes: no more availability or the contract is paused!</p>
        </Dialog>
      </form>
    );
  }

}

export default BookTraderDialog;
