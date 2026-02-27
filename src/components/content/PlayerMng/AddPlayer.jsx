import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal'
import { withFirebase } from '../../Firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { toast } from 'react-toastify'

const Joi = require('joi-browser');

class AddPlayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            errorMessage: "",
            id: "",
            name: "",
            level: 2,
            email: "",
            isDefaultJoin: 0,
            isMatchPay: 0,
            status: 1,
            avatar: "",
            role: 0,
            dow: {},
            playerDetails: {
                id: "",
                name: "",
                level: "",
                isDefaultJoin: 0,
                dow: {},
                isMatchPay: 0,
                email: "",
                role: "",
                status: "",
                avatar: ""
            }
        }
    }

    eventChange = async (event) => {
        await this.setState({
            [event.target.name]: event.target.value
        });
        await this.setState({
            playerDetails: {
                id: this.state.id,
                name: this.state.name,
                level: this.state.level,
                email: this.state.email,
                dow: this.state.dow,
                isMatchPay: this.state.isMatchPay,
                role: this.state.role,
                status: this.state.status,
                avatar: this.state.avatar
            }
        });
    }

    showErrorMessage = (msg) => {
        if (msg !== undefined && msg !== null && msg !== "") {
            return <p className="text-xs text-danger">{'* ' + msg}</p>
        }
    }

    addPlayer = async () => {
        var playerDetailsTemp = { ...this.state.playerDetails };
        const schema = Joi.object().keys({
            name: Joi.string().min(2).max(35).required(),
            level: Joi.number().min(1).max(5).required(),
            email: Joi.string().email().required(),
            isDefaultJoin: Joi.optional(),
            refresh_token: Joi.optional(),
            dow: Joi.object().optional(),
            isMatchPay: Joi.number().min(0).max(1).required(),
            role: Joi.number().min(0).max(1).required(),
            status: Joi.number().min(0).max(1).required(),
            avatar: Joi.string().allow('').optional()
        })
        delete playerDetailsTemp.id;
        const validateResult = Joi.validate(playerDetailsTemp, schema);
        if (validateResult.error === null) {
            var config = {
                apiKey: process.env.NEXT_PUBLIC_apiKey || process.env.REACT_APP_apiKey,
                authDomain: process.env.NEXT_PUBLIC_authDomain || process.env.REACT_APP_authDomain,
                databaseURL: process.env.NEXT_PUBLIC_databaseURL || process.env.REACT_APP_databaseURL,
                projectId: process.env.NEXT_PUBLIC_projectId || process.env.REACT_APP_projectId,
                storageBucket: process.env.NEXT_PUBLIC_storageBucket || process.env.REACT_APP_storageBucket,
                messagingSenderId: process.env.NEXT_PUBLIC_messagingSenderId || process.env.REACT_APP_messagingSenderId,
                appId: process.env.NEXT_PUBLIC_appId || process.env.REACT_APP_appId,
                measurementId: process.env.NEXT_PUBLIC_measurementId || process.env.REACT_APP_measurementId
            };
            var secondaryApp;
            (firebase.apps.length > 1) ? secondaryApp = firebase.apps[1] : secondaryApp = firebase.initializeApp(config, "Secondary");

            if (secondaryApp) {
                secondaryApp.auth().createUserWithEmailAndPassword(playerDetailsTemp.email, 'ditoTeam').then(authUser => {
                    if (authUser !== null) {
                        this.props.firebase.getRef('players/' + authUser.user.uid).set(playerDetailsTemp, (error) => {
                            if (error) {
                                this.setState({ error: error.errorMessage })
                            } else {
                                console.log("User " + authUser.user + " created successfully!");
                                if (secondaryApp) { secondaryApp.auth().signOut(); }
                                this.setState({ errorMessage: "", playerDetails: { ...this.state.playerDetails, id: "", name: "", email: "", avatar: "" } });
                                this.props.dpShowAddModal(false);
                                toast.success('New player added successfully!', {
                                    position: "top-right",
                                    autoClose: 1000,
                                    hideProgressBar: true,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    });
                            }
                        });
                    }
                }).catch(error => {
                    this.setState({ errorMessage: error.message });
                });
                secondaryApp = await null;
                this.props.dpShowAddModal(false);
            }

        } else {
            var msg = validateResult.error.message.substring(validateResult.error.message);
            this.setState({ errorMessage: msg })
        }
    }

    setDayJoin = async (event) => {
        await this.setState({ dow: { ...this.state.dow, [event.target.name]: event.target.checked } })
        await this.setState({ playerDetails: { ...this.state.playerDetails, dow: this.state.dow } })
    }

    onCloseModal = () => {
        this.setState({ errorMessage: "" });
        this.props.dpShowAddModal(false);
    }

    showAddModal = () => {
        return (
            <Modal show={this.props.stIsShowAddModal} size="sm"
                backdrop="static" >
                <Modal.Body>
                    <div >
                        <h4 className="card-title">Add Players</h4>
                        <div className="form-group">
                            <input type="text" placeholder="Name" className="form-control" name="name" onChange={(event) => this.eventChange(event)} />
                        </div>
                        <div className="form-group">
                            <input type="text" placeholder="Avatar (ID)" className="form-control" name="avatar" onChange={(event) => this.eventChange(event)} />
                        </div>
                        <div className="form-group">
                            <select className="form-control" name="level" onChange={(event) => this.eventChange(event)}>
                                <option>Level</option>
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <input type="text" placeholder="Email" className="form-control" name="email" onChange={(event) => this.eventChange(event)} />
                        </div>
                        <label className="ml-1">Default Day</label>
                        <div className="form-check form-check-inline ml-1">
                            <label className="form-check-label mr-3">
                                <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="2" /> Tue
                                </label>
                            <label className="form-check-label mr-3">
                                <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="4" /> Thu
                                </label>
                            <label className="form-check-label mr-3">
                                <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="6" /> Sat
                                </label>
                        </div>
                        <div className="form-check form-check-inline ml-1">
                            <label className="form-check-label mr-3">
                                <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="1" /> Mon
                                </label>

                            <label className="form-check-label mr-3">
                                <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="3" /> Wed
                                </label>

                            <label className="form-check-label mr-3">
                                <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="5" /> Fri
                                </label>

                            <label className="form-check-label mr-3">
                                <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="7" /> Sun
                                </label>
                        </div>
                        <div className="form-group">
                            <select className="form-control" defaultValue="0" name="isMatchPay" onChange={(event) => this.eventChange(event)}>
                                <option value="0">Monthly Pay</option>
                                <option value="1">Match Pay</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <select className="form-control" defaultValue="0" name="role" onChange={(event) => this.eventChange(event)}>
                                <option value="0">User</option>
                                <option value="1">Admin</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <select className="form-control" name="status" onChange={(event) => this.eventChange(event)}>
                                <option value="1">Active</option>
                                <option value="0">Pending</option>
                                <option value="-1">Banned</option>
                            </select>
                        </div>
                        {this.showErrorMessage(this.state.errorMessage)}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-primary" onClick={() => this.addPlayer()}><i className="fas fa-user-plus"></i> Add</button>
                    <div className="btn btn-secondary" onClick={() => this.onCloseModal()}><i className="fas fa-ban"></i> Close</div>
                </Modal.Footer>
            </Modal>
        );
    }
    render() {
        return (
            <div className="card">
                {this.showAddModal()}
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stPlayerDetails: state.playerDetails,
        stIsShowAddModal: state.isShowAddModal
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        dpShowAddModal: (isShowAddModal) => {
            dispatch({ type: "SHOW_ADD_MODAL", isShowAddModal: isShowAddModal })
        }
    }
}
var reduxConnectExport = connect(mapStateToProps, mapDispatchToProps)(AddPlayer)
export default withFirebase(reduxConnectExport)
