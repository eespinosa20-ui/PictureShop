export function evaluarContrasena(contrasena: string) {
  return [
    { texto: "Minimo 8 caracteres", valido: contrasena.length >= 8 },
    { texto: "Un caracter especial", valido: /[^A-Za-z0-9]/.test(contrasena) },
  ];
}
