export function createPromiseSVGImage( svgContent: string ): Promise<HTMLImageElement> {
  return new Promise( ( resolve ) => {
    const image = new Image();
    image.onload = () => {
      resolve( image );
    };
    image.src = `data:image/svg+xml;charset=utf8,${ encodeURIComponent( svgContent ) }`;
  } );
}
