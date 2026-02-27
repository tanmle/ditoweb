import React, { Component } from 'react';
import PageWrapper from './components/content/PageWrapper'
import Login from './components/content/Login';
import * as ROUTES from './constants/routes';
import { withAuthentication } from './components/Session';
import { AuthUserContext } from './components/Session';
import { ToastContainer} from 'react-toastify'
import { withNextRouter } from './lib/withNextRouter';
import { compose } from 'recompose';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const pathname = this.props.location?.pathname || ROUTES.ROOT;
    const isLoginPath = pathname === ROUTES.LOGIN;
    const isMainPath = pathname === ROUTES.ROOT || pathname === ROUTES.MAIN || pathname.startsWith(`${ROUTES.MAIN}/`);

    return (
      <>
      <ToastContainer/>
        <AuthUserContext.Consumer>
          {
            authUser =>
              authUser ? null : (isLoginPath ? <Login {...this.props} /> : null)
          }
        </AuthUserContext.Consumer>
        {isMainPath ? <PageWrapper {...this.props} /> : null}
        <a className="scroll-to-top rounded" href="#page-top">
          <i className="fas fa-angle-up"></i>
        </a>
      </>
    )
  }
}

export default compose(withNextRouter, withAuthentication)(App)
