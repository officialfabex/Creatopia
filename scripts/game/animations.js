/**
 * animations.js — animates CreatopiaBody.glb nodes directly.
 *
 * No pivot manipulation — we add rotational deltas on top of the GLB rest pose.
 * Rest pose is captured once on first call and stored in userData.restRot.
 *
 * LeftHand has negative scale.x (Blender mirror). Its local X is flipped,
 * so a positive dX on RightHand means forward-swing; for LeftHand the same
 * visual forward-swing requires a NEGATIVE dX (because axis is inverted).
 * This is handled by lMirror = -1.
 *
 * Walk: arms alternate (right arm forward when left leg forward).
 *   RightArm dX = +swing   ← forward
 *   LeftArm  dX = -swing * lMirror = -swing * -1 = +swing  ← WRONG
 *
 * Wait — lMirror = -1 means we must ALSO flip the sign for left arm:
 *   LeftArm target dX in visual space = +swing (same direction as right arm = T-pose break)
 *   But we want opposite: LeftArm visual dX = -swing
 *   In local space (flipped): dLax = -swing / lMirror = -swing / -1 = +swing  ← still wrong
 *
 * Correct way: think in VISUAL space, then convert to local space.
 *   Visual: rAx_visual = +swing, lAx_visual = -swing  (arms alternate)
 *   Local:  rAG.rotation.x += rAx_visual  (no flip needed for right)
 *           lAG.rotation.x += lAx_visual * lMirror  (flip for mirrored left)
 *   So:     lAG.rotation.x += (-swing) * (-1) = +swing  ← correct in local space = visually -swing
 *
 * tldr: set dLax = -swing (visual target), then multiply by lMirror when applying.
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const { lerp } = THREE.MathUtils;
const SPEED = 10; // lerp speed

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;
  if (!lAG || !rAG || !lLG || !rLG) return;

  // Detect mirrored left hand (Blender mirror → negative scale.x)
  const lMirror = (lAG.scale && lAG.scale.x < 0) ? -1 : 1;

  // Capture rest pose once
  if (!rAG.userData.restRot) {
    rAG.userData.restRot = rAG.rotation.clone();
    lAG.userData.restRot = lAG.rotation.clone();
    lLG.userData.restRot = lLG.rotation.clone();
    rLG.userData.restRot = rLG.rotation.clone();
  }
  const rr = rAG.userData.restRot;
  const lr = lAG.userData.restRot;
  const llr = lLG.userData.restRot;
  const rlr = rLG.userData.restRot;

  // Visual-space delta rotations (what we WANT to see visually)
  let vRax = 0, vLax = 0; // arm X (forward/back swing)
  let vRaz = 0, vLaz = 0; // arm Z (spread for jump)
  let vLLx = 0, vRLx = 0; // leg X

  if (state === 'moving') {
    const sw = Math.sin(time) * 0.42;
    // Right arm forward, left arm backward (alternate)
    vRax = sw;
    vLax = -sw; // visually opposite
    // Legs alternate opposite to arms
    vRLx = -sw;
    vLLx = sw;

  } else if (state === 'jumping') {
    // Arms raise up (negative X = raise forward/up in most rigs)
    vRax = -0.55;
    vLax = -0.55;
    // Arms spread slightly outward (Z axis)
    vRaz = -0.22; // right arm spreads right
    vLaz =  0.22; // left arm spreads left

    if (isMoving) {
      const sw = Math.sin(time) * 0.28;
      vRLx = -sw;
      vLLx =  sw;
    }
  }
  // idle: all visual deltas = 0, lerp back to rest pose

  const s = SPEED * dt;

  // Apply: right arm direct, left arm with lMirror conversion
  rAG.rotation.x = lerp(rAG.rotation.x, rr.x + vRax,            s);
  rAG.rotation.z = lerp(rAG.rotation.z, rr.z + vRaz,            s);
  lAG.rotation.x = lerp(lAG.rotation.x, lr.x + vLax * lMirror,  s);
  lAG.rotation.z = lerp(lAG.rotation.z, lr.z + vLaz * lMirror,  s);
  lLG.rotation.x = lerp(lLG.rotation.x, llr.x + vLLx,           s);
  rLG.rotation.x = lerp(rLG.rotation.x, rlr.x + vRLx,           s);
}
