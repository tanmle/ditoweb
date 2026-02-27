import React, { Component } from 'react';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import { compose } from 'recompose';
import { withNextRouter } from '../../lib/withNextRouter';

class SignUp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            i: 0,
            fullName: '',
            username: '',
            email: '',
            passwordOne: '',
            passwordTwo: '',
            error: null
        };
    }
    onSubmit = () => {

        const { email, passwordOne } = this.state;
        var playerDetails = {
            id: "",
            name: "",
            level: 2,
            email: "",
            role: 0,
            status: 1
        }
        this.props.firebase.doCreateUserWithEmailAndPassword(email, passwordOne).then(authUser => {
            playerDetails.id = authUser.user.uid;
            playerDetails.name = this.state.fullName;
            playerDetails.email = email;


            return this.props.firebase.getRef('players/' + authUser.user.uid).set(playerDetails, (error) => {
                if (error) {
                    this.setState({ ...this.state, error: error.errorMessage })
                } else {
                    this.setState({ ...this.state, error: "", playerDetails: playerDetails })
                }
            });

        }).then(() => {
            this.props.history.push(ROUTES.MAIN)
        }).catch(error => {
            console.log(error);

        });

    }

    onChange = event => {
        this.setState({ [event.target.name]: event.target.value });
    };

    render() {
        return (
            <div className="container">
                <div className="card o-hidden border-0 shadow-lg my-5">
                    <div className="card-body p-0">
                        {/* Nested Row within Card Body */}
                        <div className="row">
                            <div className="col-lg-5 d-none d-lg-block bg-register-image" />
                            <div className="col-lg-7">
                                <div className="p-5">
                                    <div className="text-center">
                                        <h1 className="h4 text-gray-900 mb-4">Create an Account!</h1>
                                    </div>
                                    <div className="user">
                                        <div className="form-group">
                                            <input type="text" className="form-control form-control-user" name="fullName" onChange={this.onChange} placeholder="Your Name" />
                                        </div>
                                        <div className="form-group">
                                            <input type="email" className="form-control form-control-user" name="email" onChange={this.onChange} placeholder="Email Address" />
                                        </div>
                                        <div className="form-group row">
                                            <div className="col-sm-6 mb-3 mb-sm-0">
                                                <input type="password" className="form-control form-control-user" onChange={this.onChange} name="passwordOne" placeholder="Password" />
                                            </div>
                                            <div className="col-sm-6">
                                                <input type="password" className="form-control form-control-user" name="passwordTwo" placeholder="Repeat Password" />
                                            </div>
                                        </div>
                                        <button onClick={() => this.onSubmit()} href="login.html" className="btn btn-primary btn-user btn-block">Register Account</button>
                                        <hr />
                                        <a href="index.html" className="btn btn-google btn-user btn-block">
                                            <i className="fab fa-google fa-fw" /> Register with Google
              </a>
                                        <a href="index.html" className="btn btn-facebook btn-user btn-block">
                                            <i className="fab fa-facebook-f fa-fw" /> Register with Facebook
              </a>
                                    </div>
                                    <hr />
                                    <div className="text-center">
                                        <a className="small" href="forgot-password.html">Forgot Password?</a>
                                    </div>
                                    <div className="text-center">
                                        <a className="small" href="login.html">Already have an account? Login!</a>
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

export default compose(withNextRouter, withFirebase)(SignUp)
