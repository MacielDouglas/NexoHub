"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ItemEditor } from "./meeting-content-editors";
import {
  CONTENT_TABS,
  type ContentTabKey,
  emptyItemData,
  formatContentIssue,
  issueKey,
  type LoadedContent,
  type MeetingContent,
  type MeetingContentItem,
} from "./meeting-content-types";

type FlatContent = MeetingContent & { items: MeetingContentItem[] };

function numberKey(item: MeetingContentItem): number {
  const n = (item.data as { number?: number | null })?.number;
  return typeof n === "number" ? n : Number.MAX_SAFE_INTEGER;
}

export function MeetingContentClient({
  role,
}: {
  role?: string;
  isSuperUser?: boolean;
}) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";
  const [tab, setTab] = useState<ContentTabKey>("apostila");
  const [contents, setContents] = useState<MeetingContent[]>([]);
  const [flat, setFlat] = useState<FlatContent[]>([]);
  const [selected, setSelected] = useState<LoadedContent | null>(null);
  const [inlineContent, setInlineContent] = useState<LoadedContent | null>(
    null,
  );
  const [inlineLoading, setInlineLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [songTitles, setSongTitles] = useState<Map<number, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFlat = tab === "discursos" || tab === "canticos";

  const fetchContents = useCallback(async () => {
    const res = await fetch("/api/meeting-content");
    if (res.ok) {
      const data = await res.json();
      if (data.contents) setContents(data.contents);
    }
  }, []);

  const fetchFlat = useCallback(async (type: ContentTabKey) => {
    const res = await fetch(`/api/meeting-content?type=${type}&includeItems=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.contents) setFlat(data.contents);
    }
  }, []);

  const refreshCurrent = useCallback(async () => {
    if (tab === "discursos" || tab === "canticos") {
      await fetchFlat(tab);
    } else {
      await fetchContents();
    }
  }, [tab, fetchContents, fetchFlat]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      await refreshCurrent();
      if (!cancelled) setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [refreshCurrent]);

  useEffect(() => {
    async function loadSongs() {
      const res = await fetch(
        "/api/meeting-content?type=canticos&includeItems=1",
      );
      if (res.ok) {
        const data = await res.json();
        const map = new Map<number, string>();
        for (const c of (data.contents as FlatContent[]) ?? []) {
          for (const it of c.items ?? []) {
            const d = it.data as { number?: number | null; theme?: string };
            if (typeof d.number === "number" && d.theme) {
              map.set(d.number, d.theme);
            }
          }
        }
        setSongTitles(map);
      }
    }
    void loadSongs();
  }, []);

  async function openContent(content: MeetingContent) {
    setSelected(null);
    const res = await fetch(`/api/meeting-content/${content.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.content) setSelected(data.content);
    }
  }

  async function toggleInline(content: MeetingContent) {
    if (inlineContent?.id === content.id) {
      setInlineContent(null);
      return;
    }
    setInlineContent(null);
    setInlineLoading(true);
    try {
      const res = await fetch(`/api/meeting-content/${content.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.content) setInlineContent(data.content);
      }
    } finally {
      setInlineLoading(false);
    }
  }

  async function handleImport(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const doUpload = (replace: boolean) => {
        const form = new FormData();
        form.append("file", file);
        form.append("type", tab);
        if (replace) form.append("replace", "true");
        return fetch("/api/meeting-content/import", {
          method: "POST",
          body: form,
        });
      };

      const res = await doUpload(false);

      if (res.status === 409) {
        const data = await res.json().catch(() => null);
        const existing = data?.existing as { title?: string } | undefined;
        const confirmed = window.confirm(
          t("meetingContent.duplicateConfirm", {
            title: existing?.title ?? "",
          }),
        );
        if (!confirmed) return;
        const res2 = await doUpload(true);
        if (!res2.ok) {
          setUploadError(t("meetingContent.importError"));
          return;
        }
      } else if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.code === "TYPE_MISMATCH") {
          setUploadError(
            t("meetingContent.typeMismatch", {
              type: t(`meetingContent.tabs.${tab}`),
            }),
          );
        } else {
          setUploadError(data?.error ?? t("meetingContent.importError"));
        }
        return;
      }

      setSelected(null);
      await refreshCurrent();
      setSongTitles(new Map());
      void loadSongTitles();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function loadSongTitles() {
    const res = await fetch(
      "/api/meeting-content?type=canticos&includeItems=1",
    );
    if (res.ok) {
      const data = await res.json();
      const map = new Map<number, string>();
      for (const c of (data.contents as FlatContent[]) ?? []) {
        for (const it of c.items ?? []) {
          const d = it.data as { number?: number | null; theme?: string };
          if (typeof d.number === "number" && d.theme) {
            map.set(d.number, d.theme);
          }
        }
      }
      setSongTitles(map);
    }
  }

  async function handleDeleteContent(contentId: string) {
    const res = await fetch(`/api/meeting-content/${contentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (selected?.id === contentId) setSelected(null);
      await refreshCurrent();
    }
  }

  async function handleDeleteAll() {
    const confirmed = window.confirm(t("meetingContent.removeAllConfirm"));
    if (!confirmed) return;
    const res = await fetch(`/api/meeting-content?type=${tab}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setFlat([]);
    }
  }

  async function handleCreateEmpty() {
    const res = await fetch("/api/meeting-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: tab, title: "" }),
    });
    if (res.ok) {
      const data = await res.json();
      await refreshCurrent();
      await openContent(data.content);
    }
  }

  async function saveItem(
    item: MeetingContentItem,
    data: Record<string, unknown>,
  ) {
    const res = await fetch(`/api/meeting-content/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    if (res.ok) {
      const json = await res.json();
      if (selected) {
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((i) =>
                  i.id === item.id ? { ...i, data: json.item.data } : i,
                ),
              }
            : prev,
        );
      } else {
        setFlat((prev) =>
          prev.map((c) =>
            c.id === item.contentId
              ? {
                  ...c,
                  items: c.items.map((i) =>
                    i.id === item.id ? { ...i, data: json.item.data } : i,
                  ),
                }
              : c,
          ),
        );
      }
    }
  }

  async function addItem() {
    if (!selected) return;
    const res = await fetch(`/api/meeting-content/${selected.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: emptyItemData(selected.type) }),
    });
    if (res.ok) {
      const data = await res.json();
      setSelected((prev) =>
        prev ? { ...prev, items: [...prev.items, data.item] } : prev,
      );
    }
  }

  async function deleteItem(itemId: string) {
    if (!selected) return;
    const res = await fetch(`/api/meeting-content/items/${itemId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setSelected((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) }
          : prev,
      );
    }
  }

  async function addFlatItem() {
    let target = flat[0];
    if (!target) {
      const res = await fetch("/api/meeting-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, title: "" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      target = { ...data.content, items: [] };
    }
    const res = await fetch(`/api/meeting-content/${target.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: emptyItemData(tab) }),
    });
    if (res.ok) {
      const data = await res.json();
      setFlat((prev) =>
        prev.map((c) =>
          c.id === target.id ? { ...c, items: [...c.items, data.item] } : c,
        ),
      );
    }
  }

  async function deleteFlatItem(item: MeetingContentItem) {
    const res = await fetch(`/api/meeting-content/items/${item.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setFlat((prev) =>
        prev.map((c) =>
          c.id === item.contentId
            ? { ...c, items: c.items.filter((i) => i.id !== item.id) }
            : c,
        ),
      );
    }
  }

  const tabContents = contents
    .filter((c) => c.type === tab)
    .sort(
      (a, b) =>
        issueKey(b) - issueKey(a) || b.createdAt.localeCompare(a.createdAt),
    );
  const flatItems = flat
    .flatMap((c) => c.items)
    .sort((a, b) => numberKey(a) - numberKey(b));
  const songTitle = useCallback(
    (num: number | null | undefined) =>
      num == null ? null : (songTitles.get(num) ?? null),
    [songTitles],
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("meetingContent.title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("meetingContent.subtitle")}
        </p>
      </div>

      <div className="mb-8 flex gap-1.5 rounded-xl bg-muted p-1.5">
        {CONTENT_TABS.map(({ key, icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setSelected(null);
              }}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="mr-1.5">{icon}</span>
              {t(`meetingContent.tabs.${key}`)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : isFlat ? (
        <>
          {canManage && (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jwpub"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImport(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {uploading
                  ? t("meetingContent.importing")
                  : t("meetingContent.importFile")}
              </button>
              {uploadError && (
                <span className="text-sm text-red-500">{uploadError}</span>
              )}
            </div>
          )}
          <FlatView
            type={tab}
            items={flatItems}
            canManage={canManage}
            songTitle={songTitle}
            onAdd={addFlatItem}
            onSaveItem={saveItem}
            onDeleteItem={deleteFlatItem}
            onDeleteAll={() => void handleDeleteAll()}
          />
        </>
      ) : selected ? (
        <SelectedView
          content={selected}
          canManage={canManage}
          songTitle={songTitle}
          onBack={() => setSelected(null)}
          onSaveItem={saveItem}
          onAddItem={addItem}
          onDeleteItem={deleteItem}
        />
      ) : (
        <>
          {canManage && (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".jwpub"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImport(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {uploading
                  ? t("meetingContent.importing")
                  : t("meetingContent.importFile")}
              </button>
              <button
                type="button"
                onClick={handleCreateEmpty}
                className="rounded-xl bg-[#1F2937] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
              >
                {t("meetingContent.createEmpty")}
              </button>
              {uploadError && (
                <span className="text-sm text-red-500">{uploadError}</span>
              )}
            </div>
          )}

          {tabContents.length === 0 ? (
            <p className="text-muted-foreground">{t("meetingContent.empty")}</p>
          ) : (
            <div className="space-y-3">
              {tabContents.map((content) => (
                <ContentCard
                  key={content.id}
                  type={tab}
                  content={content}
                  canManage={canManage}
                  songTitle={songTitle}
                  expanded={inlineContent?.id === content.id}
                  inlineItems={
                    inlineContent?.id === content.id
                      ? inlineContent.items
                      : null
                  }
                  inlineLoading={
                    inlineLoading && inlineContent?.id !== content.id
                  }
                  onToggle={() => void toggleInline(content)}
                  onOpen={() => openContent(content)}
                  onDelete={() => handleDeleteContent(content.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ContentCard({
  type,
  content,
  canManage,
  songTitle,
  expanded,
  inlineItems,
  inlineLoading,
  onToggle,
  onOpen,
  onDelete,
}: {
  type: string;
  content: MeetingContent;
  canManage: boolean;
  songTitle: (num: number | null | undefined) => string | null;
  expanded: boolean;
  inlineItems: MeetingContentItem[] | null;
  inlineLoading: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const issue = formatContentIssue(type, content);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl bg-card shadow-sm ring-1 ring-border">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          {issue && (
            <p className="text-lg font-semibold text-[#2563EB]">{issue}</p>
          )}
          <p className="truncate font-medium">
            {content.title || t("meetingContent.untitled")}
          </p>
          <p className="text-sm text-muted-foreground">
            {[
              type === "apostila" ? content.coverTitle : null,
              content.symbol,
              t("meetingContent.itemCount", {
                count: content._count?.items ?? 0,
              }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="text-sm font-medium text-[#2563EB] hover:underline"
          >
            {expanded
              ? t("meetingContent.hideContent")
              : t("meetingContent.viewContent")}
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="text-sm font-medium text-[#2563EB] hover:underline"
          >
            {t("common.edit")}
          </button>
          {canManage && (
            <button
              type="button"
              onClick={onDelete}
              className="text-sm font-medium text-red-500 hover:underline"
            >
              {t("common.delete")}
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border px-5 py-4">
          {inlineLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          ) : inlineItems == null ? null : inlineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("meetingContent.noItems")}
            </p>
          ) : (
            <div className="space-y-3">
              {inlineItems.map((item) => {
                const itemExpanded = expandedItemId === item.id;
                return (
                  <div key={item.id} className="rounded-xl bg-muted/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <ItemSummary type={type} item={item} />
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedItemId(itemExpanded ? null : item.id)
                        }
                        className="shrink-0 text-sm font-medium text-[#2563EB] hover:underline"
                      >
                        {itemExpanded
                          ? t("meetingContent.hideContent")
                          : t("meetingContent.viewContent")}
                      </button>
                    </div>
                    {itemExpanded && (
                      <div className="mt-3">
                        <ItemDetail
                          type={type}
                          item={item}
                          songTitle={songTitle}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SelectedView({
  content,
  canManage,
  songTitle,
  onBack,
  onSaveItem,
  onAddItem,
  onDeleteItem,
}: {
  content: LoadedContent;
  canManage: boolean;
  songTitle: (num: number | null | undefined) => string | null;
  onBack: () => void;
  onSaveItem: (
    item: MeetingContentItem,
    data: Record<string, unknown>,
  ) => Promise<void>;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
}) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-medium text-[#2563EB] hover:underline"
      >
        ← {t("meetingContent.back")}
      </button>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          {formatContentIssue(content.type, content) && (
            <p className="text-lg font-semibold text-[#2563EB]">
              {formatContentIssue(content.type, content)}
            </p>
          )}
          <h2 className="truncate text-lg font-semibold">
            {content.title || t("meetingContent.untitled")}
          </h2>
          {content.coverTitle && (
            <p className="text-sm text-muted-foreground">
              {content.coverTitle}
            </p>
          )}
        </div>
        {canManage && (
          <button
            type="button"
            onClick={onAddItem}
            className="shrink-0 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            + {t("meetingContent.addItem")}
          </button>
        )}
      </div>

      {content.items.length === 0 ? (
        <p className="text-muted-foreground">{t("meetingContent.noItems")}</p>
      ) : (
        <div className="space-y-3">
          {content.items.map((item) => {
            const editing = editingId === item.id;
            const expanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <ItemSummary type={content.type} item={item} />
                  <div className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      className="text-sm font-medium text-[#2563EB] hover:underline"
                    >
                      {expanded
                        ? t("meetingContent.hideContent")
                        : t("meetingContent.viewContent")}
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingId(editing ? null : item.id)}
                          className="text-sm font-medium text-[#2563EB] hover:underline"
                        >
                          {editing ? t("common.cancel") : t("common.edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="text-sm font-medium text-red-500 hover:underline"
                        >
                          {t("common.remove")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {expanded && (
                  <ItemDetail
                    type={content.type}
                    item={item}
                    songTitle={songTitle}
                  />
                )}
                {editing && canManage && (
                  <ItemEditor
                    type={content.type}
                    item={item}
                    songTitle={songTitle}
                    onSave={async (data) => {
                      await onSaveItem(item, data);
                      setEditingId(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FlatView({
  type,
  items,
  canManage,
  songTitle,
  onAdd,
  onSaveItem,
  onDeleteItem,
  onDeleteAll,
}: {
  type: string;
  items: MeetingContentItem[];
  canManage: boolean;
  songTitle: (num: number | null | undefined) => string | null;
  onAdd: () => void;
  onSaveItem: (
    item: MeetingContentItem,
    data: Record<string, unknown>,
  ) => Promise<void>;
  onDeleteItem: (item: MeetingContentItem) => void;
  onDeleteAll: () => void;
}) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);

  const addButton = canManage ? (
    <button
      type="button"
      onClick={onAdd}
      className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
    >
      + {t("meetingContent.addItem")}
    </button>
  ) : null;

  return (
    <div>
      <div className="mb-4 flex justify-center">
        {items.length === 0 ? null : addButton}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-muted-foreground">{t("meetingContent.empty")}</p>
          {addButton}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const d = item.data as { number?: number | null; theme?: string };
            const editing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-card px-5 py-3 shadow-sm ring-1 ring-border"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-medium">
                    {d.number != null ? (
                      <span className="mr-1.5 font-semibold text-[#2563EB]">
                        {d.number}.
                      </span>
                    ) : null}
                    {d.theme || "—"}
                  </p>
                  {canManage && (
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(editing ? null : item.id)}
                        className="text-sm font-medium text-[#2563EB] hover:underline"
                      >
                        {editing ? t("common.cancel") : t("common.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="text-sm font-medium text-red-500 hover:underline"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  )}
                </div>
                {editing && canManage && (
                  <ItemEditor
                    type={type}
                    item={item}
                    songTitle={songTitle}
                    onSave={async (data) => {
                      await onSaveItem(item, data);
                      setEditingId(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 flex justify-center">{addButton}</div>
      )}

      {canManage && items.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onDeleteAll}
            className="text-sm font-medium text-red-500 hover:underline"
          >
            {t("meetingContent.removeAll")}
          </button>
        </div>
      )}
    </div>
  );
}

function ItemSummary({
  type,
  item,
}: {
  type: string;
  item: MeetingContentItem;
}) {
  const { t } = useTranslation();
  const data = item.data;

  if (type === "apostila") {
    const d = data as unknown as {
      semana?: string;
      dateRange?: string;
      secoes?: unknown[];
    };
    return (
      <div className="min-w-0">
        <p className="truncate font-medium">{d.semana || "—"}</p>
        <p className="text-sm text-muted-foreground">
          {[
            formatWeekRange(d.dateRange),
            t("meetingContent.sectionCount", { count: d.secoes?.length ?? 0 }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    );
  }

  if (type === "sentinela") {
    const d = data as unknown as { week?: string; theme?: string };
    return (
      <div className="min-w-0">
        <p className="truncate font-medium">{d.theme || "—"}</p>
        <p className="text-sm text-muted-foreground">{d.week}</p>
      </div>
    );
  }

  const d = data as unknown as { number?: number | null; theme?: string };
  return (
    <div className="min-w-0">
      <p className="truncate font-medium">
        {d.number != null ? `${d.number}. ` : ""}
        {d.theme || "—"}
      </p>
    </div>
  );
}

function formatWeekRange(dateRange: string | undefined): string {
  if (!dateRange) return "";
  const m = dateRange.match(/^(\d{4})(\d{2})(\d{2})-(\d{4})(\d{2})(\d{2})$/);
  if (!m) return dateRange;
  const [, y1, m1, d1, y2, m2, d2] = m;
  if (y1 === y2 && m1 === m2) {
    return `${d1}-${d2}/${m1}/${y1}`;
  }
  return `${d1}/${m1}/${y1} - ${d2}/${m2}/${y2}`;
}

function ItemDetail({
  type,
  item,
  songTitle,
}: {
  type: string;
  item: MeetingContentItem;
  songTitle: (num: number | null | undefined) => string | null;
}) {
  const { t } = useTranslation();
  const data = item.data as Record<string, unknown>;

  if (type === "apostila") {
    const d = data as unknown as {
      secoes?: Array<{
        secao?: string;
        cancionMedia?: number | null;
        partes?: Array<{
          order?: number;
          parte?: string;
          tema?: string;
          tempo?: string;
          modalidade?: string | null;
          fonte?: string | null;
        }>;
      }>;
    };
    const secoes = d.secoes ?? [];
    return (
      <div className="space-y-4 rounded-xl bg-muted/50 p-4">
        {secoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("meetingContent.noItems")}
          </p>
        ) : (
          secoes.map((sec, si) => (
            <div key={`${sec.secao ?? si}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold">{sec.secao || "—"}</p>
                {sec.cancionMedia != null && (
                  <span className="text-sm text-muted-foreground">
                    {t("meetingContent.middleSong")}: {sec.cancionMedia}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {(sec.partes ?? []).map((p, pi) => (
                  <div key={`${p.order}-${p.parte}-${pi}`} className="text-sm">
                    <span className="font-medium">
                      {p.order != null ? `${p.order}. ` : ""}
                      {p.parte || "—"}
                    </span>
                    {p.tema && p.tema !== p.parte ? ` — ${p.tema}` : ""}
                    <span className="text-muted-foreground">
                      {[p.tempo, p.modalidade, p.fonte]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  if (type === "sentinela") {
    const d = data as unknown as {
      week?: string;
      theme?: string;
      songs?: {
        opening?: { number?: number | null; title?: string };
        closing?: { number?: number | null; title?: string };
      };
    };
    return (
      <div className="space-y-1.5 rounded-xl bg-muted/50 p-4 text-sm">
        <p>
          <span className="font-medium">{t("meetingContent.theme")}: </span>
          {d.theme || "—"}
        </p>
        <p>
          <span className="font-medium">{t("meetingContent.week")}: </span>
          {d.week || "—"}
        </p>
        <p>
          <span className="font-medium">
            {t("meetingContent.openingSong")}:{" "}
          </span>
          {d.songs?.opening?.number != null ? d.songs.opening.number : "—"}
          {songTitle(d.songs?.opening?.number)
            ? ` — ${songTitle(d.songs?.opening?.number)}`
            : ""}
        </p>
        <p>
          <span className="font-medium">
            {t("meetingContent.closingSong")}:{" "}
          </span>
          {d.songs?.closing?.number != null ? d.songs.closing.number : "—"}
          {songTitle(d.songs?.closing?.number)
            ? ` — ${songTitle(d.songs?.closing?.number)}`
            : ""}
        </p>
      </div>
    );
  }

  const d = data as unknown as { theme?: string };
  return (
    <div className="rounded-xl bg-muted/50 p-4 text-sm">{d.theme || "—"}</div>
  );
}
