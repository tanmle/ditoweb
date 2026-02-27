import React, { Component } from 'react';
import Prompt from '../router/Prompt'
import DatePicker from "react-datepicker"
import { connect } from 'react-redux';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import PenantiesRadioGroup from './PenantyRadioGroup'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import PenantiesUserView from './PenantiesUserView'
import { withAuthorization } from '../Session';
import { toast } from 'react-toastify'
import PenantiesMonthlyView from './PenantiesMonthlyView';

const moment = require('moment');

const condition = authUser => !!authUser;

class Penanties extends Component {
    constructor(props) {
        super(props);
        this.fileInputRef = React.createRef();
        this.state = {
            selectedDate: new Date(),
            isLocked: false,
            dateId: moment(new Date()).format('yyyyMMDD'),
            players: [],
            isChange: false,
            evidenceAvatar: null
        }
    }

    async componentDidMount() {
        this.getMatch(this.state.dateId);
        await this.setState({evidenceSS: await this.getCurrentEvidence()})
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
        ExampleCustomInput.displayName = 'PenantiesCalendarInput';
        return (
            <DatePicker
                dateFormat="EEE, d MMM yyyy"
                todayButton="Today"
                selected={this.state.selectedDate}
                onChange={(value) => this.calendarSelect(value)}
                customInput={<ExampleCustomInput />}
            />
        );
    };

    calendarSelect = async (value) => {
        await this.setState({ selectedDate: value, dateId: moment(value).format('yyyyMMDD'), players : [] });
        await this.getMatch(this.state.dateId);
        await this.setState({evidenceSS: await this.getCurrentEvidence()})
    }

    getMatch = (yearMonthDate) => {
        var matchRef = this.props.firebase.getRef('matches/' + yearMonthDate);
        matchRef.once('value', matchSnap => {
            if (!matchSnap.exists()) {
                this.setState({ players: [] });
                return;
            }

            var playerMatch = [];
            matchSnap.child("players").forEach(m => {
                const value = m.val() || {};
                const isRegistered = value.isRegistered;
                const isRegisteredTruthy =
                    isRegistered === true ||
                    isRegistered === 1 ||
                    isRegistered === '1' ||
                    isRegistered === 'true';

                if (isRegisteredTruthy) {
                    playerMatch.push({ playerId: m.key, ...value });
                }
            });

            this.setState({ players: playerMatch });
        });
    }

    playerOnChange = async (playerChild) => {
        var arrTemp = await this.state.players.map(player => player.playerId !== playerChild.playerId ? player : playerChild);
        await this.setState({ players: arrTemp, isChange: true });
    }

    showPlayers = () => {
        if (this.state.players.length > 0) {
            this.state.players.sort((a, b) =>
              a.name < b.name ? -1 : 1
            );
            return this.state.players.map((player, index) => {
                return (
                    <PenantiesRadioGroup player={player} key={player.playerId} index={index + 1} playerOnChange={(player) => this.playerOnChange(player)} />
                )
            })
        }
    }

    saveRecord = async () => {
        var p = {}
        await this.state.players.forEach(player => {
            var temp = { ...player };
            delete temp.playerId;
            p = { ...p, [player.playerId]: temp }
        });

        await this.props.firebase.getRef('matches/' + this.state.dateId + '/players').update(p, (error) => {
            if (error) {
                console.log(error);
            } else {
                this.setState({ isChange: false })
                toast.success('Saved!', {
                    position: "top-right",
                    autoClose: 1000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    });
            }
        })
    }

    getCurrentEvidence = async () => {
        try {
          const url = await this.props.firebase
            .getStorage()
            .ref("evidence")
            .child(moment(this.state.selectedDate).format("YYYYMMDD"))
            .getDownloadURL();
          return url;
        } catch {
          return null;
        }
      };

