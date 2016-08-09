import {combineReducers as reduxCombineReducers} from 'redux';
import * as types from './constants';
let subscriber;

export const DejaRedux = {
  publishing: false,
  subscribed: false,
  init(address, store) {
    this.address = address;
    this.store = store;
  },
  sendFullState() {
    if (!this.publishing) {
        return;
    }
    this.publisher.send(JSON.stringify({type: types.FULL_STATE, payload: this.store.getState()}));
  },
  register(channel) {
    this.publishing = true;
    this.publisher = new WebSocket(`${this.address}/pub/${channel}/`);
    this.publisher.onopen = () => {
      this.requestSubscriber = new WebSocket(`${this.address}/sub/${channel}-requests/`);
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
  subscribe(channel) {
    this.subscribed = true;
    this.hasInitialState = false;
    this.subscriber = new WebSocket(`${this.address}/sub/${channel}/`);
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
      this.stateRequester = new WebSocket(`${this.address}/pub/${channel}-requests/`);
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
