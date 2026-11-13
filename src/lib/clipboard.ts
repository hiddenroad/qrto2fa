function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.style.cssText = "position: fixed; top: 0; left: 0; opacity: 0;";
  document.documentElement.append(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return legacyCopy(text);
  }
}
