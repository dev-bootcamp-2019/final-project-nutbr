import React from 'react';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';

function formatDate(timestamp) {
  const addZero = i => (i < 10 ? "0" + i : i);
  let d = new Date(timestamp * 1000);
  let day = addZero(d.getUTCDate());
  let month = addZero(d.getUTCMonth() + 1);
  let year = addZero(d.getUTCFullYear());
  let hours = addZero(d.getUTCHours());
  let minutes = addZero(d.getUTCMinutes());
  return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
}


// Customizing the look of the table cells
const CustomTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    fontSize: 14
  },
  body: {
    fontSize: 15
  }
}))(TableCell);


class EditableTable extends React.Component {

  /** Render the table header with given data columns */
  renderHeaderRow() {
    const { dataStructure } = this.props;

    return dataStructure.map((dataColumn, columnIdx) => {
      return (
        <CustomTableCell key={`thc-${columnIdx}`}>
          {dataColumn.name}
        </CustomTableCell>
      );
    });
  }


  renderEditableField(dataColumn, dataRow, rowIdx) {
    const { editIdx, dataErrors, handleChange } = this.props;

    let value = dataRow[dataColumn.prop];
    switch (dataColumn.type) {
      case 'datetime':
        value = formatDate(value);
        break;
      case 'custom':
      case 'text':
      default:
        value = value.toString();
        break;
    }
    if (dataColumn.editable && editIdx === rowIdx) {
      if (dataColumn.type === 'custom') {
        return dataColumn.renderEditField(value);
      } else {
        return (
          <TextField
            name={dataColumn.prop}
            value={value}
            onChange={(e) => handleChange(e, dataColumn.prop, rowIdx)}
            label={dataColumn.name}
            helperText={dataErrors[dataColumn.errorProp]}
            error={dataErrors[dataColumn.errorProp] && dataErrors[dataColumn.errorProp].length > 0}
            fullWidth={true}
          />
        );
      }
    } else {
      if (dataColumn.type === 'custom') {
        return dataColumn.renderField(value);
      } else {
        return value;
      }
    }
  };

  /** Render buttons "edit", "remove", "save", "cancel" depending on the mode */
  renderActionButtons(rowIdx) {
    const { editIdx, startEditing, finishEditing, cancelEditing, handleRemove } = this.props;

    return (
      <div className="action-buttons">
        {editIdx === rowIdx ? (
          <span>
            <Tooltip title="Save">
              <IconButton color="primary" onClick={() => finishEditing()}>
                <CheckIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton color="primary" onClick={() => cancelEditing()}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </span>
        ) : (
            <Tooltip title="Edit">
              <IconButton color="primary" onClick={() => startEditing(rowIdx)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        <Tooltip title="Delete">
          <IconButton color="primary" onClick={() => handleRemove(rowIdx)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  /** Render the table body with all the data, editable data fields and action buttons */
  renderTableBody() {
    const { data, dataStructure } = this.props;

    return data.map((dataRow, rowIdx) => {
      if (dataRow.inProgress) {
        return (
          <TableRow
            key={`tr-${rowIdx}`}
            className="row-disabled"
          >
            {dataStructure.map((dataColumn, columnIdx) => (
              <CustomTableCell key={`trc-${columnIdx}`}>
                {dataColumn.type === 'custom'
                  ? dataColumn.renderField(dataRow[dataColumn.prop])
                  : dataRow[dataColumn.prop]}
              </CustomTableCell>
            ))}
            <CustomTableCell style={{ textAlign: 'center' }}>
              <CircularProgress size={20} />
            </CustomTableCell>
          </TableRow>
        );
      } else {
        return (
          <TableRow key={`tr-${rowIdx}`}>
            {dataStructure.map((dataColumn, columnIdx) => (
              <CustomTableCell key={`trc-${columnIdx}`}>
                {this.renderEditableField(dataColumn, dataRow, rowIdx)}
              </CustomTableCell>
            ))}
            <CustomTableCell style={{ textAlign: 'center' }}>
              {this.renderActionButtons(rowIdx)}
            </CustomTableCell>
          </TableRow>
        );
      }
    });
  }

  render() {
    return (
      <Table>
        <TableHead>
          <TableRow>
            {this.renderHeaderRow()}
            <CustomTableCell style={{ textAlign: 'center' }}>
              Actions
            </CustomTableCell>
          </TableRow>
        </TableHead>
        <TableBody>{this.renderTableBody()}</TableBody>
      </Table>
    );
  }
}

export default EditableTable;
