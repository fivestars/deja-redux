import {DejaRedux} from './index';
import * as types form './constants';

export default store => next => action => {
  if (action.type === types.REPLAY_ACTION) {
      action = action.payload;
  } else {
    DejaRedux.publish(action);
  }
  return next(action);
}
