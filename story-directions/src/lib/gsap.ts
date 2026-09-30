/* GSAP, registered once. Every file imports gsap from here so the plugins are always in. */

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(useGSAP, CustomEase, DrawSVGPlugin, ScrambleTextPlugin, ScrollToPlugin, ScrollTrigger, SplitText, TextPlugin);

/* Three curves, as GSAP eases. If the product has its own easing tokens, put them here. */
CustomEase.create('story-out', '0.23, 1, 0.32, 1');
CustomEase.create('story-in-out', '0.77, 0, 0.175, 1');
CustomEase.create('story-drawer', '0.32, 0.72, 0, 1');

export { gsap, useGSAP, ScrollTrigger, SplitText };
