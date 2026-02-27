import React, { Component } from 'react';
import DatePicker from "react-datepicker"
import { connect } from 'react-redux';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import { uid } from 'uid';
import Modal from 'react-bootstrap/Modal'
import { withAuthorization } from '../Session';
import { toast } from 'react-toastify'
import LoadingOverlay from './LoadingOverlay';
import PlayerAvatar from './PlayerMng/PlayerAvatar';

const moment = require('moment');

const condition = authUser => !!authUser;

class MatchRegister extends Component {
    constructor(props) {
        super(props);
        this.state = {
            bigRegisteredChecked: false,
            selectedDate: moment(Date.now()).add(1, 'days').toDate(),
            isShowConfirmModal: false,
            // isLocked: false,
            dateId: moment(Date.now()).add(1, 'days').format('yyyyMMDD'),
            yesPlayers: 0,
            noPlayers: 0,
            players: [
                {
                    playerId: "",
                    name: "",
                    email: "",
                    level: "",
                    status: "",
                    role: "",
                    penalty: "",
                    isRegistered: "",
                    team: "",
                }
            ],
            isRegistered: true,
            freelancers: [{ playerId: 'flr_' + this.dateId + '_' + uid(), name: "" }],
            deleteFlr: [],
            isLoading: false
        }
    }

    async componentDidMount() {
        this.props.dpSetMatchDate(moment(new Date()).add(1, 'days').format('ddd, DD MMM yyyy'))
        await this.getMatch(this.state.dateId);
    }


    CalendarButton = () => {
        const ExampleCustomInput = React.forwardRef(({ value, onClick }, ref) => (
            <button type="button" ref={ref} className="btn btn-primary btn-footer btn-calendar" onClick={onClick}>
                <i className="fa fa-calendar"></i> {value}
            </button>
        ));
        ExampleCustomInput.displayName = 'MatchRegisterCalendarInput';
        return (
            <DatePicker
                dateFormat="EEE, d MMM"
                todayButton="Today"
                selected={this.state.selectedDate}
                onChange={(value) => this.calendarSelect(value)}
                customInput={<ExampleCustomInput />}
            />
        );
    };

    LockButton = () => {
        var disable = true;
        if (this.props.currentUser != null) {
            disable = (parseInt(this.props.currentUser.role) !== 1) || !(this.state.players.length > 0)
        }
        var styleIcon = "fa fa-lock";
        (this.state.isLocked === true) ? styleIcon = "fa fa-lock" : styleIcon = "fa fa-unlock"
        this.props.dpLockSetTeam(this.state.isLocked)
        return <button type="button" disabled={disable} className="btn btn-primary btn-footer btn-calendar"
            onClick={() => this.switchLock()}>
            <i className={styleIcon} aria-hidden="true"></i></button>
    }

    DeleteButton = () => {
        var disabled = true;
        if (this.props.currentUser != null) {
            disabled = (parseInt(this.props.currentUser.role) !== 1) || !(this.state.players.length > 0)
        }
        return <button type="button" disabled={disabled} onClick={() => this.setState({ isShowConfirmModal: true })} className="btn btn-primary mr-1"><i className="fa fa-trash"></i> </button>
    }

    getDayOfWeekNo = (ddd) => {
        switch (ddd) {
            case "Mon":
                return 1;
            case "Tue":
                return 2;
            case "Wed":
                return 3;
            case "Thu":
                return 4;
            case "Fri":
                return 5;
            case "Sat":
                return 6;
            case "Sun":
                return 7;
            default:
                break;
        }
    }

    RefreshButton = () => {
        var disabled = true;
        var refreshPlayer = () => {
            this.setState({ isLoading: true });
            var currentPlayers = [...this.state.players];

            var playerRef = this.props.firebase.getRef('players');
            playerRef.once('value').then(async (playerSnap) => {
                var newPlayers = {};
                playerSnap.forEach(player => {
                    if (parseInt(player.val().status) !== -1) {
                        var isRegistered = false;
                        var dowId = moment(this.state.selectedDate).format('ddd');
                        dowId = this.getDayOfWeekNo(dowId)
                        if(player.val().dow) {
                            if (player.val().dow[dowId] && player.val().dow[dowId] === true) {
                                isRegistered = true;
                            }
                        }
                        var penalty = '';
                        var team = '';
                        var temp = currentPlayers.find(cp => cp.playerId === player.key)
                        if (temp) {
                            isRegistered = temp.isRegistered;
                            penalty = temp.penalty;
                            team = temp.team;
                        }
                        newPlayers = {
                            ...newPlayers, [player.key]: {
                                isRegistered: isRegistered,
                                name: player.val().name, isMatchPay: player.val().isMatchPay | 0, 
                                penalty: penalty,
                                team: team
                            }
                        }
                    }
                });

                var matchRef = this.props.firebase.getRef('matches/' + this.state.dateId + '/players');
                matchRef.update(newPlayers, async (error) => {
                    if (error) {
                        console.log(error.errorMessage);
                    }
                    await this.getMatch(this.state.dateId);
                    await this.setTeam();
                    this.setState({ isLoading: false });
                    toast.success('Match created successfully!', {
                        position: "top-right",
                        autoClose: 1000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        });
                })
            });
        }
        if (this.props.currentUser != null) {
            disabled = (parseInt(this.props.currentUser.role) !== 1)
        }
        return !this.state.players.length && <button type="button" disabled={disabled} onClick={() => refreshPlayer()} className="btn btn-primary mr-1">{<i className="fa fa-hammer"></i>} </button>
    }

