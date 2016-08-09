import {DejaRedux} from './index';
import * as types from './constants';

export default store => next => action => {
  if (action.type === types.REPLAY_ACTION) {
      action = action.payload.action;
  } else {
    DejaRedux.publishAction(action);
  }
  return next(action);
}
