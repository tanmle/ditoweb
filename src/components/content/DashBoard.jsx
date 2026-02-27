import React, { Component } from 'react';
import MatchRegister from './MatchRegister';
import MatchTeam from './MatchTeam';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { withFirebase } from '../Firebase';
const moment = require('moment');

class DashBoard extends Component {

    constructor(props) {
        super(props);
        this.state = {
            startDate: new Date(),
        }
    }

    handleChange = date => {
        this.setState({
            startDate: date
        });
    };




    render() {
        return (
            <div className="container-fluid">

                {/* Page Heading */}
                <div className="row justify-content-center justify-content-md-start align-items-center">
                        <h1 className="h4 text-gray-800 match-date mr-1">Today</h1> <h1 className="h6 text-gray-600 match-date">{moment(Date.now()).format('ddd, DD MMM')}</h1>
                    </div>
                
                <div className="row">
                    {/* Begin PlayerJoin */}
                    <MatchRegister />
                    {/* End PlayerJoin */}

                    {/* Begin Formation */}
                    <MatchTeam />

                    {/* End Formation */}
                </div>
            </div>
        );


    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser,
        stRegisteredPlayers: state.registeredPlayers,
    }
}


const reduxConnectExport = connect(mapStateToProps)(DashBoard)

export default compose(withFirebase)(reduxConnectExport)