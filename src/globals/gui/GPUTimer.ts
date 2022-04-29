import { GL_QUERY_RESULT, GL_QUERY_RESULT_AVAILABLE, GL_TIME_ELAPSED_EXT } from '../../gl/constants';
import { extDisjointTimerQuery, gl } from '../canvas';

export class GPUTimer {
  private __stackTime: Promise<number>[];
  private __currentQuery: WebGLQuery | null;
  private __freeQueries: WebGLQuery[];
  private __loopTasks: Set<() => void>;

  public static isSupported(): boolean {
    return extDisjointTimerQuery != null;
  }

  public constructor() {
    this.__freeQueries = [ ...new Array( 65536 ) ].map( () => gl.createQuery()! );

    this.__currentQuery = null;
    this.__stackTime = [];

    this.__loopTasks = new Set();

    // loop
    const update = (): void => {
      this.update();
      requestAnimationFrame( update );
    };
    update();
  }

  public update(): void {
    for ( const task of this.__loopTasks ) {
      task();
    }
  }

  public async measure( func: () => void ): Promise<number> {
    if ( this.__stackTime.length !== 0 ) {
      gl.endQuery( GL_TIME_ELAPSED_EXT );
      const promiseFinishingPrev = this.__popAndCheck();

      this.__stackTime = this.__stackTime.map( async ( promiseAccum ) => {
        return ( await promiseAccum ) + ( await promiseFinishingPrev );
      } );
    }

    this.__stackTime.push( Promise.resolve( 0.0 ) );

    gl.beginQuery( GL_TIME_ELAPSED_EXT, this.__getFreeQuery() );

    func();

    gl.endQuery( GL_TIME_ELAPSED_EXT );

    const promiseAccum = this.__stackTime.pop()!;
    const promiseThis = this.__popAndCheck();

    if ( this.__stackTime.length !== 0 ) {
      this.__stackTime = this.__stackTime.map( async ( promiseAccum ) => {
        return ( await promiseAccum ) + ( await promiseThis );
      } );

      gl.beginQuery( GL_TIME_ELAPSED_EXT, this.__getFreeQuery() );
    }

    return ( await promiseAccum ) + ( await promiseThis );
  }

  public __getFreeQuery(): WebGLQuery {
    const query = this.__freeQueries.pop();

    if ( query == null ) {
      throw new Error( 'Depleted free queries............' );
    }

    this.__currentQuery = query;
    return query;
  }

  public __popAndCheck(): Promise<number> {
    const query = this.__currentQuery;
    this.__currentQuery = null;

    if ( query == null ) {
      throw new Error( 'Unreachable' );
    }

    return new Promise( ( resolve ) => {
      const task = (): void => {
        const isAvailable = gl.getQueryParameter( query, GL_QUERY_RESULT_AVAILABLE );

        if ( isAvailable ) {
          this.__loopTasks.delete( task );
          resolve( gl.getQueryParameter( query, GL_QUERY_RESULT ) * 0.001 * 0.001 );
          this.__freeQueries.push( query );
        }
      };

      this.__loopTasks.add( task );
    } );
  }
}
