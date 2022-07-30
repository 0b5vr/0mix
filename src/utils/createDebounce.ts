export function createDebounce(): ( func: () => void ) => void {
  let id: NodeJS.Timeout;

  return ( func: () => void ) => {
    clearTimeout( id );
    id = setTimeout( func, 1 );
  };
}
