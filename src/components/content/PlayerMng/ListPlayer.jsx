import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withFirebase } from '../../Firebase';
import Modal from 'react-bootstrap/Modal'
import PlayerAvatar from './PlayerAvatar';

class ListPlayer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            filteredPlayers: [],
            players: [
                {
                    id: "",
                    details: {},
                    isShowDelete: ""
                }
            ],
            player: {},
            isShowConfirmModal: false,
            resetEmail: ''
        }
    }

    componentDidMount() {
        this.getPlayers();
    }

    componentWillUnmount() {
        this.props.firebase.getRef('players').off();
    }

    getPlayers = () => {
        var data = this.props.firebase.getRef('players');
        data.on('value', (players) => {
            var arrPlayer = [];
            players.forEach(player => {
                const id = player.key;
                const details = player.val();
                arrPlayer.push({ id, details, isShowDelete: true });
            });

            var countDefault = arrPlayer.filter(fp => {
                var i = 0;
                fp.details.dow && Object.keys(fp.details.dow).forEach(k => {
                    if(fp.details.dow[k] === true ){
                        i++;
                    }
                })
                if(i>0) {return fp} else return null
            }).length;
            this.setState({ players: arrPlayer, filteredPlayers: arrPlayer, countDefault: countDefault })
        })
    }

    filterPlayer = async (event) => {
        var arrTemp = [...this.state.players];
        var results = await arrTemp.filter(arr => this.removeAccents(arr.details.name.toLowerCase()).includes(this.removeAccents(event.target.value.toLowerCase())));
        this.setState({ ...this.state, filteredPlayers: results })
    }

    removeAccents = (str) => {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    getPlayersById = async (id) => {
        var player = this.state.players.filter(player => player.id === id);
        if (player.length > 0) {
            await this.setState({
                player: player[0]
            })
        }
        await this.props.dpGetPlayer(this.state.player);
    }

    deletePlayer = (playerId) => {
        this.props.firebase.getRef('players/' + playerId).remove((error) => {
            (error) ? console.log(error.message) : console.log("Update succesful");
        })
    }

    showHideDelete = (playerId) => {
        const player = { ...this.state.players.filter((player) => player.id === playerId)[0] };
        player.isShowDelete = !player.isShowDelete;
        const players = this.state.players.map((p) => {
            if (p.id === player.id) { return player } else return p
        })
        this.setState({ ...this.state, players })
    }

    showDelete = (playerId) => {
        const { stCurrentUser } = this.props
        const isAdmin = stCurrentUser && stCurrentUser.role === "1"
        if (this.state.players.filter((player) => player.id === playerId)[0].isShowDelete === true) {
            return <div className="btn-group">
                {isAdmin && <div className="btn btn-warning btn-player-action" onClick={() => this.getPlayersById(playerId)}><i className="fas fa-pencil-alt"></i></div>}
            </div>
                ;
        } else {
            return <div className="btn-group" >
                {isAdmin && <div className="btn btn-success" onClick={() => this.deletePlayer(playerId)}><i className="fas fa-check"></i></div>}
                {isAdmin && <div className="btn btn-danger" onClick={() => this.showHideDelete(playerId)}><i className="fas fa-ban"></i></div>}
            </div >
        }
    }

    showEmailModal = (email) => {
        this.setState({
            resetEmail: email,
            isShowConfirmModal: true
        })
    }

    sendEmailReset = async () => {
        this.props.firebase.doPasswordReset(this.state.resetEmail)
            .then(() => {
                this.setState({ resetEmail: '', isShowConfirmModal: false });
            })
            .catch(error => {
                console.log(error.message);
            });
    }

    ConfirmationModal = () => {
        return (
            <Modal show={this.state.isShowConfirmModal} size="sm"
                backdrop="static" >
                <form>
                    <Modal.Header>
                        <Modal.Title>Reset Password</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>Send email to {this.state.resetEmail} ?</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="btn btn-primary" onClick={() => this.sendEmailReset()}><i className="fa fa-paper-plane"></i> Send </div>
                        <div className="btn btn-secondary" onClick={() => this.setState({ isShowConfirmModal: false, resetEmail: '' })}><i className="fas fa-ban"></i> Close</div>
                    </Modal.Footer>
                </form>
            </Modal>

        );
    }

    showPlayers = () => {
        const { stCurrentUser } = this.props
        const isAdmin = stCurrentUser && stCurrentUser.role === "1"

        if (this.state.filteredPlayers.length > 0) {
            var i = 1;
            this.state.filteredPlayers.sort((a, b) =>
              a.details.name < b.details.name ? -1 : 1
            );
            this.state.filteredPlayers.sort((a, b) =>
              a.details.status > b.details.status ? -1 : 1
            );
            return this.state.filteredPlayers.map((player, key) => {
                var dow = player.details.dow;
                var strDow = '';
                if(dow) {
                   Object.keys(dow).forEach(key => {
                       if(dow[key] === true) {strDow = strDow + this.getDayOfWeek(key) + ' '}
                   })
                }
                var sts = "";
                var role = "";
                var rowStyle = "";
                (parseInt(player.details.status) === 1) ? sts = "Active" : sts = "Pending";
                switch (parseInt(player.details.status)) {
                    case 1:
                        sts = "Active"
                        break;
                    case 0:
                        sts = "Pending"
                        break;
                    case -1:
                        sts = "Banned"
                        rowStyle = "bg-gray-800 text-white";
                        break;
                    default:
                        sts = "Pending"
                        break;
                }
                (parseInt(player.details.role) === 1) ? role = "Admin" : role = "User";
                return (
                    <tr key={player.id} className={rowStyle}>
                        <td>{i++}</td>
                        <td>
                            <PlayerAvatar 
                                firebase={this.props.firebase} 
                                playerId={player.id} 
                                avatarValue={player.details.avatar} 
                            />
                        </td>
                        <td>{player.details.name}</td>
                        <td>{player.details.level}</td>
                        <td>{player.details.email}</td>
                        <td>{strDow}</td>
                        <td>{(parseInt(player.details.isMatchPay) === 1) ? <i className="fas fa-check" ></i> : null}</td>
                        <td>{role}</td>
                        <td>{sts}</td>
                        <td>
                            {this.showDelete(player.id)}
                        </td>
                        <td>
                            {isAdmin && <div className="btn btn-info btn-player-action" onClick={() => this.showEmailModal(player.details.email)}><i className="fas fa-mail-bulk"></i></div>}
                        </td>
                    </tr>
                )
            })
        }
    }
    showNoPlayers = () => {
        if (this.state.filteredPlayers.length < 1) { return <h3>No Players Found</h3> }
    }

    getDayOfWeek = (num) => {
        num = parseInt(num);
        switch (num) {
            case 1:
                return "Mon";
            case 2:
                return "Tue";
            case 3:
                return "Wed";
            case 4:
                return "Thu";
            case 5:
                return "Fri";
            case 6:
                return "Sat";
            case 7:
                return "Sun";
            default:
                break;
        }
    }

    render() {
        return (

            <div>
                {this.ConfirmationModal()}
                <div className="btn-group search-group">
                    <input type="text" className="form-control" name="search" onChange={(event) => this.filterPlayer(event)} placeholder="Search for player's name" />

                </div>
                {this.showNoPlayers()}
                <table className="table table-striped table-hover responsive">
                    <thead className="thead-inverse" style={{justifyContent: "center",textAlign: "center"}}>
                        <tr>
                            <th>No</th>
                            <th>Avatar</th>
                            <th>Name</th>
                            <th>Level</th>
                            <th>Email</th>
                            <th>Default ({this.state.countDefault})</th>
                            <th>Match pay</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Edit</th>
                            <th>Reset Pwd</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.showPlayers()
                        }
                    </tbody>
                </table>
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        dpGetPlayer: (player) => {
            dispatch({ type: "GET_PLAYER", player })
        },
        dpListPlayers: (players) => {
            dispatch({ type: "LIST_PLAYER" })
        }

    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stPlayers: state.players,
        stCurrentUser: state.currentUser
    }
}
const reduxConnectExport = connect(mapStateToProps, mapDispatchToProps)(ListPlayer)
export default withFirebase(reduxConnectExport)
