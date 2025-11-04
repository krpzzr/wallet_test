"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NextImage from "next/image";

type CategoryKey = "Еда" | "Транспорт" | "Жильё" | "Развлечения" | "Образование" | "Другое";

type Expense = {
  id: string;
  description: string;
  category: CategoryKey;
  date: string; // ISO string yyyy-mm-dd
  amount: number; // in rubles
};

const CATEGORIES: { key: CategoryKey; iconPath?: string }[] = [
  { key: "Еда", iconPath: "/images/bag.png" },
  { key: "Транспорт", iconPath: "/images/car.png" },
  { key: "Жильё", iconPath: "/images/house.png" },
  { key: "Развлечения", iconPath: "/images/gameboy.png" },
  { key: "Образование", iconPath: "/images/education.png" },
  { key: "Другое", iconPath: "/images/another.png"  },
];

type SortKey = "date" | "amount" | "description";

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryKey>("Еда");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState<string>("");

  const [filterCategory, setFilterCategory] = useState<CategoryKey | "Все">("Все");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const catMenuRef = useRef<HTMLDivElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  // persistence
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wallet.expenses");
      if (raw) {
        setExpenses(JSON.parse(raw));
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("wallet.expenses", JSON.stringify(expenses));
  }, [expenses]);

  // close menus on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      const inCat = !!catMenuRef.current && catMenuRef.current.contains(target);
      const inSort = !!sortMenuRef.current && sortMenuRef.current.contains(target);
      if (!inCat) setIsCatMenuOpen(false);
      if (!inSort) setIsSortMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const filteredSorted = useMemo(() => {
    const byCategory = filterCategory === "Все" ? expenses : expenses.filter((e) => e.category === filterCategory);
    const sorted = [...byCategory].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      if (sortKey === "amount") cmp = a.amount - b.amount;
      if (sortKey === "description") cmp = a.description.localeCompare(b.description, "ru");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [expenses, filterCategory, sortKey, sortDir]);

  function resetForm() {
    setDescription("");
    setCategory("Еда");
    setDate(new Date().toISOString().slice(0, 10));
    setAmount("");
  }

  function handleAdd() {
    const parsedAmount = Number(String(amount).replace(/\s+/g, "").replace(",", "."));
    if (!description.trim() || !date || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
    const next: Expense = {
      id: crypto.randomUUID(),
      description: description.trim(),
      category,
      date,
      amount: Math.round(parsedAmount * 100) / 100,
    };
    setExpenses((prev) => [next, ...prev]);
    resetForm();
  }

  function handleDelete(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  function startEdit(id: string) {
    setEditingId(id);
  }

  function saveEdit(updated: Expense) {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditingId(null);
  }

  function formatDateHuman(iso: string) {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-black" />
          <span className="text-base font-semibold text-black">Skypro.Wallet</span>
        </div>
        <nav className="flex items-center gap-8 text-sm">
          <span className="text-emerald-600 font-medium">Мои расходы</span>
          <span className="text-zinc-500">Анализ расходов</span>
        </nav>
        <button className="rounded-full bg-zinc-200 px-4 py-1.5 text-sm text-zinc-700">Выйти</button>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-12 xl:grid-cols-[1fr_360px]">
        {/* Table card */}
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-4 mobile-stack-controls">
            <h2 className="text-2xl font-bold text-black">Таблица расходов</h2>

            <div className="flex items-center gap-8">
              <div className="relative select-none text-sm text-zinc-600" ref={catMenuRef}>
              <button
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-zinc-50"
                onClick={() => setIsCatMenuOpen((v) => !v)}
              >
                Фильтровать по категории <span className="text-zinc-400">{isCatMenuOpen ? "▲" : "▼"}</span>
              </button>
              {isCatMenuOpen && (
                <div className="absolute left-0 top-7 z-10 w-44 rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
                  <MenuItem onClick={() => setFilterCategory("Все")} active={filterCategory === "Все"}>
                    Все
                  </MenuItem>
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c.key} onClick={() => setFilterCategory(c.key)} active={filterCategory === c.key}>
                      {c.key}
                    </MenuItem>
                  ))}
                </div>
              )}
            </div>
              <div className="relative flex items-center gap-1 select-none text-sm text-zinc-600" ref={sortMenuRef}>
                <button
                  className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-50"
                  onClick={() => setIsSortMenuOpen((v) => !v)}
                  title="Сортировка"
                >
                  <span>Сортировать по</span>
                  <span className="text-emerald-600 underline">
                    {sortKey === "date" ? "дате" : sortKey === "amount" ? "сумме" : "описанию"}
                  </span>
                  <span className="text-zinc-400">{isSortMenuOpen ? "▲" : "▼"}</span>
                </button>
                {isSortMenuOpen && (
                  <div className="absolute right-0 top-7 z-10 w-48 rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
                    <MenuItem onClick={() => setSortKey("date")} active={sortKey === "date"}>
                      По дате
                    </MenuItem>
                    <MenuItem onClick={() => setSortKey("amount")} active={sortKey === "amount"}>
                      По сумме
                    </MenuItem>
                    <MenuItem onClick={() => setSortKey("description")} active={sortKey === "description"}>
                      По описанию
                    </MenuItem>
                    <div className="my-1 border-t border-zinc-100" />
                    <MenuItem onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))} active={false}>
                      Направление: {sortDir === "asc" ? "по возрастанию" : "по убыванию"}
                    </MenuItem>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-100">
            <div className="max-h-[520px] overflow-y-auto overflow-x-auto [scrollbar-gutter:stable]">
              <table className="min-w-[760px] w-full table-fixed text-left text-sm">
                <colgroup>
                  <col style={{ width: "44%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "110px" }} />
                </colgroup>
                <thead className="text-zinc-500">
                <tr>
                    <th className="px-4 py-3 font-medium border-b border-zinc-200">Описание</th>
                    <th className="px-4 py-3 font-medium border-b border-zinc-200">Категория</th>
                    <th className="px-4 py-3 font-medium border-b border-zinc-200">Дата</th>
                    <th className="px-4 py-3 font-medium border-b border-zinc-200">Сумма</th>
                    <th className="px-4 py-3 border-b border-zinc-200"></th>
                </tr>
                </thead>
                <tbody>
                  {filteredSorted.map((e) => (
                    <Row
                      key={e.id}
                      expense={e}
                      isEditing={editingId === e.id}
                      onDelete={() => handleDelete(e.id)}
                      onEdit={() => startEdit(e.id)}
                      onSave={saveEdit}
                    />
                  ))}
                  {filteredSorted.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-zinc-500" colSpan={5}>
                        Нет расходов. Добавьте первый справа.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Form card */}
        <aside className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-2xl font-bold text-black">Новый расход</h3>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-zinc-700">Описание</label>
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Введите описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <div className="mb-2 text-sm font-medium text-zinc-700">Категория</div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    category === c.key
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  {c.iconPath ? (
                    <NextImage src={c.iconPath} alt="" width={16} height={16} />
                  ) : null}
                  <span>{c.key}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-zinc-700">Дата</label>
            <input
              type="date"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-700">Сумма</label>
            <input
              inputMode="decimal"
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Введите сумму"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <button
            onClick={handleAdd}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Добавить новый расход
          </button>
        </aside>
      </main>
    </div>
  );
}

