export function downloadBlob( blob: Blob, name: string ): void {
  const url = URL.createObjectURL( blob );

  const a = document.createElement( 'a' );
  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL( url );
}
