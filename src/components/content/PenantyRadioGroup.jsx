import React, { Component } from 'react';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { withAuthorization } from '../Session';

const condition = authUser => !!authUser;

class PenantiesRadioGroup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedValue: this.props.player.penalty,
            player: this.props.player
        }
    }

    handleChange = async (value) => {
        await this.setState({
            selectedValue: value,
            player: { ...this.state.player, penalty: value }
        })
        await this.props.playerOnChange(this.state.player);
    }

    renderPenaltyRadio = (value, className) => {
        const disabled = this.props.currentUser && parseInt(this.props.currentUser.role, 10) !== 1;
        const inputName = `penalty-${this.props.player.playerId}`;

        return (
            <td className={className}>
                <input
                    type="radio"
                    name={inputName}
                    value={value}
                    checked={this.state.selectedValue === value}
                    disabled={disabled}
                    onChange={(event) => this.handleChange(event.target.value)}
                />
            </td>
        );
    }

    render() {
        return (
            <tr>
                <td>{this.props.index}</td>
                <td className="pen-name">{this.props.player.name || this.props.player.playerId}</td>
                {this.renderPenaltyRadio('none', 'td-pen-check pen-none')}
                {this.renderPenaltyRadio('Late5', 'td-pen-check pen-10k')}
                {this.renderPenaltyRadio('Late10', 'td-pen-check pen-20k')}
                {this.renderPenaltyRadio('Absense', 'td-pen-check pen-30k')}
                {this.renderPenaltyRadio('Custom', 'td-pen-check pen-custom')}
                {this.renderPenaltyRadio('LackPlayer', 'td-pen-check pen-50k')}
                {this.renderPenaltyRadio('NoReg', 'td-pen-check pen-noreg')}
            </tr>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser
    }
}

const reduxConnectExport = connect(mapStateToProps)(PenantiesRadioGroup)
export default compose(withFirebase, withAuthorization(condition))(reduxConnectExport)
