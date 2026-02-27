import React, { Component } from 'react';
import { withFirebase } from '../Firebase';
import { compose } from 'recompose';
import * as ROUTES from '../../constants/routes';
import { withNextRouter } from '../../lib/withNextRouter';
const Joi = require('joi-browser');

class Login extends Component {

    constructor(props) {
        super(props);
        this.state = {
            email: '',
            password: '',
            errorMsg: '',
            isDisabled: false
        }
    }


    login = (e) => {
        e.preventDefault();
        const { email, password } = this.state;
        var data = { email: email, password: password };

        const schema = Joi.object().keys({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).max(18).required(),
        })

        const validateResult = Joi.validate(data, schema);
        if (validateResult.error === null) {
            this.setState({isDisabled : true})
            this.props.firebase.doSignInWithEmailAndPassword(email, password)
                .then(() => {
                    this.setState({ email: email });
                    this.props.history.push(ROUTES.MAIN);
                })
                .catch(error => {
                    this.setState({ ...this.state, errorMsg: '* ' + error.message , isDisabled : false});
                });
        } else {
            var msg = validateResult.error.message;
            this.setState({ errorMsg: msg })
        }

    }
    onChange = event => {
        this.setState({ [event.target.name]: event.target.value });
    };

    render() {
        return (
            <div className="row justify-content-center">
                <div className="col-xl-10 col-lg-12 col-md-9">
                    <div className="card o-hidden border-0 shadow-lg my-5">
                        <div className="card-body p-0">
                            {/* Nested Row within Card Body */}
                            <div className="row">
                                <div className="col-lg-5 d-none d-lg-block bg-login-image" />
                                <div className="col-lg-7">
                                    <div className="p-5">
                                        <div className="text-center">
                                            <h1 className="h4 text-gray-900 mb-4">Welcome To DITO!</h1>
                                        </div>
                                        <div className="user">
                                            <form onSubmit={(e) => this.login(e)}>
                                                <div className="form-group">
                                                    <input type="email" disabled={this.state.isDisabled} onChange={this.onChange} className="form-control form-control-user" name="email" aria-describedby="emailHelp" placeholder="Enter Email Address..." />
                                                </div>
                                                <div className="form-group">
                                                    <input type="password" disabled={this.state.isDisabled}  onChange={this.onChange} className="form-control form-control-user" name="password" placeholder="Password" />
                                                </div>
                                                <p className="text-danger ml-2">{this.state.errorMsg}</p>
                                                <div className="form-group">
                                                    <div className="custom-control custom-checkbox small">
                                                        <input type="checkbox" className="custom-control-input" id="customCheck" />
                                                        <label className="custom-control-label" htmlFor="customCheck">Remember Me</label>
                                                    </div>
                                                </div>
                                                <button id="btnLogin" disabled={this.state.isDisabled} type="submit" className="btn btn-primary btn-user btn-block">Login</button>
                                            </form>
                                        </div>
                                        <hr />
                                        <div className="text-center">
                                            <p>Don't have account or forgot password? Contact the administrator <i className="far fa-smile-wink"></i></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default compose(withNextRouter, withFirebase)(Login);
