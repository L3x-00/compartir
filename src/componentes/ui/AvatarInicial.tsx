export function AvatarInicial({ nombre, grande = false }: { nombre: string; grande?: boolean }) {
  const inicial = Array.from(nombre.trim())[0]?.toLocaleUpperCase("es") ?? "?";
  const variante = Array.from(nombre).reduce((suma, letra) => suma + (letra.codePointAt(0) ?? 0), 0) % 3;
  return <span className={"avatar-inicial avatar-" + variante + (grande ? " avatar-grande" : "")} aria-hidden="true">{inicial}</span>;
}
