/**
 * animations.js — rotation-only animation, no position deltas.
 *
 * Position deltas from the animator are ignored here because the model
 * is scaled/translated in-engine, which makes position deltas unpredictable.
 * Pure rotation works correctly regardless of parent scale.
 *
 * Walk values from animator frame 0 (converted to radians):
 *   RightHand rx = +45° = +0.785 rad  (arm swings back)
 *   LeftHand  rx = -45° = -0.785 rad  (arm swings forward)
 *   RightLeg  rx = -30° = -0.524 rad  (leg forward)
 *   LeftLeg   rx = +30° = +0.524 rad  (leg back)
 *
 * sin(time) drives the cycle: +1 = step right, -1 = step left.
 * LeftHand has negative scale.x (Blender mirror) so its local X is flipped —
 * we negate the rotation delta for it.
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const { lerp } = THREE.MathUtils;
const SPEED = 12;

// Walk rotation amplitudes (radians) from animator
const W_ARM_RX = 45 * (Math.PI / 180); // arm swing
const W_LEG_RX = 30 * (Math.PI / 180); // leg swing

// Jump pose
const J_ARM_RX = -55 * (Math.PI / 180);
const J_ARM_RZ =  12 * (Math.PI / 180);

let rest = null;

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;
  if (!lAG || !rAG || !lLG || !rLG) return;

  // Capture rest pose (GLB bind pose rotations) once
  if (!rest) {
    rest = {
      rAx: rAG.rotation.x, rAz: rAG.rotation.z,
      lAx: lAG.rotation.x, lAz: lAG.rotation.z,
      rLx: rLG.rotation.x,
      lLx: lLG.rotation.x,
    };
  }

  // Detect mirrored left hand (negative scale = flipped local X axis)
  const lm = (lAG.scale && lAG.scale.x < 0) ? -1 : 1;

  const s = SPEED * dt;
  const t = Math.sin(time); // -1..+1

  let rAx = rest.rAx, rAz = rest.rAz;
  let lAx = rest.lAx, lAz = rest.lAz;
  let rLx = rest.rLx;
  let lLx = rest.lLx;

  if (state === 'moving') {
    // Right arm: +t = arm back (positive rx in animator = +45°)
    rAx = rest.rAx + W_ARM_RX * t;
    // Left arm: opposite phase; lm flips local X for mirrored mesh
    lAx = rest.lAx + W_ARM_RX * (-t) * lm;
    // Right leg: −t = leg forward (animator rx=-30° when sin=+1)
    rLx = rest.rLx - W_LEG_RX * t;
    // Left leg: opposite
    lLx = rest.lLx + W_LEG_RX * t;

  } else if (state === 'jumping') {
    rAx = rest.rAx + J_ARM_RX;
    rAz = rest.rAz - J_ARM_RZ;
    lAx = rest.lAx + J_ARM_RX * lm;
    lAz = rest.lAz + J_ARM_RZ * lm;

    if (isMoving) {
      const sw = Math.sin(time) * 0.5;
      rLx = rest.rLx - W_LEG_RX * sw;
      lLx = rest.lLx + W_LEG_RX * sw;
    }
  }

  rAG.rotation.x = lerp(rAG.rotation.x, rAx, s);
  rAG.rotation.z = lerp(rAG.rotation.z, rAz, s);
  lAG.rotation.x = lerp(lAG.rotation.x, lAx, s);
  lAG.rotation.z = lerp(lAG.rotation.z, lAz, s);
  rLG.rotation.x = lerp(rLG.rotation.x, rLx, s);
  lLG.rotation.x = lerp(lLG.rotation.x, lLx, s);
}
