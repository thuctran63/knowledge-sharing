/** Matches `--site-header-offset` (5.25rem) used in prose headings + TOC sticky. */
const HEADER_OFFSET_PX = 84;

export function scrollToHeading(id: string, offset = HEADER_OFFSET_PX) {
  const el = document.getElementById(id);
  if (!el) return;

  const top =
    el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}
