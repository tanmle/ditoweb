import React, { Component } from 'react';
import Prompt from '../router/Prompt'
import { connect } from 'react-redux';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import { toast } from 'react-toastify'
const Joi = require('joi-browser');

class MatchSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            errorMessage: "",
            settings: {
                finance: {
                    match_fee: 0,
                    monthly_fee: 0,
                    penalty: {
                        Absense: 0,
                        LackPlayer: 0,
                        Late10: 0,
                        Late5: 0,
                        NoReg: 0,
                        Custom: 0
                    }
                },
                match: {
                    stadium: "none",
                    time: '00:00'
                },
                emailList : "",
                isUseEmailList : false,
            },
            isChange: false
        }
    }

    componentDidMount() {
        this.getSettings();
    }

    componentDidUpdate = () => {
        if (this.state.isChange === true) {
            window.onbeforeunload = () => true
        } else {
            window.onbeforeunload = undefined
        }
    }

    getSettings = () => {
        this.props.firebase.getRef('configuration').once('value', async snap => {
            this.setState({
                settings: snap.val(),
                match_fee: snap.val().finance.match_fee,
                monthly_fee: snap.val().finance.monthly_fee,
                Absense: snap.val().finance.penalty.Absense,
                LackPlayer: snap.val().finance.penalty.LackPlayer,
                Late10: snap.val().finance.penalty.Late10,
                Late5: snap.val().finance.penalty.Late5,
                NoReg: snap.val().finance.penalty.NoReg,
                Custom: snap.val().finance.penalty.Custom,
                stadium: snap.val().match.stadium,
                time: snap.val().match.time,
                emailList: snap.val().emailList,
                isUseEmailList : snap.val().isUseEmailList
            });
        })
    }

    onCheckEmail = async (event) => {
        await this.setState({
            isUseEmailList: event.target.checked,
            isChange: true,
        });
    }
    onChange = async (event) => {
        await this.setState({
            [event.target.name]: event.target.value,
            isChange: true,
        });
    }
    saveSettings = async () => {
        var data = {
            finance: {
                match_fee: this.state.match_fee,
                monthly_fee: this.state.monthly_fee,
                penalty: {
                    Absense: this.state.Absense,
                    LackPlayer: this.state.LackPlayer,
                    Late10: this.state.Late10,
                    Late5: this.state.Late5,
                    NoReg: this.state.NoReg,
                    Custom: this.state.Custom
                }
            },
            match: {
                stadium: this.state.stadium,
                time: this.state.time
            },
            emailList : this.state.emailList,
            isUseEmailList : this.state.isUseEmailList
        }
        await this.setState({
            settings: data
        });
        const schema = Joi.object().keys({
            finance: {
                match_fee: Joi.number().min(0).max(1000).required(),
                monthly_fee: Joi.number().min(0).max(1000).required(),
                penalty: {
                    Absense: Joi.number().min(0).max(1000).required(),
                    LackPlayer: Joi.number().min(0).max(1000).required(),
                    Late10: Joi.number().min(0).max(1000).required(),
                    Late5: Joi.number().min(0).max(1000).required(),
                    NoReg: Joi.number().min(0).max(1000).required(),
                    Custom: Joi.number().min(0).max(1000).required()
                }
            },
            match: {
                stadium: Joi.string().min(2).max(35).required(),
                time: Joi.string().min(2).max(10).required()
            },
            emailList : Joi.string().optional(),
            isUseEmailList : Joi.boolean().optional()
        })
        const validateResult = Joi.validate(data, schema);
        
        if (validateResult.error === null) {
            await this.props.firebase.getRef('configuration').update(this.state.settings, (error) => {
                if (error) {
                    console.log(error);
                } else {
                    this.setState({ isChange: false, errorMessage: "" })
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
        } else {
            var msg = validateResult.error.message.substring(validateResult.error.message);
            this.setState({ ...this.state, errorMessage: msg })
        }
    }

    showErrorMessage = (msg) => {
        if (msg !== undefined && msg !== null && msg !== "") {
            return <p className="text-xs text-danger">{msg}</p>
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
                        <h1 className="h3 mb-0 text-gray-800">Match Settings</h1>
                    </div>

                    {/* match settings */}
                    <div className="d-sm-flex align-items-center justify-content-between mb-3">
                        <h1 className="h5 mb-0 text-gray-800">Match</h1>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-1">
                            <label>Stadium</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="text" className="form-control-match" onChange={(event) => this.onChange(event)} name="stadium" key={this.state.settings.match.stadium} defaultValue={this.state.settings.match.stadium} />
                        </div>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-1">
                            <label>Time</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="text" className="form-control-match" onChange={(event) => this.onChange(event)} name="time" key={this.state.settings.match.time} defaultValue={this.state.settings.match.time} />
                        </div>
                    </div>
                    <hr />

                    {/* Finance match settings */}
                    <div className="d-sm-flex align-items-center justify-content-between mb-3">
                        <h1 className="h5 mb-0 text-gray-800">Match Fee</h1>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2">
                            <label>Match fee</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="number" className="form-control-match-number" onChange={(event) => this.onChange(event)} name="match_fee" key={this.state.settings.finance.match_fee} defaultValue={this.state.settings.finance.match_fee} />
                        </div>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2">
                            <label>Monthly fee</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="number" className="form-control-match-number" onChange={(event) => this.onChange(event)} name="monthly_fee" key={this.state.settings.finance.monthly_fee} defaultValue={this.state.settings.finance.monthly_fee} />
                        </div>
                    </div>
                    <hr />

                    {/* Finance penalty */}
                    <div className="d-sm-flex align-items-center justify-content-between mb-3">
                        <h1 className="h5 mb-0 text-gray-800">Penalty</h1>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2">
                            <label>Absense</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="number" className="form-control-match-number" onChange={(event) => this.onChange(event)} name="Absense" key={this.state.settings.finance.penalty.Absense} defaultValue={this.state.settings.finance.penalty.Absense} />
                        </div>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2">
                            <label>Late 5</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="number" className="form-control-match-number" onChange={(event) => this.onChange(event)} name="Late5" key={this.state.settings.finance.penalty.Late5} defaultValue={this.state.settings.finance.penalty.Late5} />
                        </div>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2">
                            <label>Late 10</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="number" className="form-control-match-number" onChange={(event) => this.onChange(event)} name="Late10" key={this.state.settings.finance.penalty.Late10} defaultValue={this.state.settings.finance.penalty.Late10} />
                        </div>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2">
                            <label>Lack Player</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="number" className="form-control-match-number" onChange={(event) => this.onChange(event)} name="LackPlayer" key={this.state.settings.finance.penalty.LackPlayer} defaultValue={this.state.settings.finance.penalty.LackPlayer} />
                        </div>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2">
                            <label>No Register</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="number" className="form-control-match-number" onChange={(event) => this.onChange(event)} name="NoReg" key={this.state.settings.finance.penalty.NoReg} defaultValue={this.state.settings.finance.penalty.NoReg} />
                        </div>
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2">
                            <label>Custom</label>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">
                            <input type="number" className="form-control-match-number" onChange={(event) => this.onChange(event)} name="Custom" key={this.state.settings.finance.penalty.Custom} defaultValue={this.state.settings.finance.penalty.Custom} />
                        </div>
                    </div>
                    <hr />
                    
                    <div className="d-sm-flex align-items-center justify-content-between mb-3">
                        <h1 className="h5 mb-0 text-gray-800">Email List</h1>
                    </div>
                    <div className="form-check ml-3 mb-1">
                        <label className="form-check-label">
                            <input type="checkbox" className="form-check-input" name="isUseEmailList" onChange={(event) => this.onCheckEmail(event)} key={this.state.settings.isUseEmailList} defaultChecked={this.state.settings.isUseEmailList} />
                            Use this list when sending email?
                        </label>
                    </div>

                    <div className="row ml-1">
                        <div className="col-lg-4 col-md-6 col-sm-12">
                            <textarea className="form-control emailList" onChange={(event) => this.onChange(event)} name="emailList" key={this.state.settings.emailList} defaultValue={this.state.settings.emailList} />
                        </div>
                    </div>
                    <hr />
                    <div className="row">
                        {this.showErrorMessage(this.state.errorMessage)}
                    </div>
                    <div className="row ml-1">
                        <div className="col-lg-2 text-right">
                            <button type="button" disabled={!this.state.isChange} onClick={() => this.saveSettings()} className="btn btn-primary"><i className="fas fa-save"></i> Save</button>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-8">

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


const reduxConnectExport = connect(mapStateToProps)(MatchSettings)
export default compose(withFirebase)(reduxConnectExport)
