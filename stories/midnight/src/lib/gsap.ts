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

/* The dashboard's three curves (see src/styles/base.css at the repo root), as GSAP eases. */
CustomEase.create('mn-out', '0.23, 1, 0.32, 1');
CustomEase.create('mn-in-out', '0.77, 0, 0.175, 1');
CustomEase.create('mn-drawer', '0.32, 0.72, 0, 1');

export { gsap, useGSAP, ScrollTrigger, SplitText };
