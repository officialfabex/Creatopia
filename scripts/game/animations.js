/**
 * animations.js
 *
 * Animates the CreatopiaBody.glb character.
 * Expects charLimbs with pivot Groups properly placed at joints
 * (shoulder for arms, hip for legs) — set up in engine.html.
 *
 * LeftHand in the GLB has negative scale (Blender mirror).
 * We detect this and negate rotations so motion is symmetric.
 *
 * Usage:
 *   import { applyAnimations } from './animations.js';
 *   applyAnimations(limbs, state, dt, time, isMoving);
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const { lerp } = THREE.MathUtils;
const SPEED = 10; // lerp speed

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;
  if (!lAG || !rAG || !lLG || !rLG) return;

  // LeftHand has negative scale in Blender — its local X axis is flipped.
  // Detect by checking if the first mesh child or the node itself has negative scale.x.
  const lMirror = (lAG.scale && lAG.scale.x < 0) ? -1 : 1;

  // Target rotations (radians)
  let rAx=0, lAx=0, rAz=0, lAz=0;
  let rLx=0, lLx=0;

  if (state === 'moving') {
    // Classic walk: legs swing forward/back, opposite arms mirror them
    const swing = Math.sin(time) * 0.6;
    rLx =  swing;
    lLx = -swing;
    rAx = -swing * 0.75;
    lAx =  swing * 0.75;

  } else if (state === 'jumping') {
    // Arms rise upward and spread slightly outward to sides
    rAx = -1.2;
    rAz = -0.28;  // right arm spreads to the right (negative Z in right-arm local)
    lAx = -1.2;
    lAz =  0.28;  // left  arm spreads to the left

    // Legs keep walking rhythm if player is moving horizontally, else neutral
    if (isMoving) {
      const swing = Math.sin(time) * 0.35;
      rLx =  swing;
      lLx = -swing;
    }
  }
  // idle: all targets = 0, limbs smoothly return to rest pose

  const s = SPEED * dt;

  rAG.rotation.x = lerp(rAG.rotation.x,  rAx, s);
  rAG.rotation.z = lerp(rAG.rotation.z,  rAz, s);

  // Apply lMirror so the mirrored left arm rotates symmetrically
  lAG.rotation.x = lerp(lAG.rotation.x,  lAx * lMirror, s);
  lAG.rotation.z = lerp(lAG.rotation.z,  lAz * lMirror, s);

  rLG.rotation.x = lerp(rLG.rotation.x,  rLx, s);
  lLG.rotation.x = lerp(lLG.rotation.x,  lLx, s);
}
