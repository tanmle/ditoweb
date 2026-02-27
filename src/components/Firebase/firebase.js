import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';

// Your web app's Firebase configuration
var config = {
    apiKey: process.env.NEXT_PUBLIC_apiKey || process.env.REACT_APP_apiKey,
    authDomain: process.env.NEXT_PUBLIC_authDomain || process.env.REACT_APP_authDomain,
    databaseURL: process.env.NEXT_PUBLIC_databaseURL || process.env.REACT_APP_databaseURL,
    projectId: process.env.NEXT_PUBLIC_projectId || process.env.REACT_APP_projectId,
    storageBucket: process.env.NEXT_PUBLIC_storageBucket || process.env.REACT_APP_storageBucket,
    messagingSenderId: process.env.NEXT_PUBLIC_messagingSenderId || process.env.REACT_APP_messagingSenderId,
    appId: process.env.NEXT_PUBLIC_appId || process.env.REACT_APP_appId,
    measurementId: process.env.NEXT_PUBLIC_measurementId || process.env.REACT_APP_measurementId
};

class Firebase {
    constructor() {
        !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();
        this.auth = firebase.app().auth();
        this.db = firebase.app().database();
        this.storage = firebase.app().storage();
    }

    doCreateUserWithEmailAndPassword = (email, password) =>
        this.auth.createUserWithEmailAndPassword(email, password);

    doSignInWithEmailAndPassword = (email, password) =>
        this.auth.signInWithEmailAndPassword(email, password);

    doSignOut = () => this.auth.signOut();

    doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

    doPasswordUpdate = password => this.auth.currentUser.updatePassword(password);

    getRef = (path) => this.db.ref(path);

    getStorage = () => this.storage;

}
export default Firebase;
