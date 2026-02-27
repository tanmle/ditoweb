import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal'
import { withFirebase } from '../Firebase';
import axios from 'axios';
import ClipLoader from "react-spinners/ClipLoader";
import { Droppable, Draggable, DragDropContext } from '@hello-pangea/dnd';
import { toast } from 'react-toastify'
import PlayerAvatar from './PlayerMng/PlayerAvatar';

const moment = require('moment');

class MatchTeam extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            isDisableSendMail: true,
            isShowConfirmModal: false,
            isShowNotif: false,
            isInitial: this.props.stIsInitialSetTeam,
            players: [],
            total: 0,
            totalTemp: 0,
            yesPlayers: 0,
            team: {
                teamA: {
                    level: 0,
                    players: []
                },
                teamB: {
                    level: 0,
                    players: []
                },
                teamC: {
                    level: 0,
                    players: []
                },
            },
            teamTemp: {
                teamA: {
                    level: 0,
                    players: []
                },
                teamB: {
                    level: 0,
                    players: []
                },
                teamC: {
                    level: 0,
                    players: []
                },
            },
            time: '',
            stadium: '',
            listTeamA: [],
            listTeamB: [],
            listTeamC: [],
            isDragDrop: false,
            gks: [],
        }
    }

    componentDidMount() {
        this.getGKs()
    }

    getGKs() {
        const api = axios.create({
            baseURL: `${process.env.REACT_APP_BACKEND_URL}`,
            headers: {'Accept': 'application/json'}
         })
        api.get('/gks').then(res => {
            const data = res.data || {}
            const keys = Object.keys(data) || []
            const gks = keys.map(key => ({uid: key, date: data[key]})) || []
            this.setState({
                gks
            })
        }).catch(err => console.log(err))
    }

    onChange = async (event) => {
        await this.setState({
            [event.target.name]: event.target.value
        });
    }

    handleDismissNotif = () => {
        setTimeout(() => {
            this.setState({
                isShowNotif: false
            })
        }, 3000)
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.stRegisteredPlayers.length > 0 && nextProps.stTeamTemp !== undefined) {
            return {
                players: [...nextProps.stRegisteredPlayers],
                teamTemp: nextProps.stTeamTemp,
                isLocked: nextProps.stIsLocked,
                isDisableSendMail: nextProps.stIsDisableSendMail,
                ...!prevState.isDragDrop && { listTeamA: (((nextProps.stTeamTemp || {}).teamA || {}).players || [])},
                ...!prevState.isDragDrop && { listTeamB: (((nextProps.stTeamTemp || {}).teamB || {}).players || [])},
                ...!prevState.isDragDrop && { listTeamC: (((nextProps.stTeamTemp || {}).teamC || {}).players || [])}
            }
        }
        return null
    }


    setTeam = () => {
        var teamA = { level: 0, players: [] };
        var teamB = { level: 0, players: [] };
        var teamC = { level: 0, players: [] };
        var rate = 1;
        var sortedPlayers = this.shuffleArray([...this.state.players]);
        (sortedPlayers.length >= 17) ? rate = 2 : rate = 1;
        if(sortedPlayers.length >= 20)
        {
            sortedPlayers.forEach(player => {
                if ((teamA.players.length <= teamB.players.length - rate &&  teamA.players.length <= teamC.players.length) || (teamA.level < teamB.level - 1 && teamA.level < teamC.level - 1)) {
                    teamA.players.push(player);
                    teamA.level = teamA.level + parseInt(player.level);
                } else if((teamB.players.length <= teamA.players.length - rate &&  teamB.players.length <= teamC.players.length) || (teamB.level < teamA.level - 1 && teamB.level < teamC.level - 1)){
                    teamB.players.push(player);
                    teamB.level = teamB.level + parseInt(player.level);
                } else
                {
                    teamC.players.push(player);
                    teamC.level = teamB.level + parseInt(player.level);
                }
            });
            this.props.dpSetTeamTemp({
                teamTemp: {
                    teamA: teamA,
                    teamB: teamB,
                    teamC: teamC
                }
            })
        }
        else
        {
            sortedPlayers.forEach(player => {
                if (teamA.players.length <= teamB.players.length - rate || teamA.level < teamB.level - 1) {
                    teamA.players.push(player);
                    teamA.level = teamA.level + parseInt(player.level);
                } else {
                    teamB.players.push(player);
                    teamB.level = teamB.level + parseInt(player.level);
                }
            });
            this.props.dpSetTeamTemp({
                teamTemp: {
                    teamA: teamA,
                    teamB: teamB
                }
            })
        }
    }

    randomTeam = (players = []) => {
        let rank1 = [], rank2 = [], rank3 = [], rank4 = [], rank5 = [], randomizePlayers = [], teamA = [], teamB = [], teamC = []
        let teamALevel = 0, teamBLevel = 0, teamCLevel = 0
        let playerRank = "1"
        players.forEach(player => {
            playerRank = player.level;
            switch (playerRank) {
                case "2":
                    rank2.push(player);
                break;
                case "3":
                    rank3.push(player);
                break;
                case "4":
                    rank4.push(player);
                break;
                case "5":
                    rank5.push(player);
                break;
                default:
                    rank1.push(player)
                break 
            }
        })

        randomizePlayers.push(...this.shuffleArray(rank5))
        randomizePlayers.push(...this.shuffleArray(rank4))
        randomizePlayers.push(...this.shuffleArray(rank3))
        randomizePlayers.push(...this.shuffleArray(rank2))
        randomizePlayers.push(...this.shuffleArray(rank1))
        if(randomizePlayers.length < 24)
        {
            randomizePlayers.forEach((item, index) => {
                if (index % 2 === 0) {
                    teamA.push(item)
                    teamALevel = teamALevel + parseInt(item.level)
                } else {
                    teamB.push(item)
                    teamBLevel = teamBLevel + parseInt(item.level)
                }
            })
        }
        else {
            var tA = false;
            var tB = false;
            var tC = false;
            randomizePlayers.forEach((item, index) => {
                
                if (!tA && tC) {
                    teamA.push(item)
                    teamALevel = teamALevel + parseInt(item.level)
                    tA = true;
                    tB = false;
                    tC = false;
                } else if(!tB) {
                    teamB.push(item)
                    teamBLevel = teamBLevel + parseInt(item.level)
                    tA = false;
                    tB = true;
                    tC = false;
                }
                else {
                    teamC.push(item)
                    teamCLevel = teamCLevel + parseInt(item.level)
                    tA = false;
                    tB = false;
                    tC = true;
                }
            })
        }
        return {
            teamA,
            teamALevel,
            teamB,
            teamBLevel,
            teamC,
            teamCLevel,
        }
    }  



    saveTeam = async () => {
        const { gks } = this.state
        var teamA = { level: 0, players: [] };
        var teamB = { level: 0, players: [] };
        var teamC = { level: 0, players: [] };
        const teams = this.randomTeam(this.props.stRegisteredPlayers) || {}
        teamA.players = [...teams.teamA] || []
        teamA.level = teams.teamALevel

        teamB.players = [...teams.teamB] || []
        teamB.level = teams.teamBLevel

        teamC.players = [...teams.teamC] || []
        teamC.level = teams.teamCLevel

        var plyA = {}, plyB = {}, plyC = {};
        var sendPlayer = { plyA: [], plyB: [], plyC: [] };//get name for sending mail
        var updatedA = [], updatedB = [], updatedC = [];

        var pNum = 0;
        let gkA = {}
        let gkB = {}
        let gkC = {}

        const defaultDate = '2000-01-01T00:00:00Z';

        function getNextGK(teamPlayers, gkHistory) {
            const historyMap = new Map();
            gkHistory.forEach(record => historyMap.set(record.uid, record.date));

            const merged = teamPlayers.map(player => ({
                uid: player.playerId,
                name: player.name,
                date: historyMap.get(player.playerId) || defaultDate,
            }));

            merged.sort((a, b) => new Date(a.date) - new Date(b.date));
            return merged[0]; // object with uid, name, date
        }
        
        
        // Get GK for team A
        const gkTeamA = getNextGK(teamA.players, gks);
        console.log('gkTeamA', gkTeamA)
        gkA = teamA.players.find(p => p.playerId === gkTeamA.uid);

        // Get GK for team B
        const gkTeamB = getNextGK(teamB.players, gks);
        gkB = teamB.players.find(p => p.playerId === gkTeamB.uid);
        console.log('gkTeamB', gkTeamB)

        // Get GK for team C
        const gkTeamC = getNextGK(teamC.players, gks);
        gkC = teamC.players.find(p => p.playerId === gkTeamC.uid);
        console.log('gkTeamC', gkTeamC)

        var teamATemp = await {...teamA.level, players :[]}
        var teamBTemp = await {...teamB.level, players :[]}
        var teamCTemp = await {...teamC.level, players :[]}
        teamA.players.forEach(pA => {            
            pNum = pNum + 1;
            var plyTemp;
            if(gkA.playerId === pA.playerId) {
                pA = {...pA, GK : true}                
            } else {
                delete pA.GK;                
            }
            plyTemp = { ...pA, team: 'A' };
            teamATemp.players.push(plyTemp)
            updatedA.push(pA);
            if(pA.GK) {
                pA.name = `${pA.name}`
                sendPlayer.plyA.push(pA);
            } else {
                sendPlayer.plyA.push(pA);
            }
        })
        
        teamB.players.forEach(pB => {
            pNum = pNum + 1;
            var plyTemp;

            if(gkB.playerId === pB.playerId) {
                pB = {...pB, GK : true}   
            } else {
                delete pB.GK;                
            }
            
            plyTemp = { ...pB, team: 'B' };
            teamBTemp.players.push(plyTemp)
            updatedB.push(pB);
            if(pB.GK) {
                pB.name = `${pB.name}`
                sendPlayer.plyB.push(pB);
            } else {
                sendPlayer.plyB.push(pB);
            }
        })

        teamC.players.forEach(pC => {
            pNum = pNum + 1;
            var plyTemp;

            if(gkC.playerId === pC.playerId) {
                pC = {...pC, GK : true}   
            } else {
                delete pC.GK;                
            }
            
            plyTemp = { ...pC, team: 'C' };
            teamCTemp.players.push(plyTemp)
            updatedC.push(pC);
            if(pC.GK) {
                pC.name = `${pC.name}`
                sendPlayer.plyC.push(pC);
            } else {
                sendPlayer.plyC.push(pC);
            }
        })

        await this.props.dpSetSendPlayer(sendPlayer);

        var dateId = moment(this.props.stMatchDate, 'ddd ,DD MMM yyyy').format('yyyyMMDD');

        await this.props.firebase.getRef('matches/' + dateId + '/players').update({ ...plyA, ...plyB, ...plyC }, (error) => {
            if (error) { console.log(error.message); } else {
                this.props.dpSetTeamTemp({ teamA: teamATemp, teamB: teamBTemp, teamC: teamCTemp });
                this.props.dpSetTeamTemp({ teamA: teamATemp, teamB: teamBTemp, teamC: teamCTemp });
                this.props.dpSetRegisteredPlayers([...updatedA, ...updatedB, ...updatedC]);
                this.setState({
                    listTeamA: sendPlayer.plyA,
                    listTeamB: sendPlayer.plyB,
                    listTeamC: sendPlayer.plyC,
                })
            }
        })
        
        toast.success('Team set!', {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            });
    }

    shuffleArray = (array) => {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }
    actionButtons = () => {

        if (this.state.players.length > 0) {
            if (this.props.stCurrentUser !== null) {
                if (parseInt(this.props.stCurrentUser.role) === 1) {
                    return <div>
                        <div className="row text-center">
                            <div className="col text-center">
                                <h1 className="h3 text-gray-800">Team</h1>
                            </div>
                        </div>
                        <div className="row text-center">
                            <div className="col-sm-12">
                                <button type="button" id="btnSetTeam" disabled={!this.state.isLocked} className="btn btn-primary btn-sm btn-footer" onClick={() => this.saveTeam()} ><i className="fa fa-refresh"></i>  Set Team</button>
                                <button type="button" onClick={() => this.showEmailModal()} disabled={!this.state.isLocked} className="btn btn-primary btn-sm btn-footer" ><i className="fa fa-paper-plane"></i>  Send Mail</button>
                            </div>
                        </div>
                    </div>
                }
            }
        }
    }

    showEmailModal = () => {
        var configRef = this.props.firebase.getRef('configuration/match');
        configRef.once('value').then(matchSnap => {
            this.setState({
                time: matchSnap.val().time,
                stadium: matchSnap.val().stadium,
                isShowConfirmModal: true
            })
        })
    }

    sendEmail = async () => {
        const { listTeamA, listTeamB, listTeamC  } = this.state
        var config = await this.props.firebase.getRef('configuration').once('value')
        var isUseEmailList = config.val().isUseEmailList;
        var emailList;
        if (isUseEmailList === true) {
            emailList = config.val().emailList.split(';').map(function (item) {
                return item.trim();
            });
        } else emailList = this.props.stEmailList
        let gk1 = {}, gk2 = {}, gk3 = {}
        let plyA = [], plyB = [], plyC = []

        listTeamA.forEach(item => {
            if (item.GK) {
                plyA.push(`${item.name} (GK)`)
                gk1 = { uid: item.playerId, date: new Date() }
            } else {
                plyA.push(item.name)
            }
        })

        listTeamB.forEach(item => {
            if (item.GK) {
                plyB.push(`${item.name} (GK)`)
                gk2 = { uid: item.playerId, date: new Date() }
            } else {
                plyB.push(item.name)
            }
        })

        listTeamC.forEach(item => {
            if (item.GK) {
                plyC.push(`${item.name} (GK)`)
                gk3 = { uid: item.playerId, date: new Date() }
            } else {
                plyC.push(item.name)
            }
        })

        var userInfo = await this.props.firebase.getRef('players/' + this.props.stCurrentUser.uid).once('value').then(sn => { return sn.val() });
        var sendBody = {
            uid: this.props.stCurrentUser.uid,
            rtoken: userInfo.refresh_token,
            emailList,
            date: this.props.stMatchDate,
            time: this.state.time,
            stadium: this.state.stadium,
            players: {
                plyA,
                plyB,
                plyC
            }
        }

        const gks = { data: [gk1, gk2, gk3]}
        this.props.firebase.auth.currentUser.getIdToken(true).then(async token => {
            this.setState({ loading: true })
            const api = axios.create({
                baseURL: `${process.env.REACT_APP_BACKEND_URL}`,
                headers: {'Accept': 'application/json'}
             });
            axios.all([
                api.post('/sendmail', sendBody, {
                    headers:
                    {
                        authorization: token
                    }
                }),
                api.post('/gks', gks)
            ])
            .then(res => {
                this.setState({ 
                    loading: false,
                    isShowConfirmModal: false,
                    isShowNotif: true
                }, this.handleDismissNotif())
            }).catch(err => {
                this.setState({ 
                    loading: false,
                    isShowConfirmModal: false,
                    isShowNotif: true
                }, this.handleDismissNotif())
            })
        })
    }

    TeamA = () => {
        const stCurrentUser = this.props.stCurrentUser || {}
        const isAdmin = stCurrentUser.role === "1"
        let rowPlayer = []
        if (this.props.stTeamTemp !== null && this.props.stTeamTemp !== undefined) {
            const playersA = this.state.listTeamA || []
            if (playersA.length > 0) {
                rowPlayer = playersA.map((player, index) => {
                    return (
                        <Draggable key={player.playerId} draggableId={player.playerId} index={index} isDragDisabled={!isAdmin || player.GK || !this.state.isLocked}>
                            {(provided) => (
                                <div className="row" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                    <div className="col-sm-12">
                                        <div className="card bg-gradient-danger text-white shadow">
                                            <div className="card-body">
                                            <PlayerAvatar 
                                                firebase={this.props.firebase} 
                                                playerId={player.playerId} 
                                                avatarValue={player.avatar}
                                                className="reg-avatar"
                                            />
                                                <i className="fas fa-dog"></i> {player.name} {(player.GK && player.GK === true) ? '(GK)' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Draggable>
                    )
                })
            }

            return rowPlayer;
        }
    }

    TeamB = () => {
        const stCurrentUser = this.props.stCurrentUser || {}
        const isAdmin = stCurrentUser.role === "1"
        var rowPlayer;
        if (this.props.stTeamTemp !== null && this.props.stTeamTemp !== undefined) {
            const playersB = this.state.listTeamB || []
            if (playersB.length > 0) {
                rowPlayer = playersB.map((player, index) => {
                    return (
                        <Draggable key={player.playerId} draggableId={player.playerId} index={index} isDragDisabled={!isAdmin || player.GK || !this.state.isLocked}>
                            {(provided) => (
                                <div className="row" key={player.playerId} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                    <div className="col-sm-12">
                                        <div className="card bg-gradient-success text-white shadow">
                                            <div className="card-body">
                                            <PlayerAvatar 
                                                firebase={this.props.firebase} 
                                                playerId={player.playerId} 
                                                avatarValue={player.avatar}
                                                className="reg-avatar"
                                            />
                                                <i className="fas fa-horse-head"></i> {player.name} {(player.GK && player.GK === true) ? '(GK)' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Draggable>
                    )
                })
            }
            return rowPlayer;
        }
    }

    TeamC = () => {
        const stCurrentUser = this.props.stCurrentUser || {}
        const isAdmin = stCurrentUser.role === "1"
        var rowPlayer;
        if (this.props.stTeamTemp !== null && this.props.stTeamTemp !== undefined) {
            const playersC = this.state.listTeamC || []
            if (playersC.length > 0) {
                rowPlayer = playersC.map((player, index) => {
                    return (
                        <Draggable key={player.playerId} draggableId={player.playerId} index={index} isDragDisabled={!isAdmin || player.GK || !this.state.isLocked}>
                            {(provided) => (
                                <div className="row" key={player.playerId} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                    <div className="col-sm-12">
                                        <div className="card bg-gradient-primary text-white shadow">
                                            <div className="card-body">
                                            <PlayerAvatar 
                                                firebase={this.props.firebase} 
                                                playerId={player.playerId} 
                                                avatarValue={player.avatar}
                                                className="reg-avatar"
                                            />
                                                <i className="fas fa-fish"></i> {player.name} {(player.GK && player.GK === true) ? '(GK)' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Draggable>
                    )
                })
            }
            return rowPlayer;
        }
    }

    showConfirmationModal = () => {
        return (
            <Modal show={this.state.isShowConfirmModal} size="sm"
                backdrop="static" >
                <form>
                    <Modal.Header>
                        <Modal.Title>Confirm Sending Mail!</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div>
                            <div className="form-group">
                                <label htmlFor="time">Time</label>
                                <input type="text" className="form-control" defaultValue={this.state.time} name="time" id="time" onChange={(event) => this.onChange(event)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="stadium" >Stadium</label>
                                <input type="text" className="form-control" defaultValue={this.state.stadium} name="stadium" id="stadium" onChange={(event) => this.onChange(event)} />
                            </div>
                        </div>

                    </Modal.Body>
                    <Modal.Footer>
                        <div className="btn btn-primary" onClick={() => this.sendEmail()}><i className="fa fa-paper-plane"></i> Send <ClipLoader
                            size={15}
                            color={"#123abc"}
                            loading={this.state.loading}
                        /></div>
                        <div className="btn btn-secondary" onClick={() => this.setState({ ...this.state, isShowConfirmModal: false })}><i className="fas fa-ban"></i> Close</div>
                    </Modal.Footer>
                </form>
            </Modal>

        );
    }

    renderSentMailNotif = () => (
        toast.success('📧 Mail sent successfully!', {
            position: "top-right",
            autoClose: 1000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            })
    )
    
    // a little function to help us with reordering the result
    reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    }

    /**
     * Moves an item from one list to another list.
     */
    move = async (source, destination, untouchedDes, untouchedDesId, droppableSource, droppableDestination) => {
        let sourceClone = Array.from(source)
        let destClone = Array.from(destination)
        let untouchedClone = Array.from(untouchedDes)
        const [removed] = sourceClone.splice(droppableSource.index, 1)
        // Update team value
        let player = Object.assign({}, removed)
        if(droppableDestination.droppableId === "teamA")
        {
            player.team = "B"
        } else if(droppableDestination.droppableId === "teamB") 
        {
            player.team = "A"
        }
        else if(droppableDestination.droppableId === "teamC") {
            player.team = "C"
        }
        destClone.splice(droppableDestination.index, 0, player)

        const result = {}
        result[droppableSource.droppableId] = sourceClone
        result[droppableDestination.droppableId] = destClone
        result[untouchedDesId] = untouchedClone

        return result;
    }

    getList = id => {
        if(id === "teamA") 
        {
            return this.state.listTeamA
        }
        else if(id === "teamB") {
            return this.state.listTeamB
        }
        else if(id === "teamC") {
            return this.state.listTeamC
        }
    }

    onDragEnd = async result => {
        const { source, destination } = result
        this.setState({
            isDragDrop: true
        })

        var unTouchID = await "teamAteamBteamC".replace(source.droppableId, "").replace(destination.droppableId, "")

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const items = this.reorder(
                this.getList(source.droppableId),
                source.index,
                destination.index
            );

            if (source.droppableId === 'teamA') {
                this.setState({
                    listTeamA: items
                })
            } else if(source.droppableId === 'teamB') {
                this.setState({
                    listTeamB: items
                })
            }
            else{
                this.setState({
                    listTeamC: items
                })
            }

        } else {
            const result = await this.move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                this.getList(unTouchID), unTouchID,
                source,
                destination
            )

            this.setState({
                listTeamA: result.teamA || [],
                listTeamB: result.teamB || [],
                listTeamC: result.teamC || []
            })
        }
    }
    render() {
        const { isShowNotif } = this.state
        return (
            <div className="col-lg-6">
                {this.showConfirmationModal()}
                {this.actionButtons()}
                
                <div id="team"
                    style={{
                        display: "flex"
                    }}>
                        <DragDropContext onDragEnd={this.onDragEnd}>
                            <div style={{
                                width: (this.state.listTeamC.length > 0) ? "33%" : "50%"
                            }}>
                                <Droppable droppableId="teamA">
                                    {provided => (
                                        <div {...provided.droppableProps} ref={provided.innerRef}>
                                            {this.TeamA()}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                            <div style={{
                                width: (this.state.listTeamC.length > 0) ? "33%" : "50%"
                            }}>
                                <Droppable droppableId="teamB">
                                    {provided => (
                                        <div {...provided.droppableProps} ref={provided.innerRef}>
                                            {this.TeamB()}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                            <div style={{
                                    width: (this.state.listTeamC.length > 0) ? "34%" : "0%"
                                }}>
                                    <Droppable droppableId="teamC">
                                        {provided => (
                                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                                {this.TeamC()}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            
                        </DragDropContext>
                    </div>
                {isShowNotif && this.renderSentMailNotif()}
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        stRegisteredPlayers: state.registeredPlayers,
        stTeamTemp: state.teamTemp,
        stIsLocked: state.isLocked,
        stYesPlayers: state.yesPlayers,
        stIsDisableSendMail: state.isDisableSendMail,
        stCurrentUser: state.currentUser,
        stEmailList: state.emailList,
        stMatchDate: state.matchDate,
        stIsInitialSetTeam: state.isInitialSetTeam,
        stSendPlayer: state.sendPlayer
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        dpDisableSendMail: (isDisableSendMail) => {
            dispatch({ type: "DISABLE_SEND_MAIL", isDisableSendMail: isDisableSendMail })
        },
        dpInitialSetTeam: (isInitialSetTeam) => {
            dispatch({ type: "SET_INITIAL_SET_TEAM", isInitialSetTeam: isInitialSetTeam })
        },
        dpSetRegisteredPlayers: (registeredPlayers) => {
            dispatch({ type: "SET_TEAM", registeredPlayers: registeredPlayers })
        },
        dpSetTeamTemp: (teamTemp) => {
            dispatch({ type: "SET_TEAM_TEMP", teamTemp: teamTemp })
        },
        dpSetSendPlayer: (sendPlayer) => {
            dispatch({ type: "SET_SEND_PLAYER", sendPlayer: sendPlayer })
        },
    }
}

var reduxConnectExport = connect(mapStateToProps, mapDispatchToProps)(MatchTeam);
export default withFirebase(reduxConnectExport)
