import {DejaRedux} from './index';
import * as types from './constants';

export const publishMiddleware = store => next => action => {
  if (!action.payload || !action.payload.dejaAction) {
    DejaRedux.publishAction(action);
  }
  return next(action);
}

export const replayMiddleware = store => next => action => {
  if (action.type === types.REPLAY_ACTION) {
      action = action.payload.action;
      action.payload = action.payload || {};
      action.payload.dejaAction = true;
  }
  return next(action);
}
