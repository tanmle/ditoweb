import React, { Component } from 'react';
import TopBar from './TopBar'
import SideBar from '../navigator/SideBar'
import Footer from '../footer/Footer';
import SideBarRouter from '../../router/SideBarRouter';
import { AuthUserContext, withAuthorization } from '../Session';

const condition = authUser => !!authUser;

class PageWrapper extends Component {
    render() {
        return (
            <AuthUserContext.Consumer>
                {authUser => (
                    <div>
                        <div id="wrapper">
                            <SideBar />
                            <div id="content-wrapper" className="d-flex flex-column">
                                <div id="content">
                                    {/* Topbar */}
                                    <TopBar />
                                    {/* End of Topbar */}
                                    {/* Begin Page Content */}
                                    <SideBarRouter />
                                    {/* End Page Content */}

                                </div>
                                <Footer />
                            </div>

                        </div>
                    </div>
                )}
            </AuthUserContext.Consumer>

        );
    }
}

export default withAuthorization(condition)(PageWrapper);