// Tabla de transición de un AFD como en la guía: → marca el estado inicial y * los estados finales.
export function TransitionTable({ table, caption }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="border-collapse text-center font-mono text-sm">
        <caption className="mb-1 text-left text-xs font-semibold text-zinc-500">{caption ?? table.name}</caption>
        <thead>
          <tr>
            <th scope="col" className="border border-zinc-300 bg-zinc-100 px-2.5 py-1 dark:border-zinc-700 dark:bg-zinc-800">{table.name}</th>
            {table.alphabet.map((symbol) => <th key={symbol} scope="col" className="border border-zinc-300 bg-zinc-100 px-2.5 py-1 dark:border-zinc-700 dark:bg-zinc-800">{symbol}</th>)}
          </tr>
        </thead>
        <tbody>
          {table.rows.map(([state, ...targets]) => (
            <tr key={state}>
              <th scope="row" className="border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-left dark:border-zinc-700 dark:bg-zinc-800">
                {state === table.start ? "→" : ""}{table.accepting.includes(state) ? "*" : ""}{state}
              </th>
              {targets.map((target, i) => <td key={i} className="border border-zinc-300 px-2.5 py-1 dark:border-zinc-700">{target}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
