import React, { Component } from "react";
import DatePicker from "react-datepicker";
import { connect } from "react-redux";
import { withFirebase } from "../Firebase";
import { compose } from "recompose";
const moment = require("moment");

class Penanties extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDate: new Date(),
      isLocked: false,
      dateId: moment().format("YYYYMM"),
      penalty: [],
      isChange: false,
      isAdmin: false,
    };
  }

  componentDidMount() {
    var isAdmin = false;
    this.props.firebase
      .getRef("configuration/finance/penalty")
      .once("value")
      .then((sn) => {
        var fee = [];
        sn.forEach((_sn) => {
          fee.push({ penalty: _sn.key, fee: _sn.val() });
        });
        this.setState({ fee: fee });
      });
    if (this.props.stCurrentUser !== null) {
      isAdmin = parseInt(this.props.stCurrentUser.role, 10) === 1;
      this.setState({ isAdmin: isAdmin });
    }

    this.getAllUsers(moment(this.state.selectedDate).format("YYYYMM"));
  }

  loadPlayers = () => {
    this.props.firebase
      .getRef("players")
      .once("value")
      .then((snap) => {
        var playerOptions = [];
        snap.forEach((sn) => {
          playerOptions.push({ playerId: sn.key, name: sn.val().name });
        });
        this.setState({ players: playerOptions });
      });
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isChange === true) {
      window.onbeforeunload = () => true;
    } else {
      window.onbeforeunload = undefined;
    }

    if (prevState.selectedDate !== this.state.selectedDate) {
      this.getAllUsers(moment(this.state.selectedDate).format("YYYYMM"));
    }

    if (prevProps.stCurrentUser !== this.props.stCurrentUser && this.props.stCurrentUser) {
      this.setState({
        isAdmin: parseInt(this.props.stCurrentUser.role, 10) === 1,
      });
    }
  }

  TablePenalty = () => {
    var playersMap = new Map();
    this.state.penalty.forEach((p) => {
      var fee = 0;
      this.state.fee.find((f) => f.penalty === p.penalty)
        ? (fee = parseInt(
            this.state.fee.find((f) => f.penalty === p.penalty).fee
          ))
        : (fee = 0);
      if (playersMap.has(p.id)) {
        playersMap.set(p.id, {
          name: p.name,
          fee: fee + playersMap.get(p.id).fee,
        });
      } else {
        playersMap.set(p.id, { name: p.name, fee: fee });
      }
    });
    var tempObj = [];
    for (var entry of playersMap.entries()) {
      tempObj.push({ name: entry[1].name, penalty: entry[1].fee });
    }
    tempObj.sort((a, b) => (a.penalty < b.penalty ? -1 : 1));
    const result = tempObj.reduce((accumulator, obj) => {
      return accumulator + obj.penalty;
    }, 0);
    return (
      <table className="table table-striped table-inverse">
        <thead className="thead-inverse">
          <tr>
            <th>Name</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {tempObj.map((p) => {
            return (
              <tr>
                <td>{p.name}</td>
                <td>{p.penalty}</td>
              </tr>
            );
          })}
          {
                        <tr>
                            <td><strong>Grand total:</strong></td>
                            <td><strong>{result}</strong></td>
                        </tr>
                    }
        </tbody>
      </table>
    );
  };

  calendarSelect = async (value) => {
    await this.setState({
      selectedDate: value,
      dateId: moment(value).format("YYYYMM"),
    });
    await this.getAllUsers(moment(value).format("YYYYMM"));
  };

  getAllUsers = async (dateId) => {
    var matchRef = this.props.firebase
      .getRef("matches")
      .orderByKey()
      .startAt(dateId + "01")
      .endAt(dateId + "31");
    matchRef.once("value").then((snap) => {
      var allPlayers = [];
      snap.forEach((sn) => {
        allPlayers.push({
          dateId: sn.key,
          players: Object.entries(sn.val().players),
        });
      });
      var selectedPlayer = [];
      allPlayers.forEach((_allPlayer) => {
        var a = _allPlayer.players;
        a.forEach((test) => {
          if (
            test[1].penalty &&
            test[1].penalty !== "" &&
            test[1].penalty !== "none"
          ) {
            selectedPlayer.push({
              id: test[0],
              name: test[1].name,
              penalty: test[1].penalty,
            });
          }
        });
      });
      this.setState({ penalty: selectedPlayer });
    });
  };

  CalendarMonthlyView = () => {
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
          <div className="col-sm-12 col-md-6 col-lg-4">
            {this.CalendarMonthlyView()}
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
    stCurrentUser: state.currentUser,
  };
};
const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    dpSetTeam: (registeredPlayers) => {
      dispatch({ type: "SET_TEAM", registeredPlayers: registeredPlayers });
    },
  };
};

const reduxConnectExport = connect(
  mapStateToProps,
  mapDispatchToProps
)(Penanties);

export default compose(withFirebase)(reduxConnectExport);
