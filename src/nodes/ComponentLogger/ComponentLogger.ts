import { Component } from '../../heck/components/Component';
import { Lambda } from '../../heck/components/Lambda';
import { SceneNode } from '../../heck/components/SceneNode';
import { ancestorsToPath } from '../../heck/utils/ancestorsToPath';
import { componentUpdateObservers } from '../../globals/globalObservers';
import { getDivComponentLogger } from '../../globals/dom';
import { gui } from '../../globals/gui';
import { traverse } from '@0b5vr/experimental';

export class ComponentLogger extends SceneNode {
  private __isActive: boolean;
  private __dom: HTMLDivElement;
  private __updateArray: Component[][];

  public constructor() {
    super();

    this.__isActive = false;

    this.__dom = getDivComponentLogger();
    this.__dom.style.display = 'none';

    this.__updateArray = [];

    this.name = 'ComponentLogger';

    componentUpdateObservers.push( ( { ancestors } ) => {
      if ( this.__isActive ) {
        this.__updateArray.push( ancestors );
      }
    } );

    const lambdaLogger = new Lambda( {
      onUpdate: () => {
        this.__isActive = gui && gui.value( 'ComponentLogger/active', false ) || false;
        this.__dom.style.display = this.__isActive ? 'block' : 'none';

        if ( this.__isActive ) {
          this.__dom.innerHTML = '';

          this.__updateArray.map( ( ancestors ) => {
            const div = document.createElement( 'div' );
            div.textContent = ancestorsToPath( ancestors );
            const component = ancestors[ ancestors.length - 1 ];
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

    // -- set ignoreBreakpoiints -------------------------------------------------------------------
    traverse<Component>( this, ( node ) => {
      node.ignoreBreakpoints = true;

      if ( node instanceof SceneNode ) {
        return node.children;
      } else {
        return [];
      }
    } );
  }
}
