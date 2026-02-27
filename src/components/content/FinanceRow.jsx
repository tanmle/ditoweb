import React, { Component } from 'react';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withAuthorization } from '../Session';

const condition = authUser => !!authUser;

class Penanties extends Component {
    constructor(props) {
        super(props);
        this.state = {
            player: this.props.player
        }
    }

    handlePaidChange = async (event) => {
        var paid;
        (isNaN(parseInt(event.target.value))) ? paid = 0 : paid = parseInt(event.target.value);

        var currentDebt = (parseInt(this.state.player.monthly_fee) +
            parseInt(this.state.player.pastDebt) +
            parseInt(this.state.player.penalty)) - parseInt(paid)
            
        await this.setState({
            player: { ...this.state.player, paid: paid, currentDebt: currentDebt }
        })

        await this.props.playerOnChange(this.state.player);
    }


    handlePastDebtChange = async (event) => {
        var val;
        (isNaN(parseInt(event.target.value))) ? val = 0 : val = parseInt(event.target.value);

        var currentDebt = (parseInt(this.state.player.monthly_fee) +
            parseInt(val) +
            parseInt(this.state.player.penalty)) - parseInt(this.state.player.paid);
            
        await this.setState({
            player: { ...this.state.player, pastDebt: val, currentDebt : currentDebt }
        })
        await this.props.playerOnChange(this.state.player);
    }

    handleNoteChange = async (event) => {
        await this.setState({
            player: { ...this.state.player, note: event.target.value }
        })
        await this.props.playerOnChange(this.state.player);
    }


    render() {
        return (
            <tr>
                <td>{this.props.index}</td>
                <td>{this.props.player.name}</td>
                <td className="td-pen-check">{this.props.player.monthly_fee}</td>
                <td className="td-pen-check">{this.props.player.penalty}</td>

                <td className="td-pen-check">
                    <input type="number" disabled={this.props.currentUser && parseInt(this.props.currentUser.role) !== 1} onChange={(event) => this.handlePastDebtChange(event)} className="form-control-finance text-right" defaultValue={(this.props.player.pastDebt !== undefined) ? this.props.player.pastDebt : 0} />

                </td>
                <td className="td-pen-check">
                    <strong>{parseInt(this.props.player.monthly_fee) + parseInt(this.props.player.penalty) + parseInt(this.props.player.pastDebt)}</strong>
                </td>

                <td className="td-pen-check">
                    <input type="number" disabled={this.props.currentUser && parseInt(this.props.currentUser.role) !== 1} onChange={(event) => this.handlePaidChange(event)} className="form-control-finance text-right" defaultValue={(this.props.player.paid !== undefined) ? this.props.player.paid : 0} />

                </td>
                <td className="td-pen-check">
                    <strong>{(this.props.player.currentDebt !== undefined && !isNaN(this.props.player.currentDebt)) ? this.props.player.currentDebt : 0}</strong>
                </td>

                <td className="td-pen-check">
                    <input type="text" maxLength="35" disabled={this.props.currentUser && parseInt(this.props.currentUser.role) !== 1} onChange={(event) => this.handleNoteChange(event)} defaultValue={(this.props.player.note !== undefined) ? this.props.player.note : ''} className="form-control-finance-note" />
                </td>
            </tr >
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser
    }
}

const reduxConnectExport = connect(mapStateToProps)(Penanties)
export default compose(withFirebase, withAuthorization(condition))(reduxConnectExport)
