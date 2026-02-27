import React from 'react';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';
import { connect } from 'react-redux';
import { compose } from 'recompose';

const withAuthentication = Component => {
    class WithAuthentication extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                authUser: null,
            };
        }

        componentDidMount() {
            this.listener = this.props.firebase.auth.onAuthStateChanged(
                authUser => {
                    if (!authUser) {
                        this.setState({ authUser: null });
                        this.props.dpSetUser(null);
                        return;
                    }

                    this.setState({ authUser });
                    this.props.firebase.getRef(`players/${authUser.uid}`).once('value').then((playerSnap) => {
                        const currentUser = {
                            uid: authUser.uid,
                            role: playerSnap.exists() ? playerSnap.val().role : 0,
                        };
                        this.props.dpSetUser(currentUser);
                    });
                },
            );
        }

        componentWillUnmount() {
            this.listener();
        }

        render() {
            return (
                <AuthUserContext.Provider value={this.state.authUser}>
                    <Component {...this.props} />
                </AuthUserContext.Provider>
            );
        }
    }

    const mapDispatchToProps = (dispatch) => ({
        dpSetUser: (currentUser) => dispatch({ type: 'SET_USER', currentUser }),
    });

    return compose(withFirebase, connect(null, mapDispatchToProps))(WithAuthentication);
};

export default withAuthentication;
