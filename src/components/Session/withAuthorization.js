import React from 'react';
import { compose } from 'recompose';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import AuthUserContext from './context';
import { connect } from 'react-redux';
import { withNextRouter } from '../../lib/withNextRouter';

const withAuthorization = condition => Component => {
    class WithAuthorization extends React.Component {
        constructor(props) {
            super(props)
            this.state = {
                currentUser: null
            }
        }
        componentDidMount() {
            this.listener = this.props.firebase.auth.onAuthStateChanged(
                authUser => {
                    if (!condition(authUser)) {
                        this.setState({ currentUser: null })
                        this.props.dpSetUser(null)
                        this.props.history.push(ROUTES.LOGIN);
                    } else {
                        this.props.firebase.getRef('players/' + authUser.uid).once('value').then(playerSnap => {
                            const currentUser = {
                                uid: authUser.uid,
                                role: playerSnap.exists() ? playerSnap.val().role : 0,
                            };
                            this.setState({ currentUser })
                            this.props.dpSetUser(currentUser);
                        })

                    }
                },
            );
        }
        componentWillUnmount() {
            this.listener();
        }
        render() {
            return <AuthUserContext.Consumer>
                {authUser =>
                    condition(authUser) ? <Component {...this.props} currentUser={this.state.currentUser} /> : null
                }
            </AuthUserContext.Consumer>
        }
    }
    const mapDispatchToProps = (dispatch, ownProps) => {
        return {
            dpSetUser: (currentUser) => {
                dispatch({ type: "SET_USER", currentUser: currentUser })
            }
        }
    }

    const mapStateToProps = (state, ownProps) => {
        return {
            stCurrentUser: state.currentUser
        }
    }

    // const reduxConnectExport = 
    const comp = compose(
        withNextRouter,
        withFirebase
    )(WithAuthorization);
    return connect(mapStateToProps, mapDispatchToProps)(comp)
};




export default withAuthorization
