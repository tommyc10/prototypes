import { MidnightBar } from '../../shared/MidnightBar';
import type { Direction } from '../../shared/types';
import { SnapStage } from './SnapStage';
import { buildSnap } from './timeline';
import './snap.css';

export const snap: Direction = {
  id: 'snap',
  name: 'Snap',
  blurb: 'Each flick of the scroll plays one move; the layout does the travelling',
  className: 'd-snap',
  snap: true,
  Stage: SnapStage,
  Chrome: MidnightBar,
  build: buildSnap,
};