    switchLock = async () => {
        this.setState({ isLoading: true });
        await this.getMatch(this.state.dateId)
        await this.setTeam()
        await this.setState({ isLocked: !this.state.isLocked })
        await this.props.firebase.getRef('matches/' + this.state.dateId).update({ isLocked: this.state.isLocked }, (error) => {
            if (error) { console.log(error.message); }

        })
        if(this.state.isLocked)
        {
            toast.info('⚽Locked!', {
                position: "top-right",
                autoClose: 1000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                });
        }
        else
        {
            toast.info('⚽Unlocked!', {
                position: "top-right",
                autoClose: 1000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                });
        }
        await this.saveFreelancers();
        this.props.dpDisableSendMail(this.state.isLocked);
        this.setState({ isLoading: false });
    }

    calendarSelect = async (value) => {
        var dateId = moment(value).format('yyyyMMDD');

        await this.setState({ selectedDate: value, dateId: dateId });
        this.props.dpSetMatchDate(moment(value).format('ddd, DD MMM yyyy'));
        this.props.dpInitialSetTeam(true);

        await this.getMatch(dateId);
    }

    getMatch = async (dateId) => {
        var matchRef = this.props.firebase.getRef('matches/' + dateId);
        matchRef.once('value', matchSnap => {
            var playerMatch = [];
            var freelancersMatch = [];
            var yesPlayers = 0, noPlayers = 0;
            matchSnap.child("players").forEach(m => {
                if (m.key.substring(0, 4) !== 'flr_') {
                    playerMatch.push({ playerId: m.key, ...m.val() });
                } else {
                    freelancersMatch.push({ playerId: m.key, ...m.val() });
                }
                (m.val().isRegistered === true) ? yesPlayers++ : noPlayers++;
            });

            if (freelancersMatch.length < 1) {
                freelancersMatch = [{ playerId: 'flr_' + this.dateId + '_' + uid(), name: "" }]
            }

            var isLocked = (matchSnap).child("isLocked").val();
            if (!isLocked) { isLocked = false }
            var isSent = (matchSnap).child("isSent").val()
            var playerRef = this.props.firebase.getRef('players');
            playerRef.once('value').then((playerSnap) => {
                var players = [];
                var emailList = []
                playerSnap.forEach(player => {
                    players.push({ playerId: player.key, ...player.val() });
                    if(parseInt(player.val().status) !== -1) {
                        emailList.push(player.val().email);
                    }                    
                });
                this.props.dpSetEmailList(emailList);
                var res = playerMatch.map(pMatch => {
                    const p = { ...players.find(p => pMatch.playerId === p.playerId) }
                    delete p.playerId;
                    return { ...pMatch, ...p }
                })

                var freelancers = []
                if (this.props.stFreelancers === null) {
                    freelancers = freelancersMatch;
                } else {
                    freelancers = this.props.stFreelancers
                }

                var arrPlayers = [...res.filter(player => player.isRegistered === true), ...freelancers.filter(flr => flr.name !== '')];

                var teamTemp = {
                    teamA: {
                        level: 0,
                        players: arrPlayers.filter(player => player.team === "A")
                    },
                    teamB: {
                        level: 0,
                        players: arrPlayers.filter(player => player.team === "B")
                    }
                }

                var sendPlayer = {
                    plyA : arrPlayers.filter(player => player.team === "A").map(p => p.name),
                    plyB : arrPlayers.filter(player => player.team === "B").map(p => p.name),
                }

                this.props.dpSetSendPlayer(sendPlayer);

                if (this.props.currentUser !== null && res.length > 1) {
                    var currentP = res.find(p => p.playerId === this.props.currentUser.uid);
                    this.setState({ bigRegisteredChecked: currentP && currentP.isRegistered })
                }
                this.props.dpSetTeamTemp(teamTemp)
                this.setState({ isLocked: isLocked, isSent: isSent, players: res, freelancers: freelancers, yesPlayers: yesPlayers, noPlayers: noPlayers });
                this.setTeam();
            });

        });

    }

