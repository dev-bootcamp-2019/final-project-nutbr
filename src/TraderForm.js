import React from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardMedia from '@material-ui/core/CardMedia';
import CircularProgress from '@material-ui/core/CircularProgress';
import grey from '@material-ui/core/colors/grey';

const defaultLogoHash = 'QmSGwhJNAqoDmtZXXtaE57Hs95Ys149q8cuhKbSqV1NSEc';
const ipfsGatewayPrefix = 'https://ipfs.io/ipfs/';

/**
 * A form to create a new Trader
 * @param onValidate - function to be called to validate the data before submitting
 * @param onSubmit - function to be called to submit the data
 */
class TraderForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // input data
      ccyName: '',
      ccyOwner: '',
      aLogoHash: defaultLogoHash,
      traderLogoFile: '',
      // errors for the inputs
      aNameError: '',
      aOwnerError: '',
      // flag when uploading to IPFS
      isUploading: false
    };
    this.traderLogoInput = React.createRef();
  }

  /** Update the data in the state whenever an input value is changed */
  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };

  captureFile = (e) => {
    e.stopPropagation();
    e.preventDefault();
    this.setState({ isUploading: true });
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
        this.setState({
          aLogoHash: fileHash,
          isUploading: false
        });
      }).catch(err => {
        console.log('Failed to upload the logo to IPFS: ', err);
      })
    };
  };

  removeLogo = () => {
    this.setState({
      aLogoHash: defaultLogoHash,
      isUploading: false
    });
  }

  /** Submit the data */
  onSubmit = e => {
    e.preventDefault();
    // Clear the errors first
    this.setState({
      aNameError: '',
      aOwnerError: ''
    });
    // Extract and format the data
    let data = {
      imgLogo: this.state.aLogoHash,
      ccyName: this.state.ccyName.trim(),
      ccyOwner: this.state.ccyOwner.trim()
    };
    // Validate the data
    this.props.onValidate(data).then(errors => {
      if (Object.keys(errors).length > 0) {
        // Set errors if any
        this.setState(errors);
      } else {
        // Submit the data
        this.props.onSubmit(data);
        // And clear the form
        this.setState({
          ccyName: '',
          ccyOwner: '',
          aLogoHash: defaultLogoHash,
          traderLogoFile: ''
        });
      }
    });
  };

  render() {
    return (
      <form onSubmit={e => this.onSubmit(e)}>
        <Grid container spacing={24}>
          <Grid item xs={3}>
            <TextField
              name="ccyName"
              placeholder="Exchange Name"
              label="Exchange Name"
              fullWidth={true}
              value={this.state.ccyName}
              onChange={this.change}
              helperText={this.state.aNameError}
              error={this.state.aNameError.length > 0}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              name="ccyOwner"
              placeholder="Trader Owner Address"
              label="Trader Owner"
              fullWidth={true}
              value={this.state.ccyOwner}
              onChange={this.change}
              helperText={this.state.aOwnerError}
              error={this.state.aOwnerError.length > 0}
            />
          </Grid>
          <Grid item xs={3}>
            <input
              className="trader-logo-input"
              ref={this.traderLogoInput}
              type="file"
              value={this.state.traderLogoFile}
              onChange={this.captureFile}
            />
            <Card className="trader-logo-card">
              {this.state.isUploading ? (
                <CircularProgress size={50} style={{ color: grey[200] }} className="trader-logo-loader" />
              ) : null}
              <CardMedia
                className="trader-logo-form-image"
                image={ipfsGatewayPrefix+this.state.aLogoHash}
                title="Trader Logo"
              />
              <CardActions className="trader-logo-actions">
                <Button
                  size="small"
                  color="primary"
                  onClick={() => this.traderLogoInput.current.click()}
                  className="trader-logo-button"
                >
                  Upload Logo
                </Button>
                <Button
                  size="small"
                  color="primary"
                  className="trader-logo-button"
                  onClick={this.removeLogo}
                >
                  Remove Logo
                </Button>
              </CardActions>
            </Card>
          </Grid>


          <Grid item xs={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={this.state.isUploading}
              style={{ marginTop: 7 }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </form>
    );
  }
}

export default TraderForm;
