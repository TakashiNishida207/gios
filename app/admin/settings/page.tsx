// app/admin/settings/page.tsx
// グローバル設定 — フィーチャーフラグとインテリジェンス設定

"use client";

import { useState, useEffect, useCallback } from "react";
import type { FeatureFlag } from "@/admin/types";
import {
  AdminTable, Column, DetailPanel, EditDrawer, PageHeader, FormField,
  DetailRow, SectionHeader, PrimaryButton, inputStyle,
} from "@/admin/components";

type FlagForm = { key: string; value: string; description: string; intelligence_code: string; tenant_id: string };
const DEFAULT_FORM: FlagForm = { key: "", value: "true", description: "", intelligence_code: "", tenant_id: "" };

const COLUMNS: Column<FeatureFlag>[] = [
  { key: "key",               label: "Key",         render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{r.key}</span>, width: "30%" },
  { key: "value",             label: "Value",       render: (r) => <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--green)" }}>{JSON.stringify(r.value)}</span>, width: "15%" },
  { key: "intelligence_code", label: "Intelligence",render: (r) => r.intelligence_code ?? "global",    width: "20%" },
  { key: "tenant_id",         label: "Scope",       render: (r) => r.tenant_id ? "tenant" : "global",  width: "15%" },
  { key: "description",       label: "Description", render: (r) => r.description,                      width: "20%" },
];

export default function SettingsPage() {
  const [flags,    setFlags]    = useState<FeatureFlag[]>([]);
  const [selected, setSelected] = useState<FeatureFlag | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [drawer,   setDrawer]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState<FlagForm>(DEFAULT_FORM);
  const [isNew,    setIsNew]    = useState(false);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/tenants");  // get tenants for context
    const supaRes = await fetch("/api/admin/audit?entity_type=feature_flag&limit=0"); // just for structure
    // For feature flags, we call directly via Supabase — but since we don't have a dedicated route
    // we'll use a placeholder and note that /api/admin/settings route should be added
    // For now show empty state with creation ability
    setFlags([]);
    setLoading(false);
    void res; void supaRes;
  }, []);

  useEffect(() => { loadFlags(); }, [loadFlags]);

  const openNew = () => {
    setIsNew(true);
    setForm(DEFAULT_FORM);
    setDrawer(true);
  };

  const openEdit = () => {
    if (!selected) return;
    setIsNew(false);
    setForm({
      key: selected.key,
      value: JSON.stringify(selected.value),
      description: selected.description,
      intelligence_code: selected.intelligence_code ?? "",
      tenant_id: selected.tenant_id ?? "",
    });
    setDrawer(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedValue: unknown = form.value;
      try { parsedValue = JSON.parse(form.value); } catch { parsedValue = form.value; }
      const payload = {
        key:               form.key,
        value:             parsedValue,
        description:       form.description,
        intelligence_code: form.intelligence_code || null,
        tenant_id:         form.tenant_id         || null,
      };
      // POST to a feature_flags endpoint (to be added later)
      console.info("[settings] save feature flag", payload);
      setDrawer(false);
      await loadFlags();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        tag="Admin OS"
        title="Settings"
        description="グローバルフィーチャーフラグとインテリジェンス設定を管理する"
        action={<PrimaryButton onClick={openNew}>+ New Flag</PrimaryButton>}
      />

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: selected ? "60% 40%" : "1fr", overflow: "hidden" }}>
        <div style={{ overflowY: "auto" }}>
          {flags.length === 0 && !loading ? (
            <div style={{ padding: "48px 28px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8 }}>
                No feature flags configured
              </p>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                Feature flags allow granular control over intelligence features per tenant.
              </p>
            </div>
          ) : (
            <AdminTable columns={COLUMNS} rows={flags} selectedId={selected?.id} onSelect={setSelected} loading={loading} emptyMessage="No flags" />
          )}
        </div>

        {selected && (
          <DetailPanel title={selected.key} subtitle={selected.intelligence_code ?? "global"} onClose={() => setSelected(null)} onEdit={openEdit}>
            <DetailRow label="Key"          value={<span style={{ fontFamily: "var(--mono)" }}>{selected.key}</span>} />
            <DetailRow label="Value"        value={<span style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>{JSON.stringify(selected.value)}</span>} />
            <DetailRow label="Intelligence" value={selected.intelligence_code ?? "global"} />
            <DetailRow label="Scope"        value={selected.tenant_id ? "tenant-specific" : "global"} />
            <DetailRow label="Description"  value={selected.description} />
            <DetailRow label="Updated"      value={new Date(selected.updated_at).toLocaleString()} />
          </DetailPanel>
        )}
      </div>

      <EditDrawer title={isNew ? "New Feature Flag" : "Edit Feature Flag"} open={drawer} onClose={() => setDrawer(false)} onSave={handleSave} saving={saving}>
        <FormField label="Key">
          <input style={inputStyle} value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} placeholder="feature.name" />
        </FormField>
        <FormField label="Value (JSON)">
          <input style={inputStyle} value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder='true or "string" or 42' />
        </FormField>
        <FormField label="Intelligence Code (optional)">
          <input style={inputStyle} value={form.intelligence_code} onChange={(e) => setForm((f) => ({ ...f, intelligence_code: e.target.value }))} placeholder="growth, pmf, ..." />
        </FormField>
        <FormField label="Tenant ID (optional — blank = global)">
          <input style={inputStyle} value={form.tenant_id} onChange={(e) => setForm((f) => ({ ...f, tenant_id: e.target.value }))} placeholder="uuid or leave blank" />
        </FormField>
        <FormField label="Description">
          <input style={inputStyle} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this flag controls" />
        </FormField>
      </EditDrawer>
    </div>
  );
}
