var redux = require('redux');

const playerInitialState = {
    player: {
        id: "",
        details: {
            name: "",
            level: "",
            email: "",
            role: "",
            status: "",
        }
    },
    currentUser: null,
    isLocked: false,
    registeredPlayers: [],
    isShowEditModal: false,
    isShowAddModal: false,
    yesPlayers: 0,
    isDisableSendMail: true,
    emailList: [],
    matchDate: '',
    IsInitialSetTeam: true,
    freelancers: null,
    teamTemp: null
}
const playerReducer = (state = playerInitialState, action) => {
    switch (action.type) {
        case "GET_PLAYER":
            return { ...state, player: action.player, isShowEditModal: true };
        case "LIST_PLAYERS":
            return { ...state, players: action.players }
        case "HIDE_EDIT_MODAL":
            return { ...state, isShowEditModal: false }
        case "SHOW_ADD_MODAL":
            return { ...state, isShowAddModal: action.isShowAddModal }
        case "SET_TEAM":
            return { ...state, registeredPlayers: action.registeredPlayers }
        case "SET_TEAM_TEMP":
            return { ...state, teamTemp: action.teamTemp }
        case "SET_FREELANCERS":
            return { ...state, freelancers: action.freelancers }
        case "LOCK_SET_TEAM":
            return { ...state, isLocked: action.isLocked }
        case "DISABLE_SEND_MAIL":
            return { ...state, isDisableSendMail: action.isDisableSendMail }
        case "SET_USER":
            return { ...state, currentUser: action.currentUser }
        case "SET_EMAIL_LIST":
            return { ...state, emailList: action.emailList }
        case "SET_MATCH_DATE":
            return { ...state, matchDate: action.matchDate }
        case "SET_INITIAL_SET_TEAM":
            return { ...state, isInitialSetTeam: action.isInitialSetTeam }
        case "SET_SEND_PLAYER":
            return { ...state, sendPlayer: action.sendPlayer }
        default:
            return state
    }
}


var storeAll = redux.createStore(playerReducer);


export default storeAll;
