import { createElement } from 'react';
import { MidnightBar } from '../../shared/MidnightBar';
import type { ChromeProps, Direction } from '../../shared/types';
import { buildZoom } from './timeline';
import { ZoomStage } from './ZoomStage';
import './zoom.css';

function ZoomChrome(p: ChromeProps) {
  return createElement(MidnightBar, {
    ...p,
    readout: [createElement('span', { key: 'l' }, 'zoom'), createElement('b', { key: 'v', className: 'z-zoom' }, '×1.0')],
  });
}

export const zoom: Direction = {
  id: 'zoom',
  name: 'Zoom',
  blurb: 'Scroll into the app, again and again: board → group → alert → rule → board',
  className: 'd-zoom',
  Stage: ZoomStage,
  Chrome: ZoomChrome,
  build: buildZoom,
};
