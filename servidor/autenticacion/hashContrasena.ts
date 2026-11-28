import "server-only";
import argon2 from "argon2";

export function generarHashContrasena(contrasena: string) {
  return argon2.hash(contrasena);
}
