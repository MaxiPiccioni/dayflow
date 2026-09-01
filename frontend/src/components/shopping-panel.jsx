import { useState } from "react";
import { ChevronDown, ListPlus, Minus, Plus, Settings2, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";

const inputClass = "w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-lime-500 dark:border-zinc-700 dark:placeholder:text-zinc-500";

function CategorySelect({ value, onChange, categories }) {
  const [open, setOpen] = useState(false);
  const options = [{ value: "", label: "Sin categoría" }, ...categories.map((category) => ({ value: category.name, label: category.name }))];
  const selected = options.find((option) => option.value === value);
  return <div className="relative"><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)} className={`${inputClass} flex items-center justify-between text-left ${value ? "" : "text-zinc-400"}`}>{selected?.label || "Sin categoría"}<ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <div role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value || "none"} onClick={() => { onChange(option.value); setOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${option.value === value ? "bg-zinc-100 font-medium dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>{option.label}</button>)}</div>}</div>;
}

function ShoppingCategoryModal({ categories, addCategory, removeCategory, close }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      await addCategory(name.trim());
      setName("");
    } catch (err) {
      setError(err.message || "No se pudo crear la categoría.");
    }
  };
  return (
    <Modal title="Categorías de compras" close={close}>
      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Nueva categoría" className={inputClass} />
        <button type="submit" className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Añadir</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-5 space-y-1">
        {categories.length ? categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <span className="text-sm">{category.name}</span>
            <button type="button" onClick={() => removeCategory(category.id)} aria-label={`Eliminar categoría ${category.name}`} title="Eliminar categoría" className="text-zinc-400 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        )) : <p className="py-6 text-center text-sm text-zinc-400">Todavía no tenés categorías.</p>}
      </div>
    </Modal>
  );
}

function StockControl({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label="Restar del stock" className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
        <Minus size={13} />
      </button>
      <span className="w-6 text-center text-sm font-semibold">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Sumar al stock" className="grid h-7 w-7 place-items-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
        <Plus size={13} />
      </button>
    </div>
  );
}

function ShoppingListModal({ items, categories, markBought, close }) {
  const toBuy = items.filter((item) => item.stock <= 0 || item.force_list);
  const groupNames = [...categories.map((category) => category.name), null];
  const groups = groupNames.map((groupName) => ({ name: groupName, items: toBuy.filter((item) => (item.category || null) === groupName) })).filter((group) => group.items.length);
  return (
    <Modal title="Lista del súper" close={close}>
      <div className="mt-5 space-y-5">
        {groups.length ? groups.map((group) => (
          <div key={group.name || "sin-categoria"}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{group.name || "Sin categoría"}</p>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <span className="text-sm">{item.name}</span>
                  <button type="button" onClick={() => markBought(item)} className="flex items-center gap-1 rounded-lg bg-lime-200 px-3 py-1.5 text-xs font-semibold text-lime-950">
                    <Plus size={13} /> Comprado
                  </button>
                </div>
              ))}
            </div>
          </div>
        )) : <p className="py-8 text-center text-sm text-zinc-400">No te falta nada por ahora.</p>}
      </div>
    </Modal>
  );
}

export function ShoppingPanel({ items, setItems, categories, setCategories }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [error, setError] = useState("");

  const toBuyCount = items.filter((item) => item.stock <= 0 || item.force_list).length;

  const addItem = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");
    try {
      const created = await api("/shopping-items", { method: "POST", body: JSON.stringify({ name: name.trim(), category: category || null, stock: 0 }) });
      setItems((current) => [...current, created]);
      setName("");
      setCategory("");
    } catch (err) {
      setError(err.message || "No se pudo crear el producto.");
    }
  };

  const patchItem = (item, fields) => {
    const previous = items;
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, ...fields } : entry)));
    api(`/shopping-items/${item.id}`, { method: "PATCH", body: JSON.stringify(fields) }).catch(() => setItems(previous));
  };

  const updateStock = (item, nextStock) => patchItem(item, { stock: nextStock });
  const toggleForceList = (item) => patchItem(item, { force_list: !item.force_list });
  const markBought = (item) => patchItem(item, { stock: item.stock + 1, force_list: false });

  const removeItem = (id) => {
    const previous = items;
    setItems(items.filter((item) => item.id !== id));
    api(`/shopping-items/${id}`, { method: "DELETE" }).catch(() => setItems(previous));
  };

  const addCategory = (categoryName) => api("/categories", { method: "POST", body: JSON.stringify({ name: categoryName, scope: "shopping" }) }).then((created) => setCategories((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name))));

  const removeCategory = (id) => {
    const previous = categories;
    const removed = categories.find((entry) => entry.id === id);
    setCategories(categories.filter((entry) => entry.id !== id));
    if (removed) setItems((current) => current.map((item) => (item.category === removed.name ? { ...item, category: null } : item)));
    api(`/categories/${id}`, { method: "DELETE" }).catch(() => setCategories(previous));
  };

  const sortedItems = [...items].sort((a, b) => (a.category || "").localeCompare(b.category || "") || a.name.localeCompare(b.name));

  return (
    <Card className="shopping-panel">
      <CardHeader
        eyebrow="Supermercado"
        title="Compras"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => setListOpen(true)} className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white">
              <ShoppingCart size={14} /> Lista del súper{toBuyCount > 0 ? ` (${toBuyCount})` : ""}
            </button>
            <button type="button" onClick={() => setCategoryModalOpen(true)} aria-label="Gestionar categorías" title="Gestionar categorías" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
              <Settings2 size={15} />
            </button>
          </div>
        }
      />
      <form onSubmit={addItem} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nuevo producto" className={inputClass} />
        <CategorySelect value={category} onChange={setCategory} categories={categories} />
        <button type="submit" className="flex items-center justify-center gap-1 rounded-xl bg-lime-200 px-4 py-2 text-sm font-semibold text-lime-950"><Plus size={15} /> Añadir</button>
      </form>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-5 space-y-1">
        {sortedItems.length ? sortedItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 border-t border-zinc-100 py-2.5 text-sm dark:border-zinc-800">
            <div className="min-w-0 flex-1">
              <p className="truncate">{item.name}</p>
              {item.category && <p className="text-xs text-zinc-400">{item.category}</p>}
            </div>
            <StockControl value={item.stock} onChange={(next) => updateStock(item, next)} />
            <button
              type="button"
              onClick={() => toggleForceList(item)}
              aria-label={item.force_list ? `Quitar ${item.name} de la lista` : `Añadir ${item.name} a la lista`}
              title={item.force_list ? "Quitar de la lista del súper" : "Añadir a la lista del súper"}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${item.force_list ? "border-lime-300 bg-lime-100 text-lime-700 dark:border-lime-700 dark:bg-lime-500/20 dark:text-lime-300" : "border-zinc-200 text-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"}`}
            >
              <ListPlus size={14} />
            </button>
            <button type="button" onClick={() => removeItem(item.id)} aria-label={`Eliminar ${item.name}`} title="Eliminar producto" className="text-zinc-400 hover:text-red-500">
              <Trash2 size={15} />
            </button>
          </div>
        )) : <p className="py-8 text-center text-sm text-zinc-400">Todavía no agregaste productos.</p>}
      </div>
      {categoryModalOpen && <ShoppingCategoryModal categories={categories} addCategory={addCategory} removeCategory={removeCategory} close={() => setCategoryModalOpen(false)} />}
      {listOpen && <ShoppingListModal items={items} categories={categories} markBought={markBought} close={() => setListOpen(false)} />}
    </Card>
  );
}
