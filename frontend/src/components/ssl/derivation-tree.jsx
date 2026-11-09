

const X_GAP = 30;
const Y_GAP = 38;
const PAD = 16;

// Árbol de derivación dibujado en SVG. tree: { sym, children? } (ver parseTrees en lib/ssl/grammar).
export function DerivationTree({ tree, label = "Árbol de derivación" }) {
  let leaves = 0;
  let maxDepth = 0;
  const place = (node, depth) => {
    maxDepth = Math.max(maxDepth, depth);
    if (!node.children?.length) return { node, depth, x: leaves++ * X_GAP, kids: [] };
    const kids = node.children.map((child) => place(child, depth + 1));
    return { node, depth, x: (kids[0].x + kids[kids.length - 1].x) / 2, kids };
  };
  const root = place(tree, 0);
  const width = Math.max(leaves - 1, 0) * X_GAP + PAD * 2;
  const height = maxDepth * Y_GAP + PAD * 2 + 8;

  const lines = [];
  const labels = [];
  const walk = (item) => {
    const cx = item.x + PAD;
    const cy = item.depth * Y_GAP + PAD + 6;
    labels.push(
      <text key={`t${labels.length}`} x={cx} y={cy + 5} textAnchor="middle" className={`fill-current font-mono text-[15px] ${item.kids.length ? "font-semibold" : "text-lime-700 dark:text-lime-400"}`}>
        {item.node.sym}
      </text>,
    );
    for (const kid of item.kids) {
      lines.push(<line key={`l${lines.length}`} x1={cx} y1={cy + 9} x2={kid.x + PAD} y2={kid.depth * Y_GAP + PAD + 6 - 9} className="stroke-zinc-400" strokeWidth="1.2" />);
      walk(kid);
    }
  };
  walk(root);

  return (
    <div className="w-0 min-w-full overflow-x-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
      <svg role="img" aria-label={`${label}: raíz ${tree.sym}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto block text-zinc-900 dark:text-zinc-100">
        {lines}
        {labels}
      </svg>
    </div>
  );
}

