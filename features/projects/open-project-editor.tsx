"use client";

export function OpenProjectEditor() {
  function openEditor() {
    const editor = document.querySelector<HTMLDetailsElement>("#edit-project");
    if (!editor) return;
    editor.open = true;
    editor.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <button type="button" onClick={openEditor} className="text-sm font-semibold text-[var(--primary)] hover:underline">Complete details</button>;
}
