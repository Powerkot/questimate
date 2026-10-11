# Questimate card laboratory

Local route: http://localhost:8080/card-lab

20 front systems F01–F20 and 15 independent backs B01–B15. Built from CSS surfaces and inline SVG ornaments; only the surrounding tabletop uses existing oak artwork. No production card components, gameplay, API, schema or defaults are changed.

Use the two selectors or the numbered galleries. Picking a gallery tile opens its large preview. Front/back selections remain independent; all fronts work across the eight-value scale. The hand supports hover/focus lift and selection, the large card flips, and table samples show the small-size rendering. RU/EN changes card descriptions. Motion can be disabled and follows prefers-reduced-motion.

Subtitles are omitted below 90 px card width instead of reduced to illegible microtext. XXL receives a smaller, explicit type size. Front styles are scoped to .cl-front so they cannot change the selected back. Back art never depends on the estimate value.

Verification: typecheck, targeted ESLint, build; real browser dev and built preview, desktop and 390×844; 20 front systems checked for overflowing estimate text, independent back selection, gallery selection/scroll, flip, language toggle, motion toggle, no horizontal mobile overflow or browser warnings/errors.
