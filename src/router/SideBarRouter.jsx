import React, { Component } from 'react';
import DashBoard from '../components/content/DashBoard';
import UserDetails from '../components/content/UserDetails';
import Penanties from '../components/content/Penanties'
import Finance from '../components/content/Finance'
import MatchSettings from '../components/content/MatchSettings'
import PlayerManagement from '../components/content/PlayerManagement'

import * as ROUTES from '../constants/routes';
import { connect } from 'react-redux';
import { withNextRouter } from '../lib/withNextRouter';

class SidebarRouter extends Component {
    normalizePath = (path) => {
        if (!path) {
            return ROUTES.ROOT;
        }

        if (path.length > 1 && path.endsWith('/')) {
            return path.slice(0, -1);
        }

        return path;
    }

    getCurrentPage = () => {
        const currentPath = this.normalizePath(this.props.location?.pathname);

        if (currentPath === ROUTES.ROOT || currentPath === ROUTES.MAIN || currentPath === ROUTES.MATCH) {
            return <DashBoard />;
        }

        if (currentPath === ROUTES.USER_DETAILS) {
            return <UserDetails />;
        }

        if (currentPath === ROUTES.PENANTIES) {
            return <Penanties />;
        }

        if (currentPath === ROUTES.FINANCE) {
            return <Finance />;
        }

        if (currentPath === ROUTES.PLAYER_MNG) {
            return <PlayerManagement />;
        }

        if (currentPath === ROUTES.MATCH_SETTINGS) {
            const isAdmin = this.props.stCurrentUser !== null && parseInt(this.props.stCurrentUser.role, 10) === 1;
            return isAdmin ? <MatchSettings /> : <DashBoard />;
        }

        return <DashBoard />;
    }

    render() {
        return this.getCurrentPage();
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser
    }
}
export default connect(mapStateToProps)(withNextRouter(SidebarRouter));
