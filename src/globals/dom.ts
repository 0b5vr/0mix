function getElement<T extends HTMLElement>(
  id: string,
  tagName: string,
  style: { [ key: string ]: string },
  hook?: ( el: T ) => void,
): T {
  let el = document.getElementById( id ) as T;
  if ( el ) {
    return el;
  }

  el = document.createElement( tagName ) as T;
  el.id = id;

  document.body.appendChild( el );

  Object.assign( el.style, style );

  hook?.( el );

  return el;
}

export function getCheckboxActive(): HTMLInputElement {
  return getElement<HTMLInputElement>(
    'checkboxActive',
    'input',
    {
      position: 'fixed',
      left: '8px',
      bottom: '248px',
    },
    ( el ) => {
      el.type = 'checkbox';
      el.checked = true;
    },
  );
}

export function getDivCanvasContainer(): HTMLDivElement {
  return getElement<HTMLDivElement>(
    'divCanvasContainer',
    'div',
    {
      position: 'fixed',
      width: '100%',
      height: 'calc( 100% - 240px )',
      left: '0',
      top: '0',
      display: 'flex',
    },
  );
}

export function getDivAutomaton(): HTMLDivElement {
  return getElement<HTMLDivElement>(
    'divAutomaton',
    'div',
    {
      position: 'fixed',
      width: '100%',
      height: '240px',
      right: '0',
      bottom: '0',
    },
  );
}

export function getDivComponentLogger(): HTMLDivElement {
  return getElement<HTMLDivElement>(
    'divComponentLogger',
    'div',
    {
      position: 'absolute',
      left: '0',
      top: '0',
      color: '#fff',
      whiteSpace: 'pre',
      font: '500 10px Wt-Position',
      textShadow: '-1px -1px #000, -1px 1px #000, 1px -1px #000, 1px 1px #000',
    },
  );
}
