// Keep ordinary Unicode names and emoji; reject visually empty nicknames.
export function validPlayerName(name: string): boolean {
  const visible = name.replace(/[\p{White_Space}\p{Default_Ignorable_Code_Point}\u2800\u3164\uffa0]/gu, "");
  return /[\p{L}\p{N}\p{P}\p{S}]/u.test(visible);
}
