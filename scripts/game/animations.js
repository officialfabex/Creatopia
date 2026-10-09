/**
 * animations.js
 *
 * Works with pivot groups placed at the shoulder/top of each arm.
 * LeftHand has been flipped 180° in game/index.html so both arms
 * now have the same local orientation.
 * lm = 1 (no mirror correction needed — flip is done at model level).
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const { lerp } = THREE.MathUtils;
const SPEED = 12;

// Walk rotation amplitudes (radians) — from animator frame 0
const W_ARM = 45 * (Math.PI / 180);   // arm swing forward/back
const W_LEG = 30 * (Math.PI / 180);   // leg swing forward/back

// Jump pose
const J_ARM_X = -50 * (Math.PI / 180);
const J_ARM_Z =  12 * (Math.PI / 180);

let rest = null;

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;
  if (!lAG || !rAG || !lLG || !rLG) return;

  // Capture rest pose once — pivot groups start at rotation (0,0,0)
  if (!rest) {
    rest = {
      rAx: rAG.rotation.x, rAz: rAG.rotation.z,
      lAx: lAG.rotation.x, lAz: lAG.rotation.z,
      rLx: rLG.rotation.x,
      lLx: lLG.rotation.x,
    };
  }

  const s = SPEED * dt;
  const t = Math.sin(time); // -1..+1, drives the walk cycle

  let rAx = rest.rAx, rAz = rest.rAz;
  let lAx = rest.lAx, lAz = rest.lAz;
  let rLx = rest.rLx;
  let lLx = rest.lLx;

  if (state === 'moving') {
    // Right arm swings back when t=+1, forward when t=-1
    rAx = rest.rAx + W_ARM * t;
    // Left arm opposite phase
    lAx = rest.lAx - W_ARM * t;

    // Right leg forward when t=+1
    rLx = rest.rLx - W_LEG * t;
    // Left leg opposite
    lLx = rest.lLx + W_LEG * t;

  } else if (state === 'jumping') {
    rAx = rest.rAx + J_ARM_X;
    rAz = rest.rAz - J_ARM_Z;
    lAx = rest.lAx + J_ARM_X;
    lAz = rest.lAz + J_ARM_Z;

    if (isMoving) {
      const sw = Math.sin(time) * 0.5;
      rLx = rest.rLx - W_LEG * sw;
      lLx = rest.lLx + W_LEG * sw;
    }
  }

  rAG.rotation.x = lerp(rAG.rotation.x, rAx, s);
  rAG.rotation.z = lerp(rAG.rotation.z, rAz, s);
  lAG.rotation.x = lerp(lAG.rotation.x, lAx, s);
  lAG.rotation.z = lerp(lAG.rotation.z, lAz, s);
  rLG.rotation.x = lerp(rLG.rotation.x, rLx, s);
  lLG.rotation.x = lerp(lLG.rotation.x, lLx, s);
}
