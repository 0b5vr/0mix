import { MinifyOptions } from 'terser';
import { domprops } from './domprops';

export const terserMinifyOptions: MinifyOptions = {
  compress: {
    arguments: true,
    booleans_as_integers: true,
    drop_console: true,
    keep_fargs: false,
    passes: 2,
    unsafe_arrows: true,
    unsafe_math: true,
    unsafe_symbols: true,
  },
  mangle: {
    properties: {
      builtins: true,
      regex: /.+/,
      keep_quoted: true,
      reserved: [
        // material tags
        'forward',
        'deferred',
        'depth',

        // dom props
        ...domprops,
      ],
    },
  },
  format: {
    ascii_only: true,
    comments: false,
  },
  module: true,
  toplevel: true,
};
