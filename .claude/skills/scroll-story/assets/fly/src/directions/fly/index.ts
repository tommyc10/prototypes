import { createElement } from 'react';
import { MidnightBar } from '../../shared/MidnightBar';
import type { ChromeProps, Direction } from '../../shared/types';
import { FlyStage } from './FlyStage';
import { buildFly } from './timeline';
import './fly.css';

function FlyChrome(p: ChromeProps) {
  return createElement(MidnightBar, {
    ...p,
    readout: [createElement('span', { key: 'l' }, 'depth · tilt'), createElement('b', { key: 'v', className: 'fly-readout' }, '0 · 0°')],
  });
}

export const fly: Direction = {
  id: 'fly',
  name: 'Fly',
  blurb: 'A 3D camera flies through the UI: dolly, orbit, crane',
  className: 'd-fly',
  Stage: FlyStage,
  Chrome: FlyChrome,
  build: buildFly,
};
