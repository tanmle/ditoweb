import React, { Component } from 'react';
import DatePicker from "react-datepicker"
import { connect } from 'react-redux';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import Select from 'react-select';
const moment = require('moment');

class Penanties extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDate: new Date(),
            isLocked: false,
            dateId: moment(this.selectedDate).format('yyyyMM'),
            penalty: [],
            isChange: false,
            isAdmin: false
        }
    }

    componentDidMount() {
        var isAdmin = false;
        this.props.firebase.getRef('configuration/finance/penalty').once('value').then(sn => {
            var fee = [];
            sn.forEach(_sn => {
                fee.push({ penalty: _sn.key, fee: _sn.val() })
            })
            this.setState({ fee: fee })
        })
        if (this.props.stCurrentUser !== null) {
            isAdmin = parseInt(this.props.stCurrentUser.role, 10) === 1
            this.setState({ isAdmin: isAdmin })
        }
        this.loadPlayers();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.stCurrentUser !== this.props.stCurrentUser && this.props.stCurrentUser) {
            this.setState({
                isAdmin: parseInt(this.props.stCurrentUser.role, 10) === 1,
            })
        }
    }

    loadPlayers = () => {
        this.props.firebase.getRef('players').once('value').then(snap => {
            var playerOptions = []
            snap.forEach(sn => {
                playerOptions.push({ playerId: sn.key, name: sn.val().name })
            })
            this.setState({ players: playerOptions });
        })
    }

    PlayerSelect = () => {
        if (this.state.players) {
            if (this.state.players.length > 0) {
                var options = [];
                this.state.players.forEach(p => (
                    options.push({ value: p.playerId, label: p.name })
                ))

                return <Select
                    className="select-player"
                    value={this.state.selectPlayer}
                    onChange={(value) => this.setState({ selectPlayer: value })}
                    options={options}
                    isSearchable={true}
                    placeholder="Select player..."
                />
            }
        }
    }
    componentDidUpdate = () => {
        if (this.state.isChange === true) {
            window.onbeforeunload = () => true
        } else {
            window.onbeforeunload = undefined
        }
    }

    calendarSelect = async (value) => {
        await this.setState({ selectedDate: value, dateId: moment(value).format('yyyyMM') });
    }

    getMatchByUser = (dateId, playerId) => {
        if (playerId && playerId !== '') {
            var matchRef = this.props.firebase.getRef('matches')
                .orderByKey()
                .startAt(dateId + '01')
                .endAt(dateId + '31');
            matchRef.once('value').then(snap => {
                var allPlayers = [];
                snap.forEach(sn => {
                    allPlayers.push({ dateId: sn.key, players: Object.entries(sn.val().players) })
                })
                var selectedPlayer = [];
                allPlayers.forEach(_allPlayers => {
                    var thePlayer = _allPlayers.players.find(_ap => _ap[0] === playerId);
                    if (thePlayer && thePlayer[1].penalty && thePlayer[1].penalty !== '' && thePlayer[1].penalty !== 'none') {
                        selectedPlayer.push({ dateId: _allPlayers.dateId, penalty: thePlayer[1].penalty })
                    }
                })
                this.setState({ penalty: selectedPlayer })
            })
        }
    }

    TablePenalty = () => {
        if (this.state.selectPlayer && this.state.fee) {
            var total = 0
            this.state.penalty.forEach(p => {
                var fee = 0;
                (this.state.fee.find(f => f.penalty === p.penalty)) ? fee = parseInt(this.state.fee.find(f => f.penalty === p.penalty).fee) : fee = 0
                total = total + fee
            })
            return <table className="table table-striped table-inverse">
                <thead className="thead-inverse">
                    <tr>
                        <th>Date</th>
                        <th>Penalty</th>
                        <th>Money</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        this.state.penalty.map((p) => {
                            return <tr key={p.dateId}>
                                <td>{moment(p.dateId).format('yyyy/MM/DD ddd')}</td>
                                <td>{p.penalty}</td>
                                <td>{(this.state.fee.find(f => f.penalty === p.penalty)) ? this.state.fee.find(f => f.penalty === p.penalty).fee : 0}</td>
                            </tr>
                        })
                    }
                    {
                        <tr>
                            <td></td>
                            <td><strong>TOTAL:</strong></td>
                            <td><strong>{total}</strong></td>
                        </tr>
                    }

                </tbody>
            </table>
        }
    }

    CalendarUserView = () => {
        const ExampleCustomInput = ({ value, onClick }) => (
            <button className="btn btn-primary" onClick={onClick}>
                <i className="fa fa-calendar"></i> {value}
            </button>
        );
        return (
            <DatePicker
                dateFormat="MMM yyyy"
                todayButton="This Month"
                selected={this.state.selectedDate}
                onChange={(value) => this.calendarSelect(value)}
                customInput={<ExampleCustomInput />}
                showMonthYearPicker
            />
        );
    };
    render() {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col">
                        {this.PlayerSelect()}
                        {this.CalendarUserView()}
                        <button type="button" onClick={() => this.getMatchByUser(this.state.dateId, this.state.selectPlayer.value)} className="btn btn-primary ml-1"><i className="fa fa-search"></i></button>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-12 col-md-6 col-lg-4">
                        {this.TablePenalty()}
                    </div>
                </div>
            </div>

        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser
    }
}
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        dpSetTeam: (registeredPlayers) => {
            dispatch({ type: "SET_TEAM", registeredPlayers: registeredPlayers })
        }
    }
}

const reduxConnectExport = connect(mapStateToProps, mapDispatchToProps)(Penanties)

export default compose(withFirebase)(reduxConnectExport)
