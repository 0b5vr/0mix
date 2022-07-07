import { getDivComponentLogger } from '../../globals/dom';
import { EventType, on } from '../../globals/globalEvent';
import { gui } from '../../globals/gui';
import { Lambda } from '../../heck/components/Lambda';
import { SceneNode } from '../../heck/components/SceneNode';

export class ComponentLogger extends SceneNode {
  private __isActive: boolean;
  private __dom: HTMLDivElement;
  private __updateArray: string[];

  public constructor() {
    super();

    this.__isActive = false;

    this.__dom = getDivComponentLogger();
    this.__dom.style.display = 'none';

    this.__updateArray = [];

    this.name = 'ComponentLogger';

    on( EventType.ComponentUpdate, ( string ) => {
      if ( this.__isActive ) {
        this.__updateArray.push( string );
      }
    } );

    const lambdaLogger = new Lambda( {
      onUpdate: () => {
        this.__isActive = gui && gui.value( 'ComponentLogger/active', false ) || false;
        this.__dom.style.display = this.__isActive ? 'block' : 'none';

        if ( this.__isActive ) {
          this.__dom.textContent = this.__updateArray.join( '\n' );
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
