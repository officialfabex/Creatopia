/**
 * animations.js
 *
 * Works with the CreatopiaBody.glb node structure:
 *   RightHand, LeftHand, LeftLeg, RightLeg
 *
 * The nodes rotate around their own origins as exported from Blender.
 * LeftHand is mirrored (negative scale) so its rotation axes are inverted —
 * we negate X and Z for it so the motion looks symmetrical.
 *
 * Usage:
 *   import { applyAnimations } from './animations.js';
 *   applyAnimations(limbs, state, dt, time, isMoving);
 *
 *   limbs = { lAG, rAG, lLG, rLG }  (Three.js Object3D)
 *   state = 'idle' | 'moving' | 'jumping'
 *   dt    = delta time (seconds)
 *   time  = running timer you increment in your loop
 *   isMoving = boolean — whether player is pressing WASD (affects legs in air)
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const lerp = THREE.MathUtils.lerp;
const LERP  = 12;   // lerp speed — feels snappy but not instant

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;
  if (!lAG || !rAG || !lLG || !rLG) return;

  // LeftHand has negative scale (mirrored in Blender) so its local axes are
  // flipped — negate target rotations for it to get symmetric motion.
  const lMirror = lAG.scale.x < 0 ? -1 : 1;

  let rAx = 0, rAz = 0;   // right arm targets
  let lAx = 0, lAz = 0;   // left  arm targets (will be adjusted for mirror)
  let lLx = 0, rLx = 0;   // leg targets

  if (state === 'moving') {
    // Legs alternate forward/back; arms swing opposite to legs
    const swing = Math.sin(time) * 0.65;
    rLx =  swing;
    lLx = -swing;
    rAx = -swing * 0.8;   // right arm opposite right leg
    lAx =  swing * 0.8;   // left  arm opposite left  leg

  } else if (state === 'jumping') {
    // Arms raise upward and spread slightly outward
    rAx = -1.3;
    rAz = -0.3;   // spread right  (+Z = inward for right arm, so -Z = outward)
    lAx = -1.3;
    lAz =  0.3;   // spread left   (will be negated below if mirrored)

    // Legs: keep stepping if moving in air, otherwise straight
    if (isMoving) {
      const swing = Math.sin(time) * 0.4;
      rLx =  swing;
      lLx = -swing;
    }
  }
  // idle: all targets stay 0 → limbs return to rest

  const s = LERP * dt;

  rAG.rotation.x = lerp(rAG.rotation.x,  rAx, s);
  rAG.rotation.z = lerp(rAG.rotation.z,  rAz, s);

  // Apply mirror factor to left arm so motion is symmetric
  lAG.rotation.x = lerp(lAG.rotation.x,  lAx * lMirror, s);
  lAG.rotation.z = lerp(lAG.rotation.z,  lAz * lMirror, s);

  lLG.rotation.x = lerp(lLG.rotation.x,  lLx, s);
  rLG.rotation.x = lerp(rLG.rotation.x,  rLx, s);
}