    deleteMatch = async (dateId) => {
        this.setState({ isLoading: true });
        await this.props.firebase.getRef('matches/' + dateId).remove();
        await this.setState({ players: [], freelancers: [], isShowConfirmModal: false })
        await this.props.dpSetRegisteredPlayers([]);
        await this.props.dpSetTeamTemp(null);
        this.setState({ isLoading: false });
        toast.success('Match deleted successfully!', {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            });
    }
    toggleRegister = (event, playerId) => {
        this.setState({ isLoading: true });
        this.props.firebase.getRef('matches/' + this.state.dateId + '/players/' + playerId).update({ isRegistered: event.target.checked }, (error) => {
            if (error) { console.log(error.message); } else {
                this.getMatch(this.state.dateId);
            }
            this.setState({ isLoading: false });
        })
    }

    BigRegister = () => {
      const onChange = (checked) => {
        this.setState({ isLoading: true });
        if (this.props.currentUser !== null) {
          this.props.firebase
            .getRef("matches/" + this.state.dateId + "/players/" + this.props.currentUser.uid)
            .update({ isRegistered: checked }, (error) => {
              if (error) {
                console.log(error.message);
              } else {
                this.setState({ bigRegisteredChecked: checked });
                this.getMatch(this.state.dateId);
                if (checked) {
                  toast.info("😁 Yay! Good boy!", {
                    position: "top-right",
                    autoClose: 1000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                  });
                } else {
                  toast.info("😥 Oops! So sad!", {
                    position: "top-right",
                    autoClose: 1000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                  });
                }
              }
            this.setState({ isLoading: false });
            });
        }
      };

      if (this.state.isLocked !== true) {
        if (this.state.stCurrentUser !== null && this.state.players.length > 1) {
          var p = this.state.players.find((p) => this.props.currentUser.uid === p.playerId);
          if (Number(p.status) === 1) {
            return (
              <>
                <div
                    style={{
                        width: '150px',
                        cursor: 'pointer',
                        display: 'inline-block',
                        textAlign: 'center',
                    }}
                    onClick={() => onChange(!this.state.bigRegisteredChecked)}
                    >
                    {this.state.bigRegisteredChecked ? (
                        <div className="btn-big-register">
                            <svg
                                class="swap-on"
                                viewBox="0 0 15 15"
                                version="1.1"
                                id="soccer"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                d="M11,1.5C11,2.3284,10.3284,3,9.5,3S8,2.3284,8,1.5S8.6716,0,9.5,0S11,0.6716,11,1.5z M11,11c-0.5523,0-1,0.4477-1,1&#xA;&#x9;s0.4477,1,1,1s1-0.4477,1-1S11.5523,11,11,11z M12.84,6.09l-1.91-1.91l0,0C10.8399,4.0675,10.7041,4.0014,10.56,4H3.5&#xA;&#x9;C3.2239,4,3,4.2239,3,4.5S3.2239,5,3.5,5h2.7L3,11.3l0,0c-0.0138,0.066-0.0138,0.134,0,0.2c-0.058,0.2761,0.1189,0.547,0.395,0.605&#xA;&#x9;C3.6711,12.163,3.942,11.9861,4,11.71l0,0L5,10h2l-1.93,4.24l0,0C5.0228,14.3184,4.9986,14.4085,5,14.5&#xA;&#x9;c-0.0552,0.2761,0.1239,0.5448,0.4,0.6c0.2761,0.0552,0.5448-0.1239,0.6-0.4l0,0l4.7-9.38l1.44,1.48&#xA;&#x9;c0.211,0.1782,0.5264,0.1516,0.7046-0.0593C13.0037,6.5523,13.0018,6.2761,12.84,6.09z"
                                />
                                {/* Animated ball */}
                                <circle cx="11" cy="12" r="1.2" fill="#ffffff">
                                    <animate attributeName="cy" values="10;12;10" dur="1s" repeatCount="indefinite" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.25 0.1 0.25 1;0.25 0.1 0.25 1" />
                                </circle>
                                <circle cx="11" cy="12.8" r="1.2" fill="#000000" opacity="0.12">
                                    <animate attributeName="cy" values="10.8;12.8;10.8" dur="1s" repeatCount="indefinite" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.25 0.1 0.25 1;0.25 0.1 0.25 1" />
                                </circle>
                            </svg>
                            </div>
                    ) : (
                        <div className="btn-big-register">
                            <svg
                                class="swap-off fill-gray-400 group-hover:fill-gray-500 h-32 w-32 text-gray-400"
                                viewBox="0 0 1024 1024"
                                version="1.1"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                d="M366.31713 744.766507h524.451937l-21.246617-303.632256c-0.003197 0-401.128207-0.147058-503.20532 303.632256z"
                                />
                                <path
                                d="M943.262215 744.766507v159.84515h-863.16381v-159.84515h800.088914z"
                                />
                                <path
                                d="M240.774749 499.8198c56.968811 0 103.16406 46.163279 103.16406 103.13209s-46.195248 103.16406-103.16406 103.16406-103.132091-46.195248-103.13209-103.16406 46.163279-103.132091 103.13209-103.13209z"
                                />
                                <path
                                d="M80.098405 986.676157a22.378321 22.378321 0 0 1-22.378321-22.378321v-529.183353a22.378321 22.378321 0 1 1 44.756642 0v529.183353a22.378321 22.378321 0 0 1-22.378321 22.378321zM943.259018 986.676157a22.378321 22.378321 0 0 1-22.378321-22.378321v-305.400143a22.378321 22.378321 0 1 1 44.756642 0v305.400143c0 12.362424-10.015897 22.378321-22.378321 22.378321z"
                                />
                                <path
                                d="M943.259018 767.148025h-863.16381a22.378321 22.378321 0 1 1 0-44.756642h863.16381a22.378321 22.378321 0 1 1 0 44.756642z"
                                />
                                <path
                                d="M240.774749 728.494271c-69.206556 0-125.510412-56.316643-125.510411-125.542381 0-69.203359 56.303856-125.510412 125.510411-125.510411 69.222541 0 125.542381 56.303856 125.542381 125.510411 0 69.225738-56.31984 125.542381-125.542381 125.542381z m0-206.29615c-44.526465 0-80.75377 36.224108-80.753769 80.753769 0 44.545646 36.227305 80.785739 80.753769 80.785739 44.545646 0 80.785739-36.240092 80.785739-80.785739 0-44.529662-36.240092-80.75377-80.785739-80.753769zM371.879742 766.7612a22.378321 22.378321 0 0 1-22.378322-22.378321c0-82.607974 58.106909-166.216578 159.419962-229.390578 102.352046-63.819775 234.201917-98.966526 371.265937-98.966526a22.378321 22.378321 0 1 1 0 44.756642c-128.803222 0-252.242041 32.739484-347.586476 92.185895-87.918029 54.817296-138.34278 124.589704-138.34278 191.41137a22.378321 22.378321 0 0 1-22.378321 22.381518z"
                                />
                                <path
                                d="M880.187319 767.148025a22.378321 22.378321 0 0 1-22.378321-22.378321v-306.362411a22.378321 22.378321 0 1 1 44.756642 0v306.362411a22.378321 22.378321 0 0 1-22.378321 22.378321zM477.665262 429.487934h-167.837408a22.378321 22.378321 0 0 1-12.317667-41.061023l105.552146-69.58379H309.827854a22.378321 22.378321 0 1 1 0-44.756642h167.837408a22.378321 22.378321 0 0 1 12.317667 41.061022l-105.552146 69.583791h93.234479a22.378321 22.378321 0 1 1 0 44.756642zM636.612082 205.704724h-103.004215a22.378321 22.378321 0 0 1-12.31447-41.061023l40.71256-26.841197h-28.39809a22.378321 22.378321 0 1 1 0-44.756642h103.004215a22.378321 22.378321 0 0 1 12.31447 41.061022l-40.712559 26.841198h28.398089a22.378321 22.378321 0 1 1 0 44.756642zM868.38755 136.491774h-87.0197a22.378321 22.378321 0 0 1-12.31447-41.061023l24.715257-16.28822h-12.400787a22.378321 22.378321 0 1 1 0-44.756642h87.0197a22.378321 22.378321 0 0 1 12.31447 41.061022l-24.715257 16.288221h12.400787a22.378321 22.378321 0 1 1 0 44.756642zM943.259018 926.993175h-863.16381a22.378321 22.378321 0 1 1 0-44.756642h863.16381a22.378321 22.378321 0 1 1 0 44.756642z"
                                />
                                <g fontFamily="sans-serif" fontWeight="bold" fill="#9aa0a6">
                                    <text x="760" y="560" fontSize="240" opacity="0">
                                        Z
                                        <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="0s"/>
                                        <animateTransform attributeName="transform" attributeType="XML" type="translate" values="0,0;20,-60;40,-120" dur="2.5s" repeatCount="indefinite" begin="0s"/>
                                    </text>
                                    <text x="810" y="520" fontSize="210" opacity="0">
                                        Z
                                        <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="0.6s"/>
                                        <animateTransform attributeName="transform" attributeType="XML" type="translate" values="0,0;18,-60;36,-120" dur="2.5s" repeatCount="indefinite" begin="0.6s"/>
                                    </text>
                                    <text x="850" y="480" fontSize="180" opacity="0">
                                        Z
                                        <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="1.2s"/>
                                        <animateTransform attributeName="transform" attributeType="XML" type="translate" values="0,0;16,-60;32,-120" dur="2.5s" repeatCount="indefinite" begin="1.2s"/>
                                    </text>
                                </g>
                            </svg>
                            </div>
                    )}
                    </div>
              </>
            );
          }
        }
      } else {
        if (this.state.stCurrentUser !== null && this.state.players.length > 1) {
          var p2 = this.state.players.find((p2) => this.props.currentUser.uid === p2.playerId);
          if (Number(p2.status) === 1) {
            if (p2 && p2.isRegistered)
              return (
                <div className="btn-big-register">
                  <svg
                    class="swap-on"
                    viewBox="0 0 15 15"
                    version="1.1"
                    id="soccer"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                    d="M11,1.5C11,2.3284,10.3284,3,9.5,3S8,2.3284,8,1.5S8.6716,0,9.5,0S11,0.6716,11,1.5z M11,11c-0.5523,0-1,0.4477-1,1&#xA;&#x9;s0.4477,1,1,1s1-0.4477,1-1S11.5523,11,11,11z M12.84,6.09l-1.91-1.91l0,0C10.8399,4.0675,10.7041,4.0014,10.56,4H3.5&#xA;&#x9;C3.2239,4,3,4.2239,3,4.5S3.2239,5,3.5,5h2.7L3,11.3l0,0c-0.0138,0.066-0.0138,0.134,0,0.2c-0.058,0.2761,0.1189,0.547,0.395,0.605&#xA;&#x9;C3.6711,12.163,3.942,11.9861,4,11.71l0,0L5,10h2l-1.93,4.24l0,0C5.0228,14.3184,4.9986,14.4085,5,14.5&#xA;&#x9;c-0.0552,0.2761,0.1239,0.5448,0.4,0.6c0.2761,0.0552,0.5448-0.1239,0.6-0.4l0,0l4.7-9.38l1.44,1.48&#xA;&#x9;c0.211,0.1782,0.5264,0.1516,0.7046-0.0593C13.0037,6.5523,13.0018,6.2761,12.84,6.09z"
                    />
                    {/* Animated ball */}
                    <circle cx="11" cy="12" r="1.2" fill="#ffffff">
                        <animate attributeName="cy" values="10;12;10" dur="1s" repeatCount="indefinite" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.25 0.1 0.25 1;0.25 0.1 0.25 1" />
                    </circle>
                    <circle cx="11" cy="12.8" r="1.2" fill="#000000" opacity="0.12">
                        <animate attributeName="cy" values="10.8;12.8;10.8" dur="1s" repeatCount="indefinite" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.25 0.1 0.25 1;0.25 0.1 0.25 1" />
                    </circle>
                </svg>
                </div>
              );
            else
              return (
                <div className="btn-big-register">
                  <svg
                    class="swap-off fill-gray-400 group-hover:fill-gray-500 h-32 w-32 text-gray-400"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                    d="M366.31713 744.766507h524.451937l-21.246617-303.632256c-0.003197 0-401.128207-0.147058-503.20532 303.632256z"
                    />
                    <path
                    d="M943.262215 744.766507v159.84515h-863.16381v-159.84515h800.088914z"
                    />
                    <path
                    d="M240.774749 499.8198c56.968811 0 103.16406 46.163279 103.16406 103.13209s-46.195248 103.16406-103.16406 103.16406-103.132091-46.195248-103.13209-103.16406 46.163279-103.132091 103.13209-103.13209z"
                    />
                    <path
                    d="M80.098405 986.676157a22.378321 22.378321 0 0 1-22.378321-22.378321v-529.183353a22.378321 22.378321 0 1 1 44.756642 0v529.183353a22.378321 22.378321 0 0 1-22.378321 22.378321zM943.259018 986.676157a22.378321 22.378321 0 0 1-22.378321-22.378321v-305.400143a22.378321 22.378321 0 1 1 44.756642 0v305.400143c0 12.362424-10.015897 22.378321-22.378321 22.378321z"
                    />
                    <path
                    d="M943.259018 767.148025h-863.16381a22.378321 22.378321 0 1 1 0-44.756642h863.16381a22.378321 22.378321 0 1 1 0 44.756642z"
                    />
                    <path
                    d="M240.774749 728.494271c-69.206556 0-125.510412-56.316643-125.510411-125.542381 0-69.203359 56.303856-125.510412 125.510411-125.510411 69.222541 0 125.542381 56.303856 125.542381 125.510411 0 69.225738-56.31984 125.542381-125.542381 125.542381z m0-206.29615c-44.526465 0-80.75377 36.224108-80.753769 80.753769 0 44.545646 36.227305 80.785739 80.753769 80.785739 44.545646 0 80.785739-36.240092 80.785739-80.785739 0-44.529662-36.240092-80.75377-80.785739-80.753769zM371.879742 766.7612a22.378321 22.378321 0 0 1-22.378322-22.378321c0-82.607974 58.106909-166.216578 159.419962-229.390578 102.352046-63.819775 234.201917-98.966526 371.265937-98.966526a22.378321 22.378321 0 1 1 0 44.756642c-128.803222 0-252.242041 32.739484-347.586476 92.185895-87.918029 54.817296-138.34278 124.589704-138.34278 191.41137a22.378321 22.378321 0 0 1-22.378321 22.381518z"
                    />
                    <path
                    d="M880.187319 767.148025a22.378321 22.378321 0 0 1-22.378321-22.378321v-306.362411a22.378321 22.378321 0 1 1 44.756642 0v306.362411a22.378321 22.378321 0 0 1-22.378321 22.378321zM477.665262 429.487934h-167.837408a22.378321 22.378321 0 0 1-12.317667-41.061023l105.552146-69.58379H309.827854a22.378321 22.378321 0 1 1 0-44.756642h167.837408a22.378321 22.378321 0 0 1 12.317667 41.061022l-105.552146 69.583791h93.234479a22.378321 22.378321 0 1 1 0 44.756642zM636.612082 205.704724h-103.004215a22.378321 22.378321 0 0 1-12.31447-41.061023l40.71256-26.841197h-28.39809a22.378321 22.378321 0 1 1 0-44.756642h103.004215a22.378321 22.378321 0 0 1 12.31447 41.061022l-40.712559 26.841198h28.398089a22.378321 22.378321 0 1 1 0 44.756642zM868.38755 136.491774h-87.0197a22.378321 22.378321 0 0 1-12.31447-41.061023l24.715257-16.28822h-12.400787a22.378321 22.378321 0 1 1 0-44.756642h87.0197a22.378321 22.378321 0 0 1 12.31447 41.061022l-24.715257 16.288221h12.400787a22.378321 22.378321 0 1 1 0 44.756642zM943.259018 926.993175h-863.16381a22.378321 22.378321 0 1 1 0-44.756642h863.16381a22.378321 22.378321 0 1 1 0 44.756642z"
                    />
                </svg>
                </div>
              );
          }
        }
      }
    }
    setTeam = async () => {
        var arrPlayers = await [...this.state.players.filter(player => player.isRegistered === true), ...this.state.freelancers.filter(flr => flr.name !== '')];
        await this.props.dpSetRegisteredPlayers(arrPlayers);
    }

