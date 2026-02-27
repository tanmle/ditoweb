import React, { Component } from 'react';
import Link from 'next/link';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes'
import { compose } from 'recompose';
import { connect } from 'react-redux';

class SideBar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isAdmin : false,
            mobileOpen: false
        }
    }
        toggleMobileSidebar = () => {
            this.setState(prev => ({ mobileOpen: !prev.mobileOpen }))
        }
    
    
    static getDerivedStateFromProps(nextProps, prevState) {
        var isAdmin = false;
        if(nextProps.stCurrentUser !== null) {
            isAdmin = parseInt(nextProps.stCurrentUser.role) === 1
            return {isAdmin : isAdmin}
        } else return {...prevState}
        
    }
    
    render() {
        return (
            // {/* Sidebar */ }
            <>
            < button
                className="btn btn-primary d-md-none position-fixed"
                onClick={this.toggleMobileSidebar}
                aria-label={this.state.mobileOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={this.state.mobileOpen}
                style={{ top: 10, left: 10, zIndex: 1050 }}
            >
                <i className={this.state.mobileOpen ? "fas fa-chevron-left" : "fas fa-chevron-right"}></i>
            </button >
            < ul className={"navbar-nav bg-gradient-primary sidebar sidebar-dark accordion " + (this.state.mobileOpen ? "d-block d-md-block" : "d-none d-md-block")} id="accordionSidebar" >
                {/* Sidebar - Brand */}
                < a className="sidebar-brand d-flex align-items-center justify-content-center" href={ROUTES.MAIN} >
                    <div className="sidebar-brand-icon">
                        <img src="/img/dito.png" alt="Dito logo"/>
                    </div>
                    <div className="sidebar-brand-text mx-3">DITO</div>
                </a >
                {/* Divider */}
                < hr className="sidebar-divider my-0" />
                {/* Nav Item - Dashboard */}
                < li className="nav-item active" >
                    <Link className="nav-link" href={ROUTES.MAIN}>
                        <i className="fas fa-fw fa-tachometer-alt" />
                        <span>Match today</span></Link>
                </li >
                {/* Divider */}
                < hr className="sidebar-divider" />
                < div className="sidebar-heading" >
                    Report
        </div >
                {/* Nav Item - Pages Collapse Menu */}
                < li className="nav-item" >
                    <Link className="nav-link collapsed" href={ROUTES.PENANTIES}>
                        <i className="fas fa-sad-tear"></i>
                        <span>Penalties</span>
                    </Link>
                </li >
                < li className="nav-item" >
                    <Link className="nav-link collapsed" href={ROUTES.FINANCE}>
                        <i className="fas fa-money-check-alt"></i>
                        <span>Finance</span>
                    </Link>
                </li >
                {
                    <>
                        < hr className="sidebar-divider" />
                        {/* Heading */}
                        < div className="sidebar-heading" >ADMIN</div >
                        {/* Nav Item - Pages Collapse Menu */}
                        < li className="nav-item" >
                            <Link className="nav-link collapsed" href={ROUTES.PLAYER_MNG}>
                                <i className="fas fa-users"></i>
                                <span>Player Management</span>
                            </Link>
                        </li >
                        {this.state.isAdmin &&< li className="nav-item" >
                            <Link className="nav-link collapsed" href={ROUTES.MATCH_SETTINGS}>
                                <i className="fas fa-fw fa-cog" />
                                <span>Match Settings</span>
                            </Link>
                        </li >}
                    </>
                }

                {/* Divider */}
                < hr className="sidebar-divider" />
                {/* Heading */}
                < div className="sidebar-heading" >
                    Settings
        </div >
                < li className="nav-item" >
                    <Link className="nav-link collapsed" href={ROUTES.USER_DETAILS}>
                        <i className="fas fa-user"></i>
                        <span>User</span>
                    </Link>
                </li >
                < li className="nav-item" >
                    <Link className="nav-link collapsed" href="/login" onClick={() => this.props.firebase.doSignOut()}>
                        <i className="fas fa-sign-out-alt"></i>
                        <span>Log Out</span>
                    </Link>
                </li >
                <div className="text-center">
                    <hr className="sidebar-divider d-none d-md-block" />
                    {/* Sidebar Toggler (Sidebar) */}
                    <div className="text-center d-none d-md-inline">
                        <button className="rounded-circle border-0" id="sidebarToggle" />
                    </div>
                </div>
            </ul >
            </>
            // {/* End of Sidebar */ }
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stCurrentUser: state.currentUser
    }
}

const reduxConnectExport = connect(mapStateToProps)(SideBar)
export default compose(withFirebase)(reduxConnectExport)
