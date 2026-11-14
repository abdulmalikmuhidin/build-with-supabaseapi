import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Todo } from "./types";
import { supabase } from "./lib/supabase";

type Filter = "all" | "active" | "completed";

const filters: { label: string; value: Filter }[] = [
  { label: "All tasks", value: "all" },
  { label: "To do", value: "active" },
  { label: "Completed", value: "completed" },
];

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    async function loadTodos() {
      const { data, error: loadError } = await supabase!
        .from("todos")
        .select("id, title, completed, created_at")
        .order("created_at", { ascending: false });

      if (loadError) {
        setError(`Couldn't load your tasks: ${loadError.message}`);
      } else {
        setTodos(data ?? []);
      }
      setIsLoading(false);
    }

    void loadTodos();
  }, []);

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;
  const visibleTodos = useMemo(
    () =>
      todos.filter((todo) => {
        if (filter === "active") return !todo.completed;
        if (filter === "completed") return todo.completed;
        return true;
      }),
    [filter, todos],
  );

  async function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !supabase || isAdding) return;

    setIsAdding(true);
    setError("");
    const { data, error: addError } = await supabase
      .from("todos")
      .insert({ title: trimmedTitle })
      .select("id, title, completed, created_at")
      .single();

    if (addError) {
      setError(`Couldn't add this task: ${addError.message}`);
    } else {
      setTodos((current) => [data, ...current]);
      setTitle("");
      setFilter("all");
    }
    setIsAdding(false);
  }

  async function toggleTodo(todo: Todo) {
    if (!supabase) return;
    setError("");
    const { error: updateError } = await supabase
      .from("todos")
      .update({ completed: !todo.completed })
      .eq("id", todo.id);

    if (updateError) {
      setError(`Couldn't update this task: ${updateError.message}`);
    } else {
      setTodos((current) =>
        current.map((item) =>
          item.id === todo.id ? { ...item, completed: !item.completed } : item,
        ),
      );
    }
  }

  async function deleteTodo(id: string) {
    if (!supabase) return;
    setError("");
    const { error: deleteError } = await supabase.from("todos").delete().eq("id", id);

    if (deleteError) {
      setError(`Couldn't delete this task: ${deleteError.message}`);
    } else {
      setTodos((current) => current.filter((todo) => todo.id !== id));
    }
  }

  const emptyTitle =
    filter === "completed"
      ? "Nothing completed just yet"
      : filter === "active"
        ? "You're all caught up"
        : "A fresh start";
  const emptyDescription =
    filter === "completed"
      ? "Finished tasks will find a home here."
      : filter === "active"
        ? "Enjoy the breathing room, or add something new."
        : "Add your first task and make today count.";

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Daymark home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5 9.2 17 19 7" />
            </svg>
          </span>
          <span>daymark</span>
        </a>
        <span className="topbar-note"><span className="status-dot" /> A little more focus, every day</span>
      </header>

      <section className="content">
        <div className="intro">
          <p className="eyebrow">YOUR SPACE, YOUR PACE</p>
          <h1>Make room for<br /><span>what matters.</span></h1>
          <p className="intro-copy">A clear mind starts with a clear list. Take it one task at a time.</p>
        </div>

        <section className="todo-card" aria-label="Your tasks">
          <div className="card-heading">
            <div>
              <p className="section-kicker">YOUR DAY</p>
              <h2>Tasks <span className="task-count">{todos.length}</span></h2>
            </div>
            <div className="progress-summary" aria-live="polite">
              <span className="progress-number">{completedCount}<span>/{todos.length}</span></span>
              <span className="progress-label">completed</span>
            </div>
          </div>

          <form className="add-form" onSubmit={addTodo}>
            <span className="add-icon" aria-hidden="true">+</span>
            <label className="sr-only" htmlFor="new-task">Add a task</label>
            <input
              id="new-task"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What needs your attention?"
              maxLength={200}
              disabled={!supabase || isAdding}
            />
            <button type="submit" disabled={!supabase || isAdding || !title.trim()}>
              {isAdding ? "Adding…" : "Add task"}
            </button>
          </form>

          {!supabase && (
            <div className="message setup-message" role="status">
              <strong>One quick setup step</strong>
              <span>Add your Supabase URL and anon key to <code>.env.local</code>, then run the SQL in <code>supabase/schema.sql</code>.</span>
            </div>
          )}
          {error && <div className="message error-message" role="alert">{error}</div>}

          <div className="list-toolbar">
            <div className="filter-tabs" role="tablist" aria-label="Filter tasks">
              {filters.map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === item.value}
                  className={filter === item.value ? "filter-tab selected" : "filter-tab"}
                  onClick={() => setFilter(item.value)}
                  key={item.value}
                >
                  {item.label}
                  {item.value === "active" && activeCount > 0 && (
                    <span className="tab-count">{activeCount}</span>
                  )}
                </button>
              ))}
            </div>
            <span className="remaining-label">
              {activeCount === 1 ? "1 task" : `${activeCount} tasks`} left
            </span>
          </div>

          <div className="todo-list" aria-live="polite">
            {isLoading ? (
              <div className="list-state"><span className="spinner" /> Loading your tasks…</div>
            ) : visibleTodos.length ? (
              visibleTodos.map((todo) => (
                <article className={todo.completed ? "todo-row is-completed" : "todo-row"} key={todo.id}>
                  <button
                    className="check-button"
                    type="button"
                    aria-label={todo.completed ? `Mark ${todo.title} as not completed` : `Complete ${todo.title}`}
                    onClick={() => void toggleTodo(todo)}
                  >
                    {todo.completed && (
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="m3.5 8 3 3 6-6" />
                      </svg>
                    )}
                  </button>
                  <span className="todo-title">{todo.title}</span>
                  <button
                    className="delete-button"
                    type="button"
                    aria-label={`Delete ${todo.title}`}
                    onClick={() => void deleteTodo(todo.id)}
                  >
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M4.5 6h11M8 6V4.5h4V6m2.5 0-.6 9.5H6.1L5.5 6m3 2.5v4m3-4v4" />
                    </svg>
                  </button>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">
                  {filter === "completed" ? "✓" : "✳"}
                </span>
                <h3>{emptyTitle}</h3>
                <p>{emptyDescription}</p>
              </div>
            )}
          </div>

          <footer className="card-footer">
            <span><span className="footer-sparkle">✳</span> Small steps add up.</span>
            {completedCount > 0 && <span>{completedCount} done today</span>}
          </footer>
        </section>

        <p className="bottom-note">Made for the days when you have a lot on your mind.</p>
      </section>
    </main>
  );
}

export default App;
