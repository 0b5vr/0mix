import { GLSLExpression, assign, build, def, defInNamed, defOut, defUniformNamed, div, dot, gt, ifThen, insert, main, max, mix, mul, normalize, pow, sqrt, sub, sw, texture, vec2, vec3, vec4 } from '../../../shaders/shaderBuilder';
import { IBLLUT_ITER } from '../../../config';
import { glslSaturate } from '../../../shaders/modules/glslSaturate';
import { sampleGGX } from '../../../shaders/modules/sampleGGX';
import { vGGX } from '../../../shaders/modules/vGGX';

export const iblLutFrag = build( () => {
  insert( 'precision highp float;' );

  const vUv = defInNamed( 'vec2', 'vUv' );

  const fragColor = defOut( 'vec4' );

  const vdc = defUniformNamed( 'float', 'vdc' ); // normal.xyz
  const samples = defUniformNamed( 'float', 'samples' ); // normal.xyz
  const sampler0 = defUniformNamed( 'sampler2D', 'sampler0' ); // position.xyz, depth

  // function geometrySchlickGGX(
  //   roughnessSq: GLSLExpression<'float'>,
  //   dotNV: GLSLExpression<'float'>,
  // ): GLSLExpression<'float'> {
  //   const k = def( 'float', div( roughnessSq, 2.0 ) );

  //   return div(
  //     dotNV,
  //     add( mul( dotNV, sub( 1.0, k ) ), k ),
  //   );
  // }

  // function geometrySmith(
  //   roughnessSq: GLSLExpression<'float'>,
  //   dotNV: GLSLExpression<'float'>,
  //   dotNL: GLSLExpression<'float'>,
  // ): GLSLExpression<'float'> {
  //   const ggxv = geometrySchlickGGX( roughnessSq, dotNV );
  //   const ggxl = geometrySchlickGGX( roughnessSq, dotNL );

  //   return mul( ggxv, ggxl );
  // }

  function integrateBRDF(
    dotNV: GLSLExpression<'float'>,
    roughness: GLSLExpression<'float'>,
  ): GLSLExpression<'vec2'> {
    const V = vec3( sqrt( sub( 1.0, mul( dotNV, dotNV ) ) ), 0.0, dotNV );
    const N = vec3( 0.0, 0.0, 1.0 );

    const Xi = vec2( div( samples, IBLLUT_ITER ), vdc );
    const H = sampleGGX( Xi, N, mul( roughness, roughness ) );
    const L = normalize( sub( mul( 2.0, dot( V, H ), H ), V ) );

    const dotNL = max( sw( L, 'z' ), 0.0 );
    // const dotNH = max( sw( H, 'z' ), 0.0 );
    const dotVH = max( dot( V, H ), 0.0 );

    const result = def( 'vec2', vec2( 0.0 ) );

    ifThen( gt( dotNL, 0.0 ), () => {
      // const G = geometrySmith( mul( roughness, roughness ), dotNV, dotNL );
      // const G_Vis = div( mul( G, dotVH ), mul( dotNH, dotNV ) );
      const Vis = vGGX( mul( roughness, roughness ), dotNV, dotNL );

      const Fc = def( 'float', pow( sub( 1.0, dotVH ), 5.0 ) );

      assign( result, mul( vec2( sub( 1.0, Fc ), Fc ), glslSaturate( Vis ) ) );
    } );

    return result;
  }

  main( () => {
    const tex = sw( texture( sampler0, vUv ), 'xy' );

    const roughness = sw( vUv, 'x' );
    const dotNV = sw( vUv, 'y' );

    const result = mix(
      tex,
      integrateBRDF( dotNV, roughness ),
      div( 1.0, samples ),
    );

    assign( fragColor, vec4( result, 0.0, 1.0 ) );
  } );
} );
