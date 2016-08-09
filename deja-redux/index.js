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
  publishTo(channel) {
    this.publishing = true;
    this.publisher = new WebSocket(`${this.address}/pub/${channel}/`);
    this.publisher.onmessage = (event) => {
      let action = JSON.parse(event.data);
      if (action.type === types.REQUEST_FULL_STATE) {
        this.publisher.send(JSON.stringify({type: types.FULL_STATE, payload: this.store.getState()}));
      }
    }
  },
  publish(message) {
    if (this.publishing) {
      this.publisher.send(JSON.stringify(message));
    }
  },
  subscribe(channel) {
    this.subscribed = true;
    this.subscriber = new WebSocket(`${this.address}/sub/${channel}/`);
    this.subscriber.onopen = () => {
      this.subscriber.send(JSON.stringify({
        type: types.REQUEST_FULL_STATE
      }));
    };
    this.subscriber.onmessage = (event) => {
      let action = JSON.parse(event.data);
      this.store.dispatch(action);
    };
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
