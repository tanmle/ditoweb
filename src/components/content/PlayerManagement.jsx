import React, { Component } from 'react';
import ListPlayer from './PlayerMng/ListPlayer';
import AddPlayer from './PlayerMng/AddPlayer';
import EditPlayer from './PlayerMng/EditPlayer';
import { connect } from 'react-redux';

class PlayerManagement extends Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
   
    render() {
        const { stCurrentUser } = this.props
        const isAdmin = stCurrentUser && stCurrentUser.role === "1"

        return (
            <div className="container-fluid">
                <div className="card-modal">
                    <AddPlayer />
                    <EditPlayer />
                </div>
                {/* Page Heading */}
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-4">
                            <div className="d-sm-flex align-items-center justify-content-between mb-4">
                                <h1 className="h3 mb-0 text-gray-800">Players Management</h1>
                            </div>
                        </div>
                        {isAdmin &&
                            <div className="col-4 text-right">
                                <div className="form-group">
                                    <div className="btn btn-primary" onClick={() => this.props.dpShowAddModal(true)}><i className="fas fa-user-plus"></i></div>
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <div className="container-fluid">


                    <div className="row scroll-page">
                        {/* begin table */}
                        <div className="col-8">
                            <ListPlayer />
                        </div>
                        {/* end table */}

                        {/* begin action */}
                        <div className="col-4">


                        </div>

                        {/* end action */}
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stIsShowEditModal: state.isShowEditModal,
        stIsShowAddModal : state.isShowAddModal,
        stCurrentUser: state.currentUser
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        dpShowAddModal: (isShowAddModal) => {
            dispatch({ type: "SHOW_ADD_MODAL", isShowAddModal: isShowAddModal })
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PlayerManagement)