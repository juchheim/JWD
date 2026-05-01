"use client";

import "./admin.css";
import { useEffect, useState } from "react";
import {
  confirmAsset,
  createAdminCategory,
  createCaseStudy,
  deleteCaseStudy,
  deleteAdminCategory,
  fetchAdminCaseStudies,
  fetchAdminCategories,
  signUpload,
  type AdminCategory,
  type CaseStudyImageInput,
  type TimelineStepInput,
  uploadFileToSignedUrl,
  updateCaseStudy,
} from "../../../lib/api";

type CaseStudy = {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  categories?: string[];
  categoryIds?: string[];
  tags?: string[];
  accentColor?: string;
  backgroundColor?: string;
  timelineSteps?: TimelineStepInput[];
  images?: CaseStudyImageInput[];
  isActive: boolean;
  sortOrder: number;
};

type CaseStudyFormState = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  categoryIds: string[];
  tagsCsv: string;
  accentColor: string;
  backgroundColor: string;
  timelineSteps: TimelineStepInput[];
  images: CaseStudyImageInput[];
  sortOrder: number;
  isActive: boolean;
};

const defaultForm: CaseStudyFormState = {
  title: "",
  slug: "",
  shortDescription: "",
  categoryIds: [],
  tagsCsv: "",
  accentColor: "#00d4a8",
  backgroundColor: "#0a2218",
  timelineSteps: [{ name: "Discovery", durationWeeks: 1, summary: "", sortOrder: 1 }],
  images: [{ r2Key: "", alt: "", sortOrder: 1 }],
  sortOrder: 0,
  isActive: true,
};

