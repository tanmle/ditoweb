import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal'
import { withFirebase } from '../../Firebase';

const Joi = require('joi-browser');

class EditPlayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            errorMessage: "",
            id: "",
            name: "",
            level: "",
            email: "",
            isMatchPay: 0,
            status: "",
            avatar: "",
            dow: {},
            playerDetails: {
                id: "",
                name: "",
                level: "",
                email: "",
                dow: {},
                isMatchPay: 0,
                role: "",
                status: "",
                avatar: ""
            }
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.stPlayer.id !== prevState.playerDetails.id) {
            return { ...prevState, ...nextProps.stPlayer.details, playerDetails: { id: nextProps.stPlayer.id, ...nextProps.stPlayer.details } }
        } else return null
    }

    eventChange = async (event) => {
        await this.setState({
            [event.target.name]: event.target.value
        });
        await this.setState({
            playerDetails: {
                id: this.props.stPlayer.id,
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

    updatePlayer = () => {
        var playerDetails = { ...this.state.playerDetails };

        const schema = Joi.object().keys({
            id: Joi.string().required(),
            name: Joi.string().min(2).max(35).required(),
            level: Joi.number().min(1).max(5).required(),
            email: Joi.string().email().required(),
            dow: Joi.object().optional(),
            isMatchPay: Joi.number().min(0).max(1).optional(),
            role: Joi.number().min(0).max(1).required(),
            status: Joi.number().min(-1).max(1).required(),
            isDefaultJoin: Joi.optional(),
            refresh_token: Joi.optional(),
            avatar: Joi.string().allow('').optional()
        })
        const validateResult = Joi.validate(playerDetails, schema);

        if (validateResult.error === null) {
            delete playerDetails.id;
            console.log(playerDetails);
            this.props.firebase.getRef('players/' + this.state.playerDetails.id).update(playerDetails, (error) => {
                if (error) {
                    this.setState({ ...this.state, errorMessage: error.errorMessage })
                } else {
                    this.props.dpHideEditModal();
                    this.setState({ ...this.state, errorMessage: "" })
                }
            })
        } else {
            var msg = validateResult.error.message.substring(validateResult.error.message);
            this.setState({ ...this.state, errorMessage: msg })
        }

    }
    setDayJoin = async (event) => {
        await this.setState({ dow: { ...this.state.dow, [event.target.name]: event.target.checked }})
        await this.setState({playerDetails : {...this.state.playerDetails, dow: this.state.dow}})
    }

    showErrorMessage = (msg) => {
        if (msg !== undefined && msg !== null && msg !== "") {
            return <p className="text-xs text-danger">{msg}</p>
        }
    }

    onCloseModal = () => {
        this.setState({ ...this.state, errorMessage: "" });
        this.props.dpHideEditModal();
    }
    showEditModal = () => {

        return (
            <Modal show={this.props.stIsShowEditModal} size="sm"
                backdrop="static" >
                <form>
                    <Modal.Body>
                        <div>
                            <h4 className="card-title">Edit Players</h4>
                            <div className="form-group">
                                <input type="text" key={this.props.stPlayer.details.name} defaultValue={this.props.stPlayer.details.name} placeholder="Name" className="form-control" name="name" onChange={(event) => this.eventChange(event)} />
                            </div>
                            <div className="form-group">
                                <input type="text" key={this.props.stPlayer.details.avatar} defaultValue={this.props.stPlayer.details.avatar || ""} placeholder="Avatar (ID)" className="form-control" name="avatar" onChange={(event) => this.eventChange(event)} />
                            </div>
                            <div className="form-group">
                                <select className="form-control" key={this.props.stPlayer.details.level} defaultValue={this.props.stPlayer.details.level} name="level" onChange={(event) => this.eventChange(event)}>
                                    <option value="">Level</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <input type="text" key={this.props.stPlayer.details.email} defaultValue={this.props.stPlayer.details.email} placeholder="Email" className="form-control" name="email" onChange={(event) => this.eventChange(event)} />
                            </div>
                            <label className="ml-1">Default Day</label>
                            <div className="form-check form-check-inline ml-1">
                                <label className="form-check-label mr-3">
                                    <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="2" defaultChecked={(this.props.stPlayer.details.dow) ? this.props.stPlayer.details.dow[2] : false} /> Tue
                                </label>
                                <label className="form-check-label mr-3">
                                    <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="4" defaultChecked={(this.props.stPlayer.details.dow) ? this.props.stPlayer.details.dow[4] : false} /> Thu
                                </label>
                                <label className="form-check-label mr-3">
                                    <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="6" defaultChecked={(this.props.stPlayer.details.dow) ? this.props.stPlayer.details.dow[6] : false} /> Sat
                                </label>
                            </div>
                            <div className="form-check form-check-inline ml-1">
                                <label className="form-check-label mr-3">
                                    <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="1" defaultChecked={(this.props.stPlayer.details.dow) ? this.props.stPlayer.details.dow[1] : false} /> Mon
                                </label>

                                <label className="form-check-label mr-3">
                                    <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="3" defaultChecked={(this.props.stPlayer.details.dow) ? this.props.stPlayer.details.dow[3] : false} /> Wed
                                </label>

                                <label className="form-check-label mr-3">
                                    <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="5" defaultChecked={(this.props.stPlayer.details.dow) ? this.props.stPlayer.details.dow[5] : false} /> Fri
                                </label>

                                <label className="form-check-label mr-3">
                                    <input className="form-check-input mr-0" type="checkbox" onChange={(event) => this.setDayJoin(event)} name="7" defaultChecked={(this.props.stPlayer.details.dow) ? this.props.stPlayer.details.dow[7] : false} /> Sun
                                </label>
                            </div>

                            <div className="form-group">
                                <select className="form-control" key={this.props.stPlayer.details.isMatchPay} defaultValue={(this.props.stPlayer.details.isMatchPay) ? this.props.stPlayer.details.isMatchPay : 0} name="isMatchPay" onChange={(event) => this.eventChange(event)}>
                                    <option value="0">Monthly Pay</option>
                                    <option value="1">Match Pay</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <select className="form-control" key={this.props.stPlayer.details.role} defaultValue={this.props.stPlayer.details.role} name="role" onChange={(event) => this.eventChange(event)}>
                                    <option value="0">User</option>
                                    <option value="1">Admin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <select className="form-control" key={this.props.stPlayer.details.status} defaultValue={this.props.stPlayer.details.status} name="status" onChange={(event) => this.eventChange(event)}>
                                    <option value="1">Active</option>
                                    <option value="0">Pending</option>
                                    <option value="-1">Banned</option>
                                </select>
                            </div>
                        </div>
                        {this.showErrorMessage(this.state.errorMessage)}
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="btn btn-primary" onClick={() => this.updatePlayer()}>Update</div>
                        <div className="btn btn-secondary" onClick={() => this.onCloseModal()}>Close</div>
                    </Modal.Footer>
                </form>
            </Modal>

        );

    }
    render() {
        return (
            <div className="card">
                {this.showEditModal()}
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stPlayer: state.player,
        stIsShowEditModal: state.isShowEditModal
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        dpHideEditModal: () => {
            dispatch({ type: "HIDE_EDIT_MODAL" })
        }
    }
}

const reduxConnectExport = connect(mapStateToProps, mapDispatchToProps)(EditPlayer)
export default withFirebase(reduxConnectExport)
