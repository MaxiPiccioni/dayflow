import { MachineCanvas } from "@/components/ssl/editor/machine-canvas";

const noop = () => {};

// Un autómata solo para mirar (sin edición): lo usan las herramientas que generan autómatas.
export function StaticMachine({ machine, highlight }) {
  return (
    <MachineCanvas
      machine={machine}
      mode="select"
      selection={{}}
      highlight={highlight}
      readOnly
      onLiveChange={noop}
      onCommitDrag={noop}
      onChange={noop}
      onSelect={noop}
      onDelete={noop}
      onRequestTransition={noop}
      linkFrom={null}
      onLinkFrom={noop}
    />
  );
}
