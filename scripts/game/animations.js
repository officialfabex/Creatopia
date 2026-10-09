/**
 * animations.js
 *
 * Animates CreatopiaBody.glb nodes directly — no pivot manipulation.
 * The model's default pose is preserved; we only add small rotational offsets.
 *
 * Node origins (from GLB):
 *   RightHand  — origin at mesh centre
 *   LeftHand   — origin at mesh centre, negative scale (Blender mirror)
 *   LeftLeg    — origin at mesh centre
 *   RightLeg   — origin at mesh centre
 *
 * Because origins are at mesh centres (not joints), we keep swing angles
 * small so the visual "detachment" is minimal. The motion still reads clearly
 * as walking/jumping without limbs flying away.
 *
 * LeftHand has scale.x < 0 (mirrored in Blender).
 * Its local X axis points the opposite direction, so we negate rX for it.
 */

import * as THREE from 'https://unpkg.com/three@0.163.0/build/three.module.js';

const { lerp } = THREE.MathUtils;
const SPEED = 10;

export function applyAnimations(limbs, state, dt, time, isMoving = false) {
  if (!limbs) return;
  const { lAG, rAG, lLG, rLG } = limbs;
  if (!lAG || !rAG || !lLG || !rLG) return;

  // Detect mirror on left hand — negative scale.x means X axis is flipped
  const lMirror = (lAG.scale && lAG.scale.x < 0) ? -1 : 1;

  // Store initial rotations on first call (the GLB rest pose)
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

  // Swing delta angles added on top of rest pose
  let dRax=0, dLax=0, dLLx=0, dRLx=0;
  let dRaz=0, dLaz=0;

  if (state === 'moving') {
    const sw = Math.sin(time) * 0.45;
    dRax =  sw;
    dLax = -sw * lMirror;
    dRLx = -sw;
    dLLx =  sw;

  } else if (state === 'jumping') {
    // Arms raise up and spread
    dRax = -0.9;
    dRaz = -0.2;
    dLax = -0.9 * lMirror;
    dLaz =  0.2 * lMirror;

    if (isMoving) {
      const sw = Math.sin(time) * 0.3;
      dRLx = -sw;
      dLLx =  sw;
    }
  }

  const s = SPEED * dt;

  rAG.rotation.x = lerp(rAG.rotation.x, rr.x + dRax, s);
  rAG.rotation.z = lerp(rAG.rotation.z, rr.z + dRaz, s);
  lAG.rotation.x = lerp(lAG.rotation.x, lr.x + dLax, s);
  lAG.rotation.z = lerp(lAG.rotation.z, lr.z + dLaz, s);
  lLG.rotation.x = lerp(lLG.rotation.x, llr.x + dLLx, s);
  rLG.rotation.x = lerp(rLG.rotation.x, rlr.x + dRLx, s);
}
