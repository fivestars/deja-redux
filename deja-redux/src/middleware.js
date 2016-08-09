import {DejaRedux} from './index';

export default store => next => action => {
  DejaRedux.publish(action);
  return next(action);
}
