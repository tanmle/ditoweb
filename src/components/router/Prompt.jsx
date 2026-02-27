import { useEffect } from 'react';
import Router from 'next/router';

const Prompt = ({ when, message }) => {
  useEffect(() => {
    if (!when) {
      return undefined;
    }

    const handleWindowClose = (event) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    const handleBrowseAway = (url) => {
      const leave = window.confirm(message);
      if (!leave) {
        Router.events.emit('routeChangeError');
        throw 'Route change aborted by user.';
      }

      return url;
    };

    window.addEventListener('beforeunload', handleWindowClose);
    Router.events.on('routeChangeStart', handleBrowseAway);

    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
      Router.events.off('routeChangeStart', handleBrowseAway);
    };
  }, [when, message]);

  return null;
};

export default Prompt;
