import { Component } from '../components/Component';

export function ancestorsToPath( ancestors: Component[] ): string {
  return '/' + ancestors.map( ( ancestor ) => ancestor.name ?? '(no name)' ).join( '/' );
}