function Row({
  expense,
  isEditing,
  onDelete,
  onEdit,
  onSave,
}: {
  expense: Expense;
  isEditing: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onSave: (e: Expense) => void;
}) {
  const [local, setLocal] = useState<Expense>(expense);
  const rowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => setLocal(expense), [expense]);

  // Auto-save on click outside the edited row
  useEffect(() => {
    if (!isEditing) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rowRef.current && !rowRef.current.contains(target)) {
        onSave(local);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isEditing, local, onSave]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onSave(local);
    }
  }

  return (
    <tr ref={rowRef} className="border-t border-zinc-100 hover:bg-zinc-50">
      <td className="px-4 py-3 text-zinc-900">
        {isEditing ? (
          <input
            className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm"
            value={local.description}
            onChange={(e) => setLocal({ ...local, description: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span title={expense.description}>{truncateText(expense.description, 25)}</span>
        )}
      </td>
      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
        {isEditing ? (
          <select
            className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm"
            value={local.category}
            onChange={(e) => setLocal({ ...local, category: e.target.value as CategoryKey })}
            onKeyDown={handleKeyDown}
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.key}
              </option>
            ))}
          </select>
        ) : (
          <span>{local.category}</span>
        )}
      </td>
      <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
        {isEditing ? (
          <input
            type="date"
            className="w-full rounded-md border border-zinc-200 px-2 py-1 text-sm"
            value={local.date}
            onChange={(e) => setLocal({ ...local, date: e.target.value })}
            onKeyDown={handleKeyDown}
          />
        ) : (
          formatDateHuman(local.date)
        )}
      </td>
      <td className="px-4 py-3 font-medium text-zinc-900 whitespace-nowrap">
        {isEditing ? (
          <input
            inputMode="decimal"
            className="w-24 rounded-md border border-zinc-200 px-2 py-1 text-sm"
            value={String(local.amount)}
            onChange={(e) =>
              setLocal({ ...local, amount: Number(e.target.value.replace(/\s+/g, "").replace(",", ".")) || 0 })
            }
            onKeyDown={handleKeyDown}
          />
        ) : (
          formatCurrency(local.amount)
        )}
      </td>
      <td className="px-4 py-3 text-right text-zinc-400 whitespace-nowrap">
        {isEditing ? null : (
          <div className="flex justify-end gap-3">
            <button className="text-zinc-500 hover:text-emerald-600" onClick={onEdit} title="Редактировать">
              ✎
            </button>
            <button className="text-zinc-500 hover:text-red-600" onClick={onDelete} title="Удалить">
              🗑
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function formatDateHuman(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function formatCurrency(value: number) {
  const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value);
  return `${number} р`;
}

function MenuItem({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-3 py-2 text-left text-sm ${
        active ? "bg-emerald-50 text-emerald-700" : "text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}

function truncateText(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}
