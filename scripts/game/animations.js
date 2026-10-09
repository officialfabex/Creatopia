/**
 * animations.js — character animation system
 *
 * Usage:
 *   import { applyAnimations } from './animations.js';
 *   applyAnimations(limbs, state, dt, time, isMoving);
 *
 * limbs  — { lAG, rAG, lLG, rLG } — Three.js Object3D references
 *           lAG = left  arm group  (pivot at shoulder)
 *           rAG = right arm group  (pivot at shoulder)
 *           lLG = left  leg group  (pivot at hip)
 *           rLG = right leg group  (pivot at hip)
 *
 * state  — 'idle' | 'moving' | 'jumping'
 * dt     — delta time in seconds
 * time   — running animation timer (you increment it in your loop)
 * isMoving — whether WASD is pressed (affects legs during jump)
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const LERP_SPEED = 12;  // how fast limbs snap to target rotation

// reusable lerp shorthand
const lerp = THREE.MathUtils.lerp;

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;

  let lAx = 0, lAz = 0;   // left  arm X / Z rotation targets
  let rAx = 0, rAz = 0;   // right arm X / Z rotation targets
  let lLx = 0, rLx = 0;   // left / right leg X rotation targets

  if (state === 'moving') {
    // Walk: legs alternate forward/back, arms mirror opposite leg
    const swing = Math.sin(time) * 0.75;
    lLx =  swing;   // left  leg forward
    rLx = -swing;   // right leg back
    lAx = -swing;   // left  arm back  (opposite to left leg)
    rAx =  swing;   // right arm forward

  } else if (state === 'jumping') {
    // Arms: raise up and spread slightly outward
    lAx = -1.4;          // up
    lAz =  0.35;         // spread left
    rAx = -1.4;          // up
    rAz = -0.35;         // spread right

    // Legs: keep walking if moving in air, else neutral (straight down)
    if (isMoving) {
      const swing = Math.sin(time) * 0.5;
      lLx =  swing;
      rLx = -swing;
    }
    // else lLx = rLx = 0  (already default)
  }
  // idle: all targets are 0 — limbs return to rest

  const s = LERP_SPEED * dt;
  lAG.rotation.x = lerp(lAG.rotation.x, lAx, s);
  lAG.rotation.z = lerp(lAG.rotation.z, lAz, s);
  rAG.rotation.x = lerp(rAG.rotation.x, rAx, s);
  rAG.rotation.z = lerp(rAG.rotation.z, rAz, s);
  lLG.rotation.x = lerp(lLG.rotation.x, lLx, s);
  rLG.rotation.x = lerp(rLG.rotation.x, rLx, s);
}
