# deja-redux

deja-redux is a proof of concept package to replay redux actions between two
(or more) running instances of a redux application. An application instance can
publish its actions so they can be replayed elsewhere, subscribe to another
application instance's actions and replay them, or both publish and subscribe
for multi-instance interaction.

# Websocket-server requirements:

deja-redux requires a websocket server that provides an endpoint to open a
websocket connection that is a subscription to a named channel, and an endpoint
to open a websocket connection that publishes to a named channel. A tornado
server that meets these specifications is included in app.py. If you want to
use the included server simply run

`$ pip install -r requirements.txt`
`$ python app.py`

# Client-side integration

deja-redux provides middleware to both publish actions and subscribe to actions
as well as a root reducer wrapper which allows for an application instance to
sync the full state from another instance. 

## reducer wrapper

In order to synchronize the initial state between applications, the root
reducer must be wrapped by the `wrapRootReducer` function before being passed
to redux's `createStore`. Alternatively deja-redux exposes a `combineReducers`
that can be used in place of redux's `combineReducers`.

```
import {wrapRootReducer} from 'deja-redux';
import rootReducer from './reducers';

const store = createStore(wrapRootReducer(rootReducer), compose(middleware));
```

## Middleware

deja-redux exports two middlewares - a replayMiddleware and a
publishMiddleware. The replayMiddleware should be typically be first in your
middleware list and the publishMiddleware should be last.

NOTE: it's important to be aware of the consequences of replaying actions that
induce side-effects. deja-redux attaches a dejaAction key to every action
payload if it is a replayed action. It is up to any middleware that generate
side-effects that should not be replayed (such as API calls) to ignore actions
that have this key, or deal with them appropriately.

## DejaRedux interface

The `DejaRedux` allows configuration of websocket endpoints and is used to
control whether an application instance is publishing its actions or
subscribing to actions.

```
DejaRedux.init(store, (name) => `ws://localhost:8888/sub/${name}/`, (name) => `ws://localhost:8888/pub/${name}/`);
```

`DejaRedux.init` takes the store, a function that given a channel name returns
a websocket endpoint for subscribing to that name, and function that given a
channel name returns a websocket endpoint where the channel can be published to.

```
DejaRedux.register(pubChannel, requestChannel);
```

`DejaRedux.register` sets up an application instance to publish all of its actions to `pubChannel` and listen on `requestChannel` for requests to send the full state of the application.

```
DejaRedux.subscribe(subChannel, requestChannel);
```

`DejaRedux.subscribe` sets up an application instance to subscribe to all actions on `subChannel` and make an initial request to `requestChannel` for the initial application state.
