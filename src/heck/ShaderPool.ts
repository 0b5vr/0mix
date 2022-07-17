import { LazyProgramOptions, glLazyProgram } from '../gl/glLazyProgram';
import { Material } from './Material';

export class ShaderPool<TUser> {
  private __programMap: Map<string, WebGLProgram> = new Map();
  private __ongoingPromises: Map<string, Promise<WebGLProgram>> = new Map();
  private __programUsersMap: Map<WebGLProgram, Set<TUser>> = new Map();

  public async getProgramAsync(
    user: TUser,
    vert: string,
    frag: string,
    options?: LazyProgramOptions
  ): Promise<WebGLProgram> {
    let program = this.__programMap.get( vert + frag );
    if ( !program ) {
      let promise = this.__ongoingPromises.get( vert + frag );
      if ( !promise ) {
        if ( import.meta.env.DEV ) {
          promise = glLazyProgram( vert, frag, options ).catch( ( e ) => {
            console.info( { vert, frag, options } );
            console.error( user );
            throw e;
          } );
        } else {
          promise = glLazyProgram( vert, frag, options );
        }

        promise.then( ( program ) => {
          this.__programMap.set( vert + frag, program );
          this.__ongoingPromises.delete( vert + frag );
        } );
        this.__ongoingPromises.set( vert + frag, promise );
      }

      program = await promise;
    }

    this.__setUser( user, program );

    return program;
  }

  public discardProgram(
    user: TUser,
    vert: string,
    frag: string,
  ): void {
    const program = this.__programMap.get( vert + frag )!;

    this.__deleteUser( user, program );

    if ( this.__countUsers( program ) === 0 ) {
      // gl.deleteProgram( program ); // TODO: what
      this.__programMap.delete( vert + frag );
    }
  }

  private __setUser( user: TUser, program: WebGLProgram ): void {
    let users = this.__programUsersMap.get( program );
    if ( !users ) {
      users = new Set();
      this.__programUsersMap.set( program, users );
    }

    if ( !users.has( user ) ) {
      users.add( user );
    }
  }

  private __deleteUser( user: TUser, program: WebGLProgram ): void {
    const users = this.__programUsersMap.get( program )!;

    if ( !users.has( user ) ) {
      if ( import.meta.env.DEV ) {
        console.warn( 'Attempt to delete an user of the program but the specified user is not an owner' );
      }
    }
    users.delete( user );
  }

  private __countUsers( program: WebGLProgram ): number {
    const users = this.__programUsersMap.get( program )!;
    return users.size;
  }
}

export const SHADERPOOL = new ShaderPool<Material>();