    getRegisterSwitch = (player) => {
        if (this.props.currentUser !== null) {
            const isAdmin = parseInt(this.props.currentUser.role) === 1;
            const isSelf = this.props.currentUser.uid === player.playerId;
            if (isAdmin || isSelf) {
                return <div className="custom-control custom-switch" style={{ display: (this.state.isLocked) ? "none" : "block" }}>
                    <input type="checkbox" disabled={this.state.isLocked} className="custom-control-input" id={player.playerId} key={player.isRegistered} defaultChecked={player.isRegistered} onChange={(event) => this.toggleRegister(event, player.playerId)} />
                    <label className="custom-control-label" htmlFor={player.playerId}></label>
                </div>
            }
        }
    }



    PlayerToday = () => {
        var rowPlayer;
        this.setTeam();
        if (this.state.players.length > 0) {
                        const playersSorted = [...this.state.players];
                        playersSorted.sort((a, b) =>
                            a.name < b.name ? -1 : 1
                        );
                        playersSorted.sort((a, b) =>
                            a.isRegistered > b.isRegistered ? -1 : 1
                        );

                        const currentId = this.props.currentUser && this.props.currentUser.uid;
                        if (currentId) {
                                const idx = playersSorted.findIndex(p => p.playerId === currentId);
                                if (idx > 0) {
                                        const [currentP] = playersSorted.splice(idx, 1);
                                        playersSorted.unshift(currentP);
                                }
                        }

                        rowPlayer = playersSorted.map((player) => {
                var dowId = moment(this.state.selectedDate).format('ddd');
                var isDefaultJoin = false;
                dowId = this.getDayOfWeekNo(dowId)
                if (player.dow && player.dow[dowId] && player.dow[dowId] === true) {
                    isDefaultJoin = true;
                }

                var styleClass = ""; //card bg-success text-white shadow, card bg-warning text-white shadow
                var styleIcon = "";//fas fa-fist-raised, fas fa-bed
                if (player.isRegistered === true) {
                    styleClass = "card bg-success text-white shadow";
                    styleIcon = "fas fa-futbol";
                } else {
                    styleClass = "card bg-secondary text-white shadow";
                    styleIcon = "fas fa-bed";
                }

                return <div className="row" key={player.playerId} style={{justifyContent: "center"}}>
                    <div className="col-sm-8">
                        <div className={styleClass}>
                            <div className="card-body">
                                <PlayerAvatar 
                                    firebase={this.props.firebase} 
                                    playerId={player.playerId} 
                                    avatarValue={player.avatar}
                                    className="reg-avatar"
                                    style={{}}
                                />
                                <i className={styleIcon}></i> {player.name}
                            </div>
                            {(isDefaultJoin === true) ? <div className="mr-1"><i className="fa fa-flag-o"></i></div> : <></>}
                            {this.getRegisterSwitch(player)}

                        </div>
                    </div>
                </div>
            })
        } else {
            rowPlayer = <div className="row text-center">
                <div className="col-sm-12">
                    <div className='row-100px'></div>
                    <h1 className="h4">Match hasn't been created!</h1>
                    <h1 className="h4">Please contact admin</h1>
                </div></div>
        }

        return rowPlayer;
    }


