import React from 'react';
import { useRouter } from 'next/router';

const normalizePathname = (asPath, fallbackPathname) => {
  if (!asPath) {
    return fallbackPathname || '/';
  }

  const withoutQuery = asPath.split('?')[0].split('#')[0] || '/';
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1);
  }

  return withoutQuery;
};

export const withNextRouter = (WrappedComponent) => {
  const WithNextRouter = (props) => {
    const router = useRouter();
    const pathname = normalizePathname(router.asPath, router.pathname);

    const history = {
      push: (href) => router.push(href),
      replace: (href) => router.replace(href),
    };

    return (
      <WrappedComponent
        {...props}
        router={router}
        history={history}
        location={{ pathname }}
      />
    );
  };

  WithNextRouter.displayName = `withNextRouter(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithNextRouter;
};

export default withNextRouter;
