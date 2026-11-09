import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ToolPanel } from "@/components/ssl/tools/tool-panel";
import { GENERIC_TOOLS, TOOL_DEFAULTS } from "@/components/ssl/frame/tools";

const render = (tool) => renderToString(createElement(ToolPanel, { tool, defaultOpen: true }));

describe("herramientas genéricas de la barra lateral", () => {
  it.each(GENERIC_TOOLS.map((t) => t.id))("%s se abre con sus datos por defecto", (id) => {
    expect(render({ type: id, ...TOOL_DEFAULTS[id] }).length).toBeGreaterThan(500);
  });

  it("sin datos por defecto no se podrían abrir (por eso existen)", () => {
    expect(() => render({ type: "langops" })).toThrow();
  });
});