    uploadEvidence = async (event) => {
        const uploadTask = this.props.firebase
          .getStorage()
          .ref(`evidence/${moment(this.state.selectedDate).format("YYYYMMDD")}`)
          .put(event.target.files[0]);
        toast.promise(uploadTask, {
          pending: "Uploading evidence....",
          success: {
            render() {
              return "Evidence uploaded successfully!";
            },
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          },
          error: "Uploading evidence failed 🤯",
        });
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            console.log('Uploading progress: ', progress);
          },
          (error) => {
            console.log(error);
          },
          async () => {
            await this.setState({
              evidenceSS: await this.props.firebase
                .getStorage()
                .ref("evidence")
                .child(moment(this.state.selectedDate).format("YYYYMMDD"))
                .getDownloadURL(),
            });
          }
        );
      };

      uploadEvidenceClipboard = async () => {
        const clipboard = await navigator.clipboard.read();
        if(clipboard[0].types.indexOf("image/png"))
        {
            toast.info('No image found in the clipboard!', {
                position: "top-right",
                autoClose: 1000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                });
            return;
        }
        const file = clipboard[0] && await clipboard[0].getType("image/png");
        const uploadTask = this.props.firebase
          .getStorage()
          .ref(`evidence/${moment(this.state.selectedDate).format("YYYYMMDD")}`)
          .put(file);
        toast.promise(uploadTask, {
          pending: "Uploading evidence....",
          success: {
            render() {
              return "Evidence uploaded successfully!";
            },
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          },
          error: "Uploading evidence failed 🤯",
        });
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            console.log('Uploading progress: ', progress);
          },
          (error) => {
            console.log(error);
          },
          async () => {
            await this.setState({
              evidenceSS: await this.props.firebase
                .getStorage()
                .ref("evidence")
                .child(moment(this.state.selectedDate).format("YYYYMMDD"))
                .getDownloadURL(),
            });
          }
        );
      };

    
    render() {
        return (
            <div className="container-fluid">
                <div className="d-sm-flex align-items-center justify-content-between mb-3">
                    <h1 className="h3 mb-0 text-gray-800">Penalties Records</h1>
                </div>
                <Tabs defaultIndex={0}>
                    <TabList>
                        <Tab>Daily View</Tab>
                        <Tab>User View</Tab>
                        <Tab>Monthly View</Tab>
                    </TabList>
                    <TabPanel>
                        <React.Fragment>
                            <Prompt
                                when={this.state.isChange === true}
                                message='You have unsaved changes, are you sure you want to leave?'
                            />
                            <div className="container-fluid">

                                {/* Page Heading */}


                                <div className="row">
                                    <div className="col-sm-2">
                                        {this.CalendarButton()}
                                    </div>
                                    <div className="col-sm-8" style={{"margin-top": "1rem"}}>
                                        {
                                            (this.state.players.length > 0 && this.props.currentUser && parseInt(this.props.currentUser.role) === 1) 
                                            ? <div>
                                                <button type="button" disabled={!this.state.isChange} onClick={() => this.saveRecord()} className="btn btn-primary" style={{"margin-right": "10px"}}>Save</button> 
                                                <button
                                                  type="button"
                                                  className="btn btn-primary"
                                                  onClick={() => this.fileInputRef.current?.click()}
                                                  style={{"margin-right": "10px"}}
                                                >
                                                  Evidence from local
                                                </button>
                                                <button type="button" className="btn btn-primary" onClick={() => this.uploadEvidenceClipboard()}>Evidence from clipboard</button>
                                              <input
                                                ref={this.fileInputRef}
                                                id="fileUpload"
                                                type="file"
                                                onChange={this.uploadEvidence}
                                                style={{ display: "none" }}
                                            />
                                            </div>
                                            : null
                                        }
                                    </div>
                                </div>
                                <div className="row  scroll-page">
                                    <div className="col-sm-12 col-lg-5">
                                        {
                                            (this.state.players.length > 0)
                                                ? <div id="table-player">
                                                    <table className="table table-striped table-hover responsive pen-table">
                                                        <thead className="thead-inverse">
                                                            <tr>
                                                                <th className="td-pen-check-2">No</th>
                                                                <th>Name</th>
                                                                <th className="td-pen-check th-pen-none">None</th>
                                                                <th className="td-pen-check th-pen-10k">10k</th>
                                                                <th className="td-pen-check th-pen-20k">20k</th>
                                                                <th className="td-pen-check th-pen-30k">30k</th>
                                                                <th className="td-pen-check th-pen-custom">40k</th>
                                                                <th className="td-pen-check th-pen-50k">50k</th>
                                                                <th className="td-pen-check th-pen-noreg">NoReg</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                this.showPlayers()
                                                            }
                                                        </tbody>
                                                    </table>
                                                    <h5 className="text-center">- End -</h5>
                                                </div>
                                                : <div><div className='row-50px'></div>
                                                    <h1>No data for this day</h1></div>
                                        }
                                    </div>
                                    <div className="col-sm-12 col-lg-5">
                                        {
                                            (this.state.evidenceSS != null) ? <img
                                            src={this.state.evidenceSS}
                                            alt="Evidence"
                                            className="evidence"
                                            /> : null
                                        }
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    </TabPanel>
                    <TabPanel>
                        <PenantiesUserView />
                    </TabPanel>
                    <TabPanel>
                        <PenantiesMonthlyView />
                    </TabPanel>
                </Tabs>
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

export default compose(withFirebase, withAuthorization(condition))(reduxConnectExport)
