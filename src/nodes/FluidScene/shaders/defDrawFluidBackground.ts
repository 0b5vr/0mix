import { FluidBackgroundDefDrawType } from '../../utils/shaders/buildPlaneBackgroundFrag';
import { glslLinearstep } from '../../../shaders/modules/glslLinearstep';
import { mul, sw, vec4 } from '../../../shaders/shaderBuilder';

export const defDrawFluidBackground: FluidBackgroundDefDrawType = () => (
  ( _ro, rd ) => {
    const rdy = glslLinearstep( -1.0, 1.0, sw( rd, 'y' ) );
    return vec4( mul( 0.1, rdy ) );
  }
);
