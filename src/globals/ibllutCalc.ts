import { GL_NEAREST } from '../gl/constants';
import { IBLLUTCalc } from '../nodes/IBLLUTCalc/IBLLUTCalc';
import { glTextureFilter } from '../gl/glTextureFilter';

export const ibllutCalc = new IBLLUTCalc();

export const ibllutTexture = ibllutCalc.swap.i.texture;

glTextureFilter( ibllutCalc.swap.i.texture, GL_NEAREST );
glTextureFilter( ibllutCalc.swap.o.texture, GL_NEAREST );

if ( import.meta.env.DEV ) {
  ibllutCalc.swap.i.name = 'ibllutTexture/swap0';
  ibllutCalc.swap.o.name = 'ibllutTexture/swap1';
}
