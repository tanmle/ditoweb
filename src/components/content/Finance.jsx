import React, { Component } from 'react';
import Prompt from '../router/Prompt'
import DatePicker from "react-datepicker"
import { connect } from 'react-redux';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import FinanceRow from './FinanceRow'
import _ from 'underscore';
import { withAuthorization } from '../Session';
const moment = require('moment');

const condition = authUser => !!authUser;

class Finance extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDate: new Date(),
            isLocked: false,
            dateId: moment(new Date()).subtract(1, 'month').format('yyyyMM'),
            dateCompare: moment(new Date()).format('yyyyMM'),
            players: [],
            isChange: false,
            isShowDebtCol: false,
            debt: [],
            financeConfig: {}
        }
    }

    componentDidMount() {
        this.getReport(this.state.dateId);
    }

    componentDidUpdate = () => {
        if (this.state.isChange === true) {
            window.onbeforeunload = () => true
        } else {
            window.onbeforeunload = undefined
        }
    }
    CalendarButton = () => {
        const ExampleCustomInput = React.forwardRef(({ value, onClick }, ref) => (
            <button type="button" ref={ref} className="btn btn-primary btn-footer btn-calendar" onClick={onClick}>
                <i className="fa fa-calendar"></i> {value}
            </button>
        ));
        ExampleCustomInput.displayName = 'FinanceCalendarInput';
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

    calendarSelect = async (value) => {

        await this.setState({
            selectedDate: value,
            dateId: moment(value).subtract(1, 'months').format('yyyyMM'),
            dateCompare: moment(value).format('yyyyMM'),
        });
        await this.getReport(this.state.dateId);
    }


    createReport = async (dateId) => {
        var isCreateNew = !(this.state.players.length > 0);
        var lastMonthDebt = [];

        if (isCreateNew === true) {
            var lastMonthRef = this.props.firebase.getRef('finance/players')
                .orderByKey()
                .endAt(moment(this.state.selectedDate).subtract(2, 'months').format('yyyyMM'))
                .limitToLast(1)

            await lastMonthRef.once('value').then(snap => {
                var temp = {};
                snap.forEach(s => {
                    temp = { ...s.val() };
                })
                var tempArr = Object.entries(temp)
                tempArr.forEach(p => {
                    lastMonthDebt.push({ playerId: p[0], ...p[1] })
                })
            });
        }

        // Get finance rate
        await this.props.firebase.getRef('configuration/finance').once('value').then(snap => this.setState({ financeConfig: snap.val() }));

        var matchRef = this.props.firebase.getRef('matches')
            .orderByKey()
            .startAt(this.state.dateId + '01')
            .endAt(this.state.dateId + '31');

        var m = [];
        matchRef.once('value').then(async (matchSnap) => {
            matchSnap.forEach(ms => {
                m.push(ms.val().players)
            })
            //Create array for getting player
            var temp = []
            await m.forEach(_m => {
                Object.entries(_m).forEach(t => {
                    if (t[0].substring(0, 4) !== 'flr_') {
                        temp = [...temp, { playerId: t[0], name: t[1].name, penalty: t[1].penalty, isMatchPay: t[1].isMatchPay, isRegistered: t[1].isRegistered }]
                    }
                })
            })

            // group data by playerId
            var playerGroup = await _.groupBy(temp, function (_temp) {
                return _temp.playerId
            });

            //count total money for each day
            var pTemp = {};
            await Object.entries(playerGroup).forEach(async pg => {
                var monthlyFee = parseInt(this.state.financeConfig.monthly_fee);
                var totalPen = 0;
                var penMoney = 0;
                pg[1].forEach(p => {
                    //count penalty 
                    switch (p.penalty) {
                        case 'Absense':
                            penMoney = parseInt(this.state.financeConfig.penalty.Absense)
                            break;
                        case 'Late5':
                            penMoney = parseInt(this.state.financeConfig.penalty.Late5)
                            break;
                        case 'Late10':
                            penMoney = parseInt(this.state.financeConfig.penalty.Late10)
                            break;
                        case 'Custom':
                            penMoney = parseInt(this.state.financeConfig.penalty.Custom)
                            break;
                        case 'LackPlayer':
                            penMoney = parseInt(this.state.financeConfig.penalty.LackPlayer)
                            break;
                        case 'NoReg':
                            penMoney = parseInt(this.state.financeConfig.penalty.NoReg)
                            break;
                        default:
                            penMoney = 0
                            break;
                    }
                    totalPen = totalPen + penMoney

                })

                //Count debt from last month
                var currentDebt, pastDebt, note = '', paid = 0;
                if (isCreateNew === true) {
                    if (lastMonthDebt.length > 0) {
                        var _lastMonthDebt = lastMonthDebt.find(l => l.playerId === pg[0]);
                        if (_lastMonthDebt) {
                            pastDebt = _lastMonthDebt.currentDebt;
                            currentDebt = monthlyFee + totalPen + _lastMonthDebt.currentDebt;
                        } else { pastDebt = 0; currentDebt = 0 }
                    } else {
                        pastDebt = 0;
                        currentDebt = monthlyFee + totalPen;
                    }
                } else {
                    var p = this.state.players.find(p => p.playerId === pg[0]);
                    (p && p.pastDebt) ? pastDebt = p.pastDebt : pastDebt = 0;
                    (p && p.note) ? note = p.note : note = '';
                    (p && p.paid) ? paid = p.paid : paid = 0
                    currentDebt = monthlyFee + totalPen + pastDebt - paid
                };

                pTemp = {
                    ...pTemp,
                    [pg[0]]: {
                        name: pg[1][0].name,
                        penalty: totalPen,
                        monthly_fee: monthlyFee,
                        paid: paid,
                        pastDebt: pastDebt,
                        currentDebt: currentDebt,
                        note: note
                    }
                }
            });

            console.log(pTemp);
            await this.props.firebase.getRef('finance/players/' + dateId).update(pTemp, (error) => {
                if (error) {
                    console.log(error.message);
                } else {
                    console.log('Update succesful');
                    this.getReport(this.state.dateId);
                }
            })

        });
    }

    getReport = async (dateId) => {
        await this.setState({ players: [] })
        var finPlayerRef = await this.props.firebase.getRef('finance/players/' + dateId);

        finPlayerRef.once('value', finPlayerSnap => {
            var players = [];
            finPlayerSnap.forEach(ps => {
                players.push({ playerId: ps.key, ...ps.val() })
            });
            this.setState({ players: players })
        });

    }


    playerOnChange = async (playerChild) => {
        var arrTemp = await this.state.players.map(player => player.playerId !== playerChild.playerId ? player : playerChild);
        await this.setState({ players: arrTemp, isChange: true });
    }

    showReport = () => {
        if (this.state.players.length > 0) {
            return this.state.players.map((player, index) => {
                return (
                    <FinanceRow player={player}
                        key={player.playerId} index={index + 1}
                        playerOnChange={(player) => this.playerOnChange(player)}
                        isShowDebtCol={this.state.isShowDebtCol} />
                )
            })
        }
    }

    saveReport = async () => {
        var p = {}
        await this.state.players.forEach(player => {
            var temp = { ...player };
            delete temp.playerId;
            p = { ...p, [player.playerId]: temp }
        });

        await this.props.firebase.getRef('finance/players/' + this.state.dateId).update(p, (error) => {
            if (error) {
                console.log(error);
            } else {
                this.setState({ isChange: false })
            }
        })
    }

    CreateReportButton = () => {
        // var disabled = parseInt(moment(Date.now()).format('yyyyMM')) <= parseInt(this.state.dateCompare) || this.state.players.length > 0;
        var disabled = false;
        if (this.props.currentUser && parseInt(this.props.currentUser.role) === 1) {
            return <button type="button"
                disabled={disabled}
                onClick={() => this.createReport(this.state.dateId)}
                className="btn btn-primary mr-2">
                {
                    (!(this.state.players.length > 0)) ? <><i className="fas fa-hammer"></i> Create</> : <><i className="fas fa-sync-alt"></i> Update</>
                }
            </button>
        }
    }

    render() {
        return (
            <React.Fragment>
                <Prompt
                    when={this.state.isChange === true}
                    message='You have unsaved changes, are you sure you want to leave?'
                />
                <div className="container-fluid">
                    {/* Page Heading */}
                    <div className="d-sm-flex align-items-center justify-content-between mb-3">
                        <h1 className="h3 mb-0 text-gray-800">Finance</h1>
                    </div>

                    <div className="row">
                        <div className="col-sm-7 col-lg-5 text-left controls-inline">
                            {this.CalendarButton()}
                            {
                                this.CreateReportButton()
                            }
                            {
                                (this.state.players.length > 0 && this.props.currentUser && parseInt(this.props.currentUser.role) === 1)
                                    ? <button type="button" disabled={!this.state.isChange} onClick={() => this.saveReport()} className="btn btn-primary"><i className="fas fa-save"></i> Save</button> : null
                            }
                        </div>
                    </div>
                    <div className="row  scroll-page">
                        <div className="col-sm-12 col-md-12 col-lg-8">
                            {
                                (this.state.players.length > 0)
                                    ? <div id="table-player">
                                        <table className="table table-striped table-hover responsive">
                                            <thead className="thead-inverse">
                                                <tr>
                                                    <th className="td-pen-check-2">No</th>
                                                    <th>Name</th>
                                                    <th className="td-pen-check p-1">Monthly Fee</th>
                                                    <th className="td-pen-check p-1">Penalty</th>
                                                    <th className="td-pen-check p-1">Past Debt</th>
                                                    <th className="td-pen-check p-1">Total</th>
                                                    <th className="td-pen-check p-1">Paid</th>
                                                    <th className="td-pen-check p-1">Current Debt</th>
                                                    <th className="td-pen-check p-1">Note</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    this.showReport()
                                                }
                                            </tbody>
                                        </table>
                                        <h5 className="text-center">- End -</h5>
                                    </div>
                                    : <div><div className='row-50px'></div>
                                        <h1>No data for this month</h1></div>
                            }
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser
    }
}

const reduxConnectExport = connect(mapStateToProps)(Finance)

export default compose(withFirebase, withAuthorization(condition))(reduxConnectExport)
