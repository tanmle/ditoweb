import React, { Component } from 'react';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import { connect } from 'react-redux';

class PenantiesRadioGroup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedValue: this.props.player.penalty,
            player: this.props.player,
            isAdmin: !!(this.props.stCurrentUser && parseInt(this.props.stCurrentUser.role, 10) === 1)
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.stCurrentUser !== this.props.stCurrentUser) {
            this.setState({
                isAdmin: !!(this.props.stCurrentUser && parseInt(this.props.stCurrentUser.role, 10) === 1),
            });
        }
    }

    handleChange = async (value) => {
        await this.setState({
            selectedValue: value,
            player: { ...this.state.player, penalty: value }
        })
        await this.props.playerOnChange(this.state.player);
    }

    renderPenaltyRadio = (value) => {
        const inputName = `penalty-user-${this.props.player.playerId || this.props.index}`;

        return (
            <td className="td-pen-check">
                <input
                    type="radio"
                    name={inputName}
                    value={value}
                    checked={this.state.selectedValue === value}
                    disabled={this.state.isAdmin !== true}
                    onChange={(event) => this.handleChange(event.target.value)}
                />
            </td>
        );
    }

    render() {
        return (
            <tr>
                <td>{this.props.index}</td>
                <td>{this.props.player.name || this.props.player.playerId}</td>
                {this.renderPenaltyRadio('none')}
                {this.renderPenaltyRadio('Absense')}
                {this.renderPenaltyRadio('Late5')}
                {this.renderPenaltyRadio('Late10')}
                {this.renderPenaltyRadio('LackPlayer')}
                {this.renderPenaltyRadio('NoReg')}
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
export default compose(withFirebase)(reduxConnectExport)
