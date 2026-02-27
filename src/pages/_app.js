import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Provider } from 'react-redux';
import store from '../reducers/store';
import Firebase, { FirebaseContext } from '../components/Firebase';
import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';
import '../components/content/LoadingOverlay.css';
import '../styles/legacy-datepicker.css';

let firebaseApp;

const getFirebaseApp = () => {
  if (!firebaseApp) {
    firebaseApp = new Firebase();
  }

  return firebaseApp;
};

export default function InstatDitoApp({ Component, pageProps }) {
  const [firebase, setFirebase] = useState(null);

  useEffect(() => {
    setFirebase(getFirebaseApp());
  }, []);

  if (!firebase) {
    return null;
  }

  return (
    <>
      <Head>
        <title>DITO - Make DITO great again!</title>
      </Head>
      <FirebaseContext.Provider value={firebase}>
        <Provider store={store}>
          <Component {...pageProps} />
        </Provider>
      </FirebaseContext.Provider>
    </>
  );
}
