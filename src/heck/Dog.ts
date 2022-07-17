import { Component } from './components/Component';
import { MapOfSet } from '../utils/MapOfSet';
import { SceneNode } from './components/SceneNode';
import { Transform } from './Transform';
import { music } from '../globals/music';

/**
 * And what a WONDERFUL Dog they are!!
 */
export class Dog {
  public root: SceneNode;
  public active: boolean;

  private __frameCount = 0;

  public constructor() {
    this.root = new SceneNode();
    this.active = true;

    if ( import.meta.env.DEV ) {
      this.root.name = 'root';
    }
  }

  public update(): void {
    if ( this.active ) {
      this.root.update( {
        frameCount: this.__frameCount ++,
        time: music.time,
        deltaTime: music.deltaTime,
        globalTransform: new Transform(),
        componentsByTag: new MapOfSet(),
        ancestors: [],
        path: '',
      } );
    }

    if ( import.meta.env.DEV ) {
      Component.updateHaveReachedBreakpoint = false;
      Component.drawHaveReachedBreakpoint = false;
    }
  }
}