export default function AdminCaseStudiesPage() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<CaseStudyFormState>(defaultForm);
  const [categoryName, setCategoryName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      try {
        const [caseStudiesData, categoriesData] = await Promise.all([
          fetchAdminCaseStudies(),
          fetchAdminCategories(),
        ]);
        setItems((caseStudiesData as CaseStudy[]) ?? []);
        setCategories(categoriesData);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, []);

  function setField<K extends keyof CaseStudyFormState>(key: K, value: CaseStudyFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function refreshLists() {
    const [caseStudiesData, categoriesData] = await Promise.all([
      fetchAdminCaseStudies(),
      fetchAdminCategories(),
    ]);
    setItems((caseStudiesData as CaseStudy[]) ?? []);
    setCategories(categoriesData);
  }

  async function onSaveCaseStudy() {
    setSaving(true);
    setMessage(null);
    setFieldError(null);

    if (!form.title.trim()) {
      setFieldError("Title is required.");
      setSaving(false);
      return;
    }
    if (!form.shortDescription.trim()) {
      setFieldError("Short description is required.");
      setSaving(false);
      return;
    }
    if (form.categoryIds.length < 1) {
      setFieldError("Select at least one category.");
      setSaving(false);
      return;
    }
    if (form.timelineSteps.length < 1) {
      setFieldError("Add at least one timeline step.");
      setSaving(false);
      return;
    }

    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        shortDescription: form.shortDescription,
        categoryIds: form.categoryIds,
        tags: form.tagsCsv
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        accentColor: form.accentColor,
        backgroundColor: form.backgroundColor,
        timelineSteps: form.timelineSteps,
        images: form.images.filter((img) => img.r2Key.trim().length > 0),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      const optimisticTitle = form.title.trim();
      const optimisticSlug = form.slug.trim() || optimisticTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const optimisticCaseStudy: CaseStudy = {
        id: form.id ?? `tmp-${Date.now()}`,
        title: optimisticTitle,
        slug: optimisticSlug,
        shortDescription: form.shortDescription,
        categoryIds: form.categoryIds,
        tags: payload.tags,
        accentColor: form.accentColor,
        backgroundColor: form.backgroundColor,
        timelineSteps: form.timelineSteps,
        images: payload.images,
        sortOrder: payload.sortOrder,
        isActive: form.isActive,
      };

      // Optimistic UI update so the list immediately reflects edits.
      setItems((prev) => {
        if (form.id) {
          return prev.map((item) => (item.id === form.id ? optimisticCaseStudy : item));
        }
        return [optimisticCaseStudy, ...prev];
      });

      if (form.id) {
        await updateCaseStudy(form.id, payload);
      } else {
        await createCaseStudy(payload);
      }

      await refreshLists();
      if (form.id) {
        setMessage("Case study updated.");
      } else {
        setMessage("Case study saved.");
        setForm(defaultForm);
      }
    } catch (error) {
      // Roll back optimistic list if API call fails.
      await refreshLists();
      setMessage(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function onCreateCategory() {
    if (!categoryName.trim()) return;
    setSaving(true);
    setMessage(null);
    setFieldError(null);
    try {
      const optimisticName = categoryName.trim();
      const optimisticCategory: AdminCategory = {
        id: `tmp-${Date.now()}`,
        name: optimisticName,
        slug: optimisticName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sortOrder: 0,
      };
      setCategories((prev) => [optimisticCategory, ...prev]);
      await createAdminCategory({ name: optimisticName });
      setCategoryName("");
      await refreshLists();
      setMessage("Category created.");
    } catch (error) {
      await refreshLists();
      setMessage(error instanceof Error ? error.message : "Failed to create category.");
    } finally {
      setSaving(false);
    }
  }

  async function onUploadSelectedFiles() {
    if (uploadFiles.length < 1) {
      setFieldError("Select one or more files before uploading.");
      return;
    }
    setSaving(true);
    setMessage(null);
    setFieldError(null);
    try {
      const uploadedImages: CaseStudyImageInput[] = [];
      const startSortOrder = form.images.length + 1;
      for (let i = 0; i < uploadFiles.length; i += 1) {
        const file = uploadFiles[i];
        const { uploadUrl, r2Key } = await signUpload({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          caseStudySlug: form.slug || form.title || "unassigned",
        });
        await uploadFileToSignedUrl(uploadUrl, file);
        const image = await confirmAsset({
          r2Key,
          alt: file.name,
          sortOrder: startSortOrder + i,
        });
        uploadedImages.push(image);
      }
      setField("images", [...form.images, ...uploadedImages]);
      setUploadFiles([]);
      setMessage(
        uploadedImages.length === 1
          ? "1 image uploaded."
          : `${uploadedImages.length} images uploaded.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to upload images.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteCategory(category: AdminCategory) {
    const confirmed = window.confirm(
      `Delete category "${category.name}"? This only works if it is not assigned to any case studies.`
    );
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);
    setFieldError(null);
    try {
      await deleteAdminCategory(category.id);
      setForm((prev) => ({
        ...prev,
        categoryIds: prev.categoryIds.filter((id) => id !== category.id),
      }));
      await refreshLists();
      setMessage("Category deleted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete category.";
      setMessage(
        message.includes("assigned to one or more case studies")
          ? 'Cannot delete: category is still used by one or more case studies. Remove it from those case studies first.'
          : message
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteCaseStudy(item: CaseStudy) {
    const confirmed = window.confirm(`Delete case study "${item.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);
    setFieldError(null);
    try {
      await deleteCaseStudy(item.id);
      if (form.id === item.id) {
        setForm(defaultForm);
      }
      await refreshLists();
      setMessage("Case study deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to delete case study.");
    } finally {
      setSaving(false);
    }
  }

  function resolveCategoryIdsForEdit(item: CaseStudy): string[] {
    if (item.categoryIds && item.categoryIds.length > 0) return item.categoryIds;
    if (!item.categories || item.categories.length === 0) return [];
    const byLowerName = new Map(categories.map((category) => [category.name.toLowerCase(), category.id]));
    const resolved = item.categories
      .map((name) => byLowerName.get(name.toLowerCase()) ?? null)
      .filter((id): id is string => Boolean(id));
    return Array.from(new Set(resolved));
  }

  function loadForEdit(item: CaseStudy) {
    setForm({
      id: item.id,
      title: item.title ?? "",
      slug: item.slug ?? "",
      shortDescription: item.shortDescription ?? "",
      categoryIds: resolveCategoryIdsForEdit(item),
      tagsCsv: (item.tags ?? []).join(", "),
      accentColor: item.accentColor ?? "#00d4a8",
      backgroundColor: item.backgroundColor ?? "#0a2218",
      timelineSteps:
        item.timelineSteps && item.timelineSteps.length > 0
          ? item.timelineSteps
          : [{ name: "Discovery", durationWeeks: 1, summary: "", sortOrder: 1 }],
      images:
        item.images && item.images.length > 0
          ? item.images
          : [{ r2Key: "", alt: "", sortOrder: 1 }],
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive ?? true,
    });
  }

  return (
    <main className="admin-container">
      <header className="admin-header">
        <h1>Case Studies</h1>
        <p>Manage your portfolio case studies</p>
      </header>

      <div className="admin-content">
        {/* LEFT COLUMN: Main Form */}
        <div className="admin-form-column">
          <div className="admin-card glass-panel">
            <h2>{form.id ? "Edit Case Study" : "Create Case Study"}</h2>
            {fieldError && <div style={{ color: "#fca5a5", padding: "0.5rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "6px", marginBottom: "1rem" }}>{fieldError}</div>}
            {message && <div style={{ color: "#34d399", padding: "0.5rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "6px", marginBottom: "1rem" }}>{message}</div>}

            <div className="form-group">
              <label>Title</label>
              <input
                className="admin-input"
                placeholder="e.g. Acme Corp Rebranding"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Slug</label>
              <input
                className="admin-input"
                placeholder="Optional (auto-generated from title)"
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
              />
              <span className="hint">The URL-friendly name for this case study.</span>
            </div>

            <div className="form-group">
              <label>Short Description</label>
              <textarea
                className="admin-textarea"
                placeholder="A brief overview of the project..."
                value={form.shortDescription}
                onChange={(e) => setField("shortDescription", e.target.value)}
              />
            </div>
          </div>

          <div className="admin-card glass-panel">
            <h3>Timeline Steps</h3>
            {form.timelineSteps.map((step, index) => (
              <div key={index} className="timeline-step stack">
                <div className="timeline-header">
                  <div className="flex-row">
                    <span className="step-number">{index + 1}</span>
                    <strong>Step {index + 1}</strong>
                  </div>
                  {form.timelineSteps.length > 1 && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => {
                        setField(
                          "timelineSteps",
                          form.timelineSteps.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="flex-row" style={{ alignItems: "start" }}>
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <label>Step Name</label>
                    <input
                      className="admin-input"
                      placeholder="e.g. Discovery"
                      value={step.name}
                      onChange={(e) => {
                        const next = [...form.timelineSteps];
                        next[index] = { ...next[index], name: e.target.value };
                        setField("timelineSteps", next);
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Duration (Weeks)</label>
                    <input
                      type="number"
                      className="admin-input"
                      min={1}
                      placeholder="Weeks"
                      value={step.durationWeeks}
                      onChange={(e) => {
                        const next = [...form.timelineSteps];
                        next[index] = { ...next[index], durationWeeks: Number(e.target.value) || 1 };
                        setField("timelineSteps", next);
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Summary</label>
                  <textarea
                    className="admin-textarea"
                    placeholder="Describe what happened during this phase..."
                    value={step.summary}
                    onChange={(e) => {
                      const next = [...form.timelineSteps];
                      next[index] = { ...next[index], summary: e.target.value };
                      setField("timelineSteps", next);
                    }}
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setField("timelineSteps", [
                  ...form.timelineSteps,
                  {
                    name: "",
                    durationWeeks: 1,
                    summary: "",
                    sortOrder: form.timelineSteps.length + 1,
                  },
                ])
              }
            >
              + Add Timeline Step
            </button>
          </div>

          <div className="admin-card glass-panel">
            <h3>Images</h3>
            <span className="hint" style={{ marginBottom: "1rem", display: "block" }}>
              Upload and manage images for this case study. R2 keys are managed automatically.
            </span>

            <div className="upload-area stack">
              <input
                id="file-upload"
                type="file"
                multiple
                className="upload-input"
                onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))}
                disabled={saving}
              />
              <label htmlFor="file-upload" className="upload-label">
                Choose Files to Upload
              </label>
              
              {uploadFiles.length > 0 && (
                <div className="stack" style={{ marginTop: "1rem", textAlign: "left" }}>
                  <strong>Selected files ({uploadFiles.length}):</strong>
                  <div className="category-list" style={{ maxHeight: "100px" }}>
                    {uploadFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="category-item">
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-row" style={{ marginTop: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: "0.5rem 1rem" }}
                      onClick={onUploadSelectedFiles}
                      disabled={saving || uploadFiles.length < 1}
                    >
                      Upload Selected
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "0.5rem 1rem" }}
                      onClick={() => setUploadFiles([])}
                      disabled={saving || uploadFiles.length < 1}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="stack" style={{ marginTop: "2rem" }}>
              {form.images.map((image, index) => (
                <div key={index} className="image-card">
                  <div className="image-card-header">
                    <strong>Image {index + 1}</strong>
                    <div className="image-actions">
                      <button
                        type="button"
                        className="btn-outline-sm"
                        disabled={index === 0}
                        onClick={() => {
                          const next = [...form.images];
                          const temp = next[index - 1];
                          next[index - 1] = next[index];
                          next[index] = temp;
                          setField("images", next.map((img, i) => ({ ...img, sortOrder: i + 1 })));
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn-outline-sm"
                        disabled={index === form.images.length - 1}
                        onClick={() => {
                          const next = [...form.images];
                          const temp = next[index + 1];
                          next[index + 1] = next[index];
                          next[index] = temp;
                          setField("images", next.map((img, i) => ({ ...img, sortOrder: i + 1 })));
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => {
                          if (form.images.length === 1) return;
                          setField("images", form.images.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Alt Text</label>
                    <input
                      className="admin-input"
                      placeholder="Describe the image..."
                      value={image.alt}
                      onChange={(e) => {
                        const next = [...form.images];
                        next[index] = { ...next[index], alt: e.target.value };
                        setField("images", next);
                      }}
                    />
                  </div>

                  <div className="flex-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    {image.r2Key ? (
                      <span className="status-badge">Linked: {image.r2Key.slice(0, 15)}...</span>
                    ) : (
                      <span className="status-badge inactive">No image linked yet</span>
                    )}
                    
                    {image.r2Key && (
                      <button
                        type="button"
                        className="btn-outline-sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(image.r2Key);
                            setMessage("R2 key copied.");
                          } catch {
                            setMessage("Failed to copy R2 key.");
                          }
                        }}
                      >
                        Copy Key
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setField("images", [
                    ...form.images,
                    { r2Key: "", alt: "", sortOrder: form.images.length + 1 },
                  ])
                }
              >
                + Add Image Reference
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="admin-sidebar stack">
          <div className="admin-card glass-panel">
            <h3>Publishing</h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                <span>Active (Visible on Site)</span>
              </label>
            </div>

            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                className="admin-input"
                placeholder="0"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", Number(e.target.value) || 0)}
              />
              <span className="hint">Higher numbers appear later.</span>
            </div>

            <div className="stack" style={{ marginTop: "1.5rem" }}>
              <button type="button" className="btn-primary" onClick={onSaveCaseStudy} disabled={saving}>
                {saving ? "Saving..." : form.id ? "Update Case Study" : "Create Case Study"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setForm(defaultForm)} disabled={saving}>
                Reset Form
              </button>
            </div>
          </div>

          <div className="admin-card glass-panel">
            <h3>Appearance</h3>
            
            <div className="form-group">
              <label>Accent Color</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  className="color-picker-input"
                  value={form.accentColor}
                  onChange={(e) => setField("accentColor", e.target.value)}
                />
                <input
                  type="text"
                  className="color-text-input"
                  value={form.accentColor}
                  onChange={(e) => setField("accentColor", e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Background Color</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  className="color-picker-input"
                  value={form.backgroundColor}
                  onChange={(e) => setField("backgroundColor", e.target.value)}
                />
                <input
                  type="text"
                  className="color-text-input"
                  value={form.backgroundColor}
                  onChange={(e) => setField("backgroundColor", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="admin-card glass-panel">
            <h3>Organization</h3>
            
            <div className="form-group">
              <label>Categories</label>
              <div className="category-list">
                {categories.map((category) => {
                  const selected = form.categoryIds.includes(category.id);
                  return (
                    <div key={category.id} className={`category-item ${selected ? 'active' : ''}`}>
                      <label className="checkbox-label" style={{ padding: 0 }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setField(
                              "categoryIds",
                              checked
                                ? [...form.categoryIds, category.id]
                                : form.categoryIds.filter((id) => id !== category.id)
                            );
                          }}
                        />
                        <span style={{ fontSize: "0.9rem" }}>{category.name}</span>
                      </label>
                      <button
                        type="button"
                        className="delete-btn"
                        disabled={saving}
                        onClick={(e) => {
                          e.preventDefault();
                          void onDeleteCategory(category);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex-row" style={{ marginTop: "1rem" }}>
                <input
                  className="admin-input"
                  style={{ flex: 1 }}
                  placeholder="New category..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onCreateCategory(); } }}
                />
                <button type="button" className="btn-secondary" style={{ width: "auto" }} onClick={onCreateCategory} disabled={saving || !categoryName.trim()}>
                  Add
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0, marginTop: "1.5rem" }}>
              <label>Tags (CSV)</label>
              <input
                className="admin-input"
                placeholder="e.g. saas, analytics, web3"
                value={form.tagsCsv}
                onChange={(e) => setField("tagsCsv", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Existing Case Studies */}
      <div className="admin-card glass-panel list-section">
        <h2>Existing Case Studies</h2>
        
        {loading && <p>Loading case studies...</p>}
        {!loading && items.length === 0 && <p className="hint">No case studies yet.</p>}
        
        {!loading && items.length > 0 && (
          <div className="case-study-list">
            {items.map((item) => (
              <div className="case-study-item" key={item.id}>
                <div className="case-study-info">
                  <h4>{item.title}</h4>
                  <div className="case-study-meta">
                    <span className={`status-badge ${!item.isActive ? 'inactive' : ''}`}>
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                    <span>/{item.slug}</span>
                    <span>Sort: {item.sortOrder}</span>
                  </div>
                </div>
                <div className="flex-row">
                  <button type="button" className="btn-secondary" style={{ width: "auto" }} onClick={() => {
                    loadForEdit(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}>
                    Edit
                  </button>
                  <button type="button" className="btn-outline-sm delete-btn" disabled={saving} onClick={() => void onDeleteCaseStudy(item)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
