import React, { Component } from 'react';
import Image from 'next/image';
import { withFirebase } from '../Firebase';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import Parser from 'html-react-parser';
const moment = require('moment');

class TopBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dateId: moment().format("YYYYMM"),
      penalty: "NA",
      defaultAvatar: "/img/dito_tran.png",
      name: "",
    };
  }

  handleAvatarError = () => {
    if (this.state.defaultAvatar !== '/img/dito_tran.png') {
      this.setState({ defaultAvatar: '/img/dito_tran.png' });
    }
  };

  componentDidMount() {
    this.getPlayerInfo();
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
    var matchRef = this.props.firebase
      .getRef("matches")
      .orderByKey()
      .startAt(this.state.dateId + "01")
      .endAt(this.state.dateId + "31");
    matchRef.once("value").then((snap) => {
      var allPlayers = [];
      snap.forEach((sn) => {
        allPlayers.push({
          dateId: sn.key,
          players: Object.entries(sn.val().players),
        });
      });
      var playersMap = new Map();
      allPlayers.forEach((_allPlayers) => {
        var thePlayer = _allPlayers.players;
        thePlayer.forEach((_thePlayer) => {
          var total = 0;
          if (
            _thePlayer &&
            _thePlayer[1].penalty &&
            _thePlayer[1].penalty !== "" &&
            _thePlayer[1].penalty !== "none"
          ) {
            var fee = this.state.fee.find(
              (f) => f.penalty === _thePlayer[1].penalty
            )
              ? (fee = parseInt(
                  this.state.fee.find(
                    (f) => f.penalty === _thePlayer[1].penalty
                  ).fee
                ))
              : (fee = 0);
            total += fee;
            if (playersMap.has(_thePlayer[1].name)) {
              playersMap.set(
                _thePlayer[1].name,
                playersMap.get(_thePlayer[1].name) + total
              );
            } else {
              playersMap.set(_thePlayer[1].name, total);
            }
          }
        });
      });
      var penaltyText = "";
      playersMap = new Map(
        [...playersMap.entries()].sort((a, b) => b[1] - a[1])
      );
      var count = 1;
      for (var entry of playersMap.entries()) {
        penaltyText +=
          `<img
          src="/img/medal${count}.png"
          alt="Avatar"
          className="pen-badge"
          /> <div id="penTop${count}">` + entry[0] + ": " + entry[1] + "K </div>";
        count++;
        if (count > 3) {
          break;
        }
      }

      this.setState({ penalty: penaltyText });
    });
  }

  componentDidUpdate(prevProps) {
    const prevUid = prevProps.stCurrentUser && prevProps.stCurrentUser.uid;
    const currentUid = this.props.stCurrentUser && this.props.stCurrentUser.uid;

    if (currentUid && prevUid !== currentUid) {
      this.getPlayerInfo();
    }
  }

  getPlayerInfo = async () => {
    if (!this.props.stCurrentUser) {
      return;
    }

    this.props.firebase
      .getRef("players/" + this.props.stCurrentUser.uid)
      .once("value", async (snap) => {
        if (!snap.exists()) {
          return;
        }

        await this.setState({
          id: snap.key,
          name: snap.val().name,
          defaultAvatar: await this.getCurrentUserAvatar(snap.val().avatar, snap.key),
        });
      });
  };

  getCurrentUserAvatar = async (avatarId, playerId) => {
    if (avatarId && /^https?:\/\//i.test(avatarId)) {
      return avatarId;
    }

    const candidateIds = [];
    if (avatarId) {
      candidateIds.push(avatarId);
    }
    if (playerId && avatarId !== playerId) {
      candidateIds.push(playerId);
    }

    for (const candidate of candidateIds) {
      try {
        const url = await this.props.firebase
          .getStorage()
          .ref("avatar")
          .child(candidate)
          .getDownloadURL();
        return url;
      } catch (error) {
        // Continue to the next candidate.
      }
    }

    if (avatarId) {
      return `/img/${avatarId}.png`;
    }

    return "/img/dito_tran.png";
  };

  render() {
    return (
      <nav className="navbar">
        <div className="row">
          <div className="col-sm-10">
            <div id="scroll-text">
              Top phạt tháng này: {Parser(this.state.penalty)}
            </div>
          </div>
          <div className="col-sm-2 text-center text-sm-left">
            Hello <b>{this.state.name}</b>
            <Image
              src={this.state.defaultAvatar}
              alt="Avatar"
              className="nav-avatar"
              width={36}
              height={36}
              unoptimized
              onError={this.handleAvatarError}
            />
          </div>
        </div>
      </nav>
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

const reduxConnectExport = connect(mapStateToProps, mapDispatchToProps)(TopBar)
export default compose(withFirebase)(reduxConnectExport)
