import { Component } from '../../heck/components/Component';
import { EventType, on } from '../../globals/globalEvent';
import { Lambda } from '../../heck/components/Lambda';
import { SceneNode } from '../../heck/components/SceneNode';
import { getDivComponentLogger } from '../../globals/dom';
import { gui } from '../../globals/gui';

export class ComponentLogger extends SceneNode {
  private __isActive: boolean;
  private __dom: HTMLDivElement;
  private __updateArray: { component: Component, path: string }[];

  public constructor() {
    super();

    this.__isActive = false;

    this.__dom = getDivComponentLogger();
    this.__dom.style.display = 'none';

    this.__updateArray = [];

    this.name = 'ComponentLogger';

    on( EventType.ComponentUpdate, ( { component, path } ) => {
      if ( this.__isActive ) {
        this.__updateArray.push( { component, path } );
      }
    } );

    const lambdaLogger = new Lambda( {
      onUpdate: () => {
        this.__isActive = gui && gui.value( 'ComponentLogger/active', false ) || false;
        this.__dom.style.display = this.__isActive ? 'block' : 'none';

        if ( this.__isActive ) {
          this.__dom.innerHTML = '';

          this.__updateArray.map( ( { component, path } ) => {
            const div = document.createElement( 'div' );
            div.textContent = path;
            div.addEventListener( 'pointerdown', () => console.info( component ) );
            this.__dom.appendChild( div );
          } );

          this.__updateArray = [];
        }
      },
    } );
    lambdaLogger.name = 'lambdaLogger';

    this.children = [
      lambdaLogger,
    ];
  }
}
