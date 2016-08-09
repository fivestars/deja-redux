import {combineReducers as reduxCombineReducers} from 'redux';
import * as types from './constants';
let subscriber;

export const DejaRedux = {
  publishing: false,
  subscribed: false,
  init(store, makeSubChannel, makePubChannel) {
    this.store = store;
    this.makeSubChannel = makeSubChannel;
    this.makePubChannel = makePubChannel;
  },
  sendFullState() {
    if (!this.publishing) {
        return;
    }
    this.publisher.send(JSON.stringify({type: types.FULL_STATE, payload: this.store.getState()}));
  },
  register(pubChannel, requestChannel) {
    this.publishing = true;
    this.publisher = new WebSocket(this.makePubChannel(pubChannel));
    this.publisher.onopen = () => {
      this.requestSubscriber = new WebSocket(this.makeSubChannel(requestChannel));
      this.requestSubscriber.onmessage = (event) => {
        let action = JSON.parse(event.data);
        if (action.type === types.REQUEST_FULL_STATE) {
          this.sendFullState();
        }
      }
      this.sendFullState();
    }
  },
  publish(message) {
    if (this.publishing) {
      this.publisher.send(JSON.stringify(message));
    }
  },
  unregister() {
    this.requestSubscriber.close();
    this.requestSubscriber = null;
    this.publisher.close();
    this.publisher = null;
    this.publishing = false;
  },
  subscribe(subChannel, requestChannel) {
    this.subscribed = true;
    this.hasInitialState = false;
    this.subscriber = new WebSocket(this.makeSubChannel(subChannel));
    this.subscriber.onmessage = (event) => {
      let action = JSON.parse(event.data);
      if (action.type === types.FULL_STATE) {
          this.hasInitialState = true;
      }
      if (!this.hasInitialState) {
          return;
      }
      this.store.dispatch(action);
    };
    this.subscriber.onopen = () => {
      this.stateRequester = new WebSocket(this.makePubChannel(requestChannel));
      this.stateRequester.onopen = () => {
        this.stateRequester.send(JSON.stringify({
          type: types.REQUEST_FULL_STATE
        }));
        this.stateRequester.close();
        this.stateRequester = null;
      };
    }
  },
  unsubscribe() {
    if (!this.subscribed) {
      return;
    }
    this.subscriber.close();
    this.subscriber = null;
    this.subscribed = false;
  }
};

export const combineReducers = (reducers) => {
  const appReducer = reduxCombineReducers(reducers);
  const rootReducer = (state, action) => {
    if (action.type === types.FULL_STATE) {
      return action.payload;
    }
    return appReducer(state, action);
  };
  return rootReducer;
};

export * from './constants';
export dejaMiddleware from './middleware';