    addFreelancer = () => {
        this.setState({ freelancers: [...this.state.freelancers, { playerId: 'flr_' + this.state.dateId + '_' + uid(), name: "" }] })
    }

    removeFreelancer = async (index) => {
        const list = [...this.state.freelancers];
        var deleteFlr = { ...this.state.freelancers[index] }
        list.splice(index, 1);
        await this.setState({ freelancers: list, deleteFlr: [...this.state.deleteFlr, deleteFlr] });
    }

    saveFreelancers = () => {
        var flr = {}
        var deleteFlr = {}
        var deleteItem = [];
        this.state.freelancers.forEach(freelancer => {
            if (freelancer.name !== '') {
                var temp = { ...freelancer };
                delete temp.playerId;
                flr = {
                    ...flr,
                    [freelancer.playerId]: {
                        ...temp,
                        "name": freelancer.name,
                        "isRegistered": true
                    }
                }
            } else {
                flr = { ...flr, [freelancer.playerId]: null }
            }
        })


        if (this.state.deleteFlr.length > 0) {
            this.state.deleteFlr.forEach(freelancer => {
                var temp = { ...freelancer };
                delete temp.playerId;
                deleteFlr = {
                    ...deleteFlr, [freelancer.playerId]: null
                }
            })
        }
        var tempFrl = [...this.state.freelancers];
        for (let i = deleteItem.length - 1; i >= 0; i--) {
            tempFrl.splice(deleteItem[i], 1);
        }

        flr = { ...flr, ...deleteFlr }
        this.props.firebase.getRef('matches/' + this.state.dateId + '/players/').update(flr, (error) => {
            if (error) { console.log(error.message); }
        })
        this.setState({ freelancers: tempFrl });
        this.props.dpSetFreelancers(null);
    }

