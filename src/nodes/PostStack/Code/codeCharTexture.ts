import { GL_NEAREST } from '../../../gl/constants';
import { glSetTexture, GLTextureFormatStuffR8 } from '../../../gl/glSetTexture';
import { glTextureFilter } from '../../../gl/glTextureFilter';
import { gl } from '../../../globals/canvas';

const charTable = '44404aa000avavau5ekfh842h69m9m44000c222c68886le4el44v440004400v0000004g8421vhlhv64444vgv1vvgvgvhhvggv1vgvv1vhvvggggvhvhvvhvgv0404004044842480v0v024842vhs0400000vhvhhvhfhvv111vfhhhfv1v1vv1f11v1thvhhvhhe444eggghvh979h1111vvllllhjlphvhhhvvhv11vhhpvvhv9hv1vgvv4444hhhhvhhha4llllvha4ahha444v842ve222e1248ge888e4ah000000v48000vhvhhvhfhvv111vfhhhfv1v1vv1f11v1thvhhvhhe444eggghvh979h1111vvllllhjlphvhhhvvhv11vhhpvvhv9hv1vgvv4444hhhhvhhha4llllvha4ahha444v842vc464c4444464c4602l80';
//                 !    "    #    $    %    &    '    (    )    *    +    ,    -    .    /    0    1    2    3    4    5    6    7    8    9    :    ;    <    =    >    ?    @    A    B    C    D    E    F    G    H    I    J    K    L    M    N    O    P    Q    R    S    T    U    V    W    X    Y    Z    [    \    ]    ^    _    `    a    b    c    d    e    f    g    h    i    j    k    l    m    n    o    p    q    r    s    t    u    v    w    x    y    z    {    |    }    ~

export const codeCharTexture = gl.createTexture()!; // 5 * 16

const data = new Uint8Array( 6400 );

let tableHead = 0;
for ( let i = 33; i < 127; i ++ ) {
  if (charTable.length === tableHead){break;}//TODO

  for ( let j = 0; j < 5; j ++ ) {
    const dataHead = (
      5 * ( i % 16 )
      + 400 * ~~( i / 16 )
      + 80 * j
    );

    const c = parseInt( charTable[ tableHead ++ ], 32 );

    for ( let k = 0; k < 5; k ++ ) {
      data[ dataHead + k ] = ( ( c >> k ) & 1 ) * 255;
    }
  }
}

console.log( data );

glSetTexture( codeCharTexture, 80, 80, data, GLTextureFormatStuffR8 );
glTextureFilter( codeCharTexture, GL_NEAREST );
