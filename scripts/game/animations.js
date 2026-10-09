/**
 * animations.js
 *
 * Applies walk/jump animations to CreatopiaBody.glb nodes.
 *
 * Strategy: capture the GLB rest pose once, then lerp toward
 * (rest + delta) where delta comes from the animator export.
 *
 * Walk cycle is driven by sin(time):
 *   sin = +1  →  frame 0 from animator  (step right)
 *   sin = -1  →  mirrored frame          (step left)
 *   sin =  0  →  rest pose               (mid-stride)
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const { lerp } = THREE.MathUtils;
const D2R = Math.PI / 180;
const SPEED = 12;

// From animator frame 0 — ROTATION deltas (degrees) and POSITION deltas
// These are the values you want ON TOP of rest pose when sin(t)=+1
const WALK = {
  rArm: { rx:  45, pz: -0.5, py: -0.2 },   // RightHand: arm back, slightly down
  lArm: { rx: -45, pz:  0.5, py:  0.2 },   // LeftHand:  arm forward, slightly up
  rLeg: { rx: -30, pz:  0.7 },              // RightLeg:  leg forward
  lLeg: { rx:  30, pz: -0.7 },              // LeftLeg:   leg back
};

let rest = null; // captured once on first call

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;
  if (!lAG || !rAG || !lLG || !rLG) return;

  // Capture rest pose once (GLB bind pose)
  if (!rest) {
    rest = {
      rAG: { rx: rAG.rotation.x, ry: rAG.rotation.y, rz: rAG.rotation.z,
             px: rAG.position.x,  py: rAG.position.y,  pz: rAG.position.z },
      lAG: { rx: lAG.rotation.x, ry: lAG.rotation.y, rz: lAG.rotation.z,
             px: lAG.position.x,  py: lAG.position.y,  pz: lAG.position.z },
      rLG: { rx: rLG.rotation.x, ry: rLG.rotation.y, rz: rLG.rotation.z,
             px: rLG.position.x,  py: rLG.position.y,  pz: rLG.position.z },
      lLG: { rx: lLG.rotation.x, ry: lLG.rotation.y, rz: lLG.rotation.z,
             px: lLG.position.x,  py: lLG.position.y,  pz: lLG.position.z },
    };
  }

  // LeftHand has negative scale (Blender mirror) — its local axes are flipped
  const lm = (lAG.scale && lAG.scale.x < 0) ? -1 : 1;

  const s = SPEED * dt;

  // Default targets = rest pose (idle: lerp back to rest)
  let tRArx = rest.rAG.rx, tRApz = rest.rAG.pz, tRApy = rest.rAG.py;
  let tLArx = rest.lAG.rx, tLApz = rest.lAG.pz, tLApy = rest.lAG.py;
  let tRLrx = rest.rLG.rx, tRLpz = rest.rLG.pz;
  let tLLrx = rest.lLG.rx, tLLpz = rest.lLG.pz;
  let tRAz  = rest.rAG.rz;
  let tLAz  = rest.lAG.rz;

  if (state === 'moving') {
    const t = Math.sin(time); // -1..+1

    // Right arm swings with phase +t
    tRArx = rest.rAG.rx + WALK.rArm.rx * t * D2R;
    tRApz = rest.rAG.pz + WALK.rArm.pz * t;
    tRApy = rest.rAG.py + WALK.rArm.py * t;

    // Left arm opposite phase (−t), mirror flips local X
    tLArx = rest.lAG.rx + WALK.lArm.rx * (-t) * lm * D2R;
    tLApz = rest.lAG.pz + WALK.lArm.pz * (-t);
    tLApy = rest.lAG.py + WALK.lArm.py * (-t);

    // Right leg forward when t=+1
    tRLrx = rest.rLG.rx + WALK.rLeg.rx * t * D2R;
    tRLpz = rest.rLG.pz + WALK.rLeg.pz * t;

    // Left leg opposite
    tLLrx = rest.lLG.rx + WALK.lLeg.rx * (-t) * D2R;
    tLLpz = rest.lLG.pz + WALK.lLeg.pz * (-t);

  } else if (state === 'jumping') {
    // Arms raise up; no position delta — just rotation
    tRArx = rest.rAG.rx + (-55) * D2R;
    tRAz  = rest.rAG.rz + (-10) * D2R;
    tLArx = rest.lAG.rx + (-55) * lm * D2R;
    tLAz  = rest.lAG.rz + ( 10) * lm * D2R;

    if (isMoving) {
      const sw = Math.sin(time);
      tRLrx = rest.rLG.rx + (-20) * sw * D2R;
      tLLrx = rest.lLG.rx + ( 20) * sw * D2R;
    }
  }

  // Lerp everything toward targets
  rAG.rotation.x = lerp(rAG.rotation.x, tRArx, s);
  rAG.rotation.z = lerp(rAG.rotation.z, tRAz,  s);
  rAG.position.y = lerp(rAG.position.y, tRApy,  s);
  rAG.position.z = lerp(rAG.position.z, tRApz,  s);

  lAG.rotation.x = lerp(lAG.rotation.x, tLArx, s);
  lAG.rotation.z = lerp(lAG.rotation.z, tLAz,  s);
  lAG.position.y = lerp(lAG.position.y, tLApy,  s);
  lAG.position.z = lerp(lAG.position.z, tLApz,  s);

  rLG.rotation.x = lerp(rLG.rotation.x, tRLrx, s);
  rLG.position.z = lerp(rLG.position.z, tRLpz,  s);

  lLG.rotation.x = lerp(lLG.rotation.x, tLLrx, s);
  lLG.position.z = lerp(lLG.position.z, tLLpz,  s);
}
