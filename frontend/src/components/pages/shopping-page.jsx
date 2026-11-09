"use client";

import { useApp } from "@/components/app/app-provider";
import { ShoppingPanel } from "@/components/shopping-panel";

// Ruta "/compras".
export function ShoppingPage() {
  const { shopping } = useApp();
  return <ShoppingPanel items={shopping.items} setItems={shopping.setItems} categories={shopping.categories} setCategories={shopping.setCategories} />;
}
