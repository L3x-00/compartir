export const nombresSonido = ["acierto", "error", "revelacion", "click", "whoosh", "encaje"] as const;
export type NombreSonido = (typeof nombresSonido)[number];
export type ArchivosSonido = Partial<Record<NombreSonido, string>>;
