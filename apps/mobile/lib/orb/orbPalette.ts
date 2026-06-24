import * as THREE from "three";
import { DUSTY, DUSTY_ORB } from "@/theme/dustyCloud";

export type OrbPalette = {
  colorA: THREE.Color;
  colorB: THREE.Color;
  colorC: THREE.Color;
  ambient: THREE.Color;
  light1: THREE.Color;
  light2: THREE.Color;
  light3: THREE.Color;
};

/** Dusty Cloud — rose / mauve / lavender (remplace le violet/cyan HTML d'origine). */
export function dustyOrbPalette(): OrbPalette {
  return {
    colorA: new THREE.Color(DUSTY_ORB.colorA),
    colorB: new THREE.Color(DUSTY_ORB.colorB),
    colorC: new THREE.Color(DUSTY_ORB.colorC),
    ambient: new THREE.Color(DUSTY.surface),
    light1: new THREE.Color(DUSTY.mauve),
    light2: new THREE.Color(DUSTY.rose),
    light3: new THREE.Color(DUSTY.lavenderLight),
  };
}
