export function poll( func: () => boolean, ms = 10 ): Promise<void> {
  return new Promise( ( resolve ) => {
    const a = (): void => {
      if ( func() ) {
        resolve();
        return;
      }

      setTimeout( a, ms );
    };

    setTimeout( a, ms );
  } );
}
