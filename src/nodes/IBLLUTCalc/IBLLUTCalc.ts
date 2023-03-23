import { Accumulator } from '../common/Accumulator';
import { IBLLUT_ITER, IBLLUT_SIZE } from '../../config';
import { Lambda } from '../../heck/components/Lambda';
import { iblLutFrag } from './shaders/iblLutFrag';
import { vdc } from '../../utils/vdc';

export class IBLLUTCalc extends Accumulator {
  public constructor() {
    super( {
      width: IBLLUT_SIZE,
      height: IBLLUT_SIZE,
      frag: iblLutFrag,
      iter: IBLLUT_ITER,
    } );

    // -- vdc setter -------------------------------------------------------------------------------
    const vdcSetter = new Lambda( {
      onUpdate: () => {
        this.material.addUniform( 'vdc', '1f', vdc( this.samples, 2.0 ) );
      },
    } );

    if ( import.meta.env.DEV ) {
      vdcSetter.name = 'vdcSetter';
    }

    this.children.unshift( vdcSetter );
  }
}
