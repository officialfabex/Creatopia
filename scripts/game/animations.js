/**
 * animations.js
 *
 * Walk cycle based on exported keyframes from Creatopia Animator.
 * Frame 0  = step right (right leg forward, left leg back)
 * Frame 12 = step left  (left leg forward, right leg back) — mirror of frame 0
 * Frames 6 & 18 = neutral mid-stride (lerp midpoint)
 *
 * Position deltas (px,py,pz) and rotation deltas (rx,ry,rz in degrees)
 * are added on top of the GLB rest pose.
 *
 * LeftHand has negative scale (Blender mirror) — its local X axis is flipped.
 * To get symmetric motion: apply lMirror = -1 to rotation X/Z for left arm.
 * For position, X is also flipped so we negate px for LeftHand.
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const { lerp } = THREE.MathUtils;
const D2R = Math.PI / 180;
const LERP_SPEED = 14;

// Walk cycle — two keyframes (step right, step left).
// The cycle is driven by Math.sin(time) which goes -1 → 0 → +1 → 0 → -1 etc.
// t = sin(time), ranging -1..+1
//   t = +1  →  frame 0 pose  (right leg forward)
//   t = -1  →  frame 12 pose (left leg forward, mirror)
//   t =  0  →  neutral

// From animator frame 0:
const STEP = {
  RightHand: { px: 0.000, py: -0.200, pz: -0.500, rx:  45.00, rz: 0 },
  LeftHand:  { px: 0.000, py:  0.200, pz:  0.500, rx: -45.00, rz: 0 },
  RightLeg:  { px: 0.000, py:  0.000, pz:  0.700, rx: -30.00, rz: 0 },
  LeftLeg:   { px: 0.000, py:  0.000, pz: -0.700, rx:  30.00, rz: 0 },
};

// Capture rest pose once per limb
const REST_CAPTURED = {};

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;
  if (!lAG || !rAG || !lLG || !rLG) return;

  // Detect mirrored left hand
  const lMirror = (lAG.scale && lAG.scale.x < 0) ? -1 : 1;

  // Capture rest pose on first call
  if (!REST_CAPTURED.done) {
    REST_CAPTURED.rAG = { rx: rAG.rotation.x, ry: rAG.rotation.y, rz: rAG.rotation.z, px: rAG.position.x, py: rAG.position.y, pz: rAG.position.z };
    REST_CAPTURED.lAG = { rx: lAG.rotation.x, ry: lAG.rotation.y, rz: lAG.rotation.z, px: lAG.position.x, py: lAG.position.y, pz: lAG.position.z };
    REST_CAPTURED.lLG = { rx: lLG.rotation.x, ry: lLG.rotation.y, rz: lLG.rotation.z, px: lLG.position.x, py: lLG.position.y, pz: lLG.position.z };
    REST_CAPTURED.rLG = { rx: rLG.rotation.x, ry: rLG.rotation.y, rz: rLG.rotation.z, px: rLG.position.x, py: rLG.position.y, pz: rLG.position.z };
    REST_CAPTURED.done = true;
  }

  const rr = REST_CAPTURED.rAG;
  const lr = REST_CAPTURED.lAG;
  const llr = REST_CAPTURED.lLG;
  const rlr = REST_CAPTURED.rLG;

  // sin wave: +1 = step right, -1 = step left
  const t = Math.sin(time);

  // Target deltas — default to zero (idle/jump returns to rest)
  let rAx_d = 0, rAz_d = 0, rApx = 0, rApy = 0, rApz = 0;
  let lAx_d = 0, lAz_d = 0, lApx = 0, lApy = 0, lApz = 0;
  let rLx_d = 0, rLpx = 0, rLpy = 0, rLpz = 0;
  let lLx_d = 0, lLpx = 0, lLpy = 0, lLpz = 0;

  if (state === 'moving') {
    // Right arm: +t → STEP.RightHand, -t → mirror (= STEP.LeftHand values)
    rAx_d  =  STEP.RightHand.rx * t;      // +45 when t=+1, -45 when t=-1
    rApz   =  STEP.RightHand.pz * t;      // arm swings forward/back
    rApy   =  STEP.RightHand.py * t;      // slight vertical movement

    // Left arm: opposite phase (−t)
    // lMirror flips the local axis for the mirrored mesh
    lAx_d  = (STEP.LeftHand.rx * -t) * lMirror;
    lApz   =  STEP.LeftHand.pz * -t * lMirror;
    lApy   =  STEP.LeftHand.py * -t;

    // Right leg: +t → STEP.RightLeg
    rLx_d  =  STEP.RightLeg.rx * t;
    rLpz   =  STEP.RightLeg.pz * t;

    // Left leg: −t (opposite to right leg)
    lLx_d  =  STEP.LeftLeg.rx * -t;
    lLpz   =  STEP.LeftLeg.pz * -t;

  } else if (state === 'jumping') {
    // Arms raise up and spread slightly — no position delta needed
    rAx_d = -50;
    rAz_d = -12;
    lAx_d = -50 * lMirror;
    lAz_d =  12 * lMirror;

    if (isMoving) {
      // Keep legs cycling while jumping and moving
      const sw = Math.sin(time) * 0.5;
      rLx_d = -sw * 30;
      lLx_d =  sw * 30;
    }
  }

  const s = LERP_SPEED * dt;

  // Right arm
  rAG.rotation.x = lerp(rAG.rotation.x, rr.rx + rAx_d * D2R, s);
  rAG.rotation.z = lerp(rAG.rotation.z, rr.rz + rAz_d * D2R, s);
  rAG.position.y = lerp(rAG.position.y, rr.py + rApy, s);
  rAG.position.z = lerp(rAG.position.z, rr.pz + rApz, s);

  // Left arm
  lAG.rotation.x = lerp(lAG.rotation.x, lr.rx + lAx_d * D2R, s);
  lAG.rotation.z = lerp(lAG.rotation.z, lr.rz + lAz_d * D2R, s);
  lAG.position.y = lerp(lAG.position.y, lr.py + lApy, s);
  lAG.position.z = lerp(lAG.position.z, lr.pz + lApz, s);

  // Right leg
  rLG.rotation.x = lerp(rLG.rotation.x, rlr.rx + rLx_d * D2R, s);
  rLG.position.z = lerp(rLG.position.z, rlr.pz + rLpz, s);

  // Left leg
  lLG.rotation.x = lerp(lLG.rotation.x, llr.rx + lLx_d * D2R, s);
  lLG.position.z = lerp(lLG.position.z, llr.pz + lLpz, s);
}