    disableAddFreelancer = (index) => {
        if (this.props.currentUser !== null) return this.state.freelancers[index].name === '' || this.state.freelancers.length > 5 || this.state.isLocked || parseInt(this.props.currentUser.role) !== 1
        else return true
    }
    disableRemoveFreelancer = () => {
        if (this.props.currentUser !== null) { return this.state.isLocked || parseInt(this.props.currentUser.role) !== 1 } else return true
    }

    Freelancer = () => {
        return this.state.freelancers.map((freelancer, index) => {
            return <div className="row" key={freelancer.playerId}>
                <div className="col-7">
                    <input type="text" className="freelance-input" disabled={this.disableRemoveFreelancer()} defaultValue={freelancer.name} name={freelancer.playerId} onChange={(event) => this.onChange(event, index)} />
                </div>
                <div className="col-5 text-left">
                    {this.state.freelancers.length !== 1 && <button type="button" disabled={this.disableRemoveFreelancer()} onClick={() => this.removeFreelancer(index)} className="btn-freelance bg-dark"><i className="fas fa-minus"></i></button>}
                    {this.state.freelancers.length - 1 === index && <button type="button" disabled={this.disableAddFreelancer(index)} onClick={() => this.addFreelancer()} className="btn-freelance bg-purple"><i className="fas fa-plus"></i></button>}
                </div>
            </div>
        })
    }

