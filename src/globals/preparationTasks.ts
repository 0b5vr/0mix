import { notifyObservers } from '@0b5vr/experimental';
import { preparationProgressObservers } from './globalObservers';
import { sleep } from '../utils/sleep';

export const preparationTasks: ( () => Promise<any> )[] = [];

export const prepare = async (): Promise<void> => {
  let completed = 0;

  // Promise.all does not work, tasks must be executed in serial with a sleep
  for ( const task of preparationTasks ) {
    await task();
    completed ++;
    notifyObservers( preparationProgressObservers, completed / preparationTasks.length );
    await sleep( 1 );
  }
};
