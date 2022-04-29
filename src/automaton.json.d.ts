import type { SerializedAutomatonWithGUI } from '@0b5vr/automaton-with-gui';

declare module './automaton.json' {
  const data: SerializedAutomatonWithGUI;
  export default data;
}