    onChange = (e, index) => {
        const { value } = e.target;
        const list = [...this.state.freelancers];
        list[index].name = value;
        if (value !== '') {
            list[index].isRegistered = true;
        }
        // this.setState({ freelancers: list });
        this.props.dpSetFreelancers(list)
    }

    ConfirmationModal = () => {
        return (
            <Modal show={this.state.isShowConfirmModal} size="sm"
                backdrop="static" >
                <form>
                    <Modal.Header>
                        <Modal.Title>Delete Match</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>Are you sure !?</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="btn btn-primary" onClick={() => this.deleteMatch(this.state.dateId)}><i className="fa fa-trash"></i> Delete </div>
                        <div className="btn btn-secondary" onClick={() => this.setState({ isShowConfirmModal: false })}><i className="fas fa-ban"></i> Close</div>
                    </Modal.Footer>
                </form>
            </Modal>

        );
    }

    EmailSentMessage = () => {
        if (this.state.isSent === true) {
            return <div className="text-center"><div className="row text-center"><h1 className="h4 text-danger">Email sent, please reply the email </h1></div>
                <div className="row text-center"><h1 className="h4 text-danger">if you want to join</h1></div></div>
        }
    }


    render() {
        return (
            <div className="col-lg-4 col-md-6">
                {this.state.isLoading && <LoadingOverlay />}
                {this.EmailSentMessage()}
                {this.ConfirmationModal()}
                <div className="row">
                    <div className="col-sm-12 text-center controls-inline">
                        {this.CalendarButton()}
                        {
                            (this.props.currentUser && parseInt(this.props.currentUser.role) === 1) ? <>
                            {this.DeleteButton()}
                            {this.RefreshButton()}</> : <></>
                        }
                        {this.LockButton()}
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-12 text-center mb-1">
                        {this.BigRegister()}
                    </div>
                </div>
                <div className="row text-center">
                    <div className="col-sm-12 text-center">
                        <div className="card summary bg-secondary text-white shadow">
                            <div className="card-body">
                                <i className="fas fa-futbol"></i> YES <strong>{this.state.yesPlayers}</strong> | <i className="fas fa-bed"> </i> NO  <strong>{this.state.noPlayers}</strong></div>
                        </div>
                    </div>
                </div>

                <div id="players">
                    {this.PlayerToday()}
                    {
                        (this.state.players.length > 0) ? (
                            <div id="freelancer" className="mt-2 mb-2">
                                <div className="row mb-1">
                                    <div className="ml-3 mr-2">
                                        <h5 className="text-gray-800">Freelancers</h5>
                                    </div>
                                    <div>
                                        <button type="button" disabled={this.disableRemoveFreelancer()} onClick={() => this.saveFreelancers()} className="btn-save-freelance btn-primary">Save</button>
                                    </div>
                                </div>
                                {this.Freelancer()}
                            </div>
                        ) : null
                    }
                </div>
            </div>

        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser,
        stFreelancers: state.freelancers,
        stTeamTemp: state.teamTemp
    }
}
const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        dpSetTeamTemp: (teamTemp) => {
            dispatch({ type: "SET_TEAM_TEMP", teamTemp: teamTemp })
        },
        dpSetRegisteredPlayers: (registeredPlayers) => {
            dispatch({ type: "SET_TEAM", registeredPlayers: registeredPlayers })
        },
        dpSetFreelancers: (freelancers) => {
            dispatch({ type: "SET_FREELANCERS", freelancers: freelancers })
        },
        dpLockSetTeam: (isLocked) => {
            dispatch({ type: "LOCK_SET_TEAM", isLocked: isLocked })
        },
        dpDisableSendMail: (isDisableSendMail) => {
            dispatch({ type: "DISABLE_SEND_MAIL", isDisableSendMail: isDisableSendMail })
        },
        dpSetEmailList: (emailList) => {
            dispatch({ type: "SET_EMAIL_LIST", emailList: emailList })
        },
        dpSetMatchDate: (matchDate) => {
            dispatch({ type: "SET_MATCH_DATE", matchDate: matchDate })
        },
        dpInitialSetTeam: (isInitialSetTeam) => {
            dispatch({ type: "SET_INITIAL_SET_TEAM", isInitialSetTeam: isInitialSetTeam })
        },
        dpSetSendPlayer: (sendPlayer) => {
            dispatch({ type: "SET_SEND_PLAYER", sendPlayer: sendPlayer })
        }
    }
}

const reduxConnectExport = connect(mapStateToProps, mapDispatchToProps)(MatchRegister)

export default compose(withFirebase, withAuthorization(condition))(reduxConnectExport)
