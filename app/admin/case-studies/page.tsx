"use client";

import { useEffect, useState } from "react";
import {
  confirmAsset,
  createAdminCategory,
  createCaseStudy,
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);
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
      setMessage("Case study saved.");
      setForm(defaultForm);
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

  async function onUploadSelectedFile() {
    if (!uploadFile) {
      setFieldError("Select a file before uploading.");
      return;
    }
    setSaving(true);
    setMessage(null);
    setFieldError(null);
    try {
      const { uploadUrl, r2Key } = await signUpload({
        filename: uploadFile.name,
        contentType: uploadFile.type || "application/octet-stream",
        caseStudySlug: form.slug || form.title || "unassigned",
      });
      await uploadFileToSignedUrl(uploadUrl, uploadFile);
      const image = await confirmAsset({
        r2Key,
        alt: uploadFile.name,
        sortOrder: form.images.length + 1,
      });
      setField("images", [...form.images, image]);
      setUploadFile(null);
      setMessage("Image uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to upload image.");
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

  function loadForEdit(item: CaseStudy) {
    setForm({
      id: item.id,
      title: item.title ?? "",
      slug: item.slug ?? "",
      shortDescription: item.shortDescription ?? "",
      categoryIds: item.categoryIds ?? [],
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
    <main className="stack">
      <h1>Case Studies</h1>
      <div className="panel stack">
        <h2>{form.id ? "Edit Case Study" : "Create Case Study"}</h2>
        {fieldError && <p className="error-text">{fieldError}</p>}
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
        />
        <input
          placeholder="Slug (optional)"
          value={form.slug}
          onChange={(e) => setField("slug", e.target.value)}
        />
        <textarea
          placeholder="Short description"
          value={form.shortDescription}
          onChange={(e) => setField("shortDescription", e.target.value)}
        />
        <div className="stack">
          <strong>Categories</strong>
          <div className="stack">
            {categories.map((category) => {
              const selected = form.categoryIds.includes(category.id);
              return (
                <label key={category.id} className="row" style={{ width: "100%" }}>
                  <div className="row" style={{ flex: 1 }}>
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
                    <span>{category.name}</span>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={(e) => {
                      e.preventDefault();
                      void onDeleteCategory(category);
                    }}
                  >
                    Delete
                  </button>
                </label>
              );
            })}
          </div>
        </div>
        <div className="row">
          <input
            placeholder="New category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <button type="button" onClick={onCreateCategory} disabled={saving}>
            Add Category
          </button>
        </div>
        <input
          placeholder="Tags CSV (e.g. saas, analytics)"
          value={form.tagsCsv}
          onChange={(e) => setField("tagsCsv", e.target.value)}
        />
        <div className="row">
          <input
            placeholder="Accent color"
            value={form.accentColor}
            onChange={(e) => setField("accentColor", e.target.value)}
          />
          <input
            placeholder="Background color"
            value={form.backgroundColor}
            onChange={(e) => setField("backgroundColor", e.target.value)}
          />
        </div>
        <div className="stack">
          <strong>Timeline Steps</strong>
          {form.timelineSteps.map((step, index) => (
            <div key={index} className="panel stack">
              <input
                placeholder="Step name"
                value={step.name}
                onChange={(e) => {
                  const next = [...form.timelineSteps];
                  next[index] = { ...next[index], name: e.target.value };
                  setField("timelineSteps", next);
                }}
              />
              <input
                type="number"
                min={1}
                placeholder="Duration weeks"
                value={step.durationWeeks}
                onChange={(e) => {
                  const next = [...form.timelineSteps];
                  next[index] = { ...next[index], durationWeeks: Number(e.target.value) || 1 };
                  setField("timelineSteps", next);
                }}
              />
              <textarea
                placeholder="Summary"
                value={step.summary}
                onChange={(e) => {
                  const next = [...form.timelineSteps];
                  next[index] = { ...next[index], summary: e.target.value };
                  setField("timelineSteps", next);
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (form.timelineSteps.length === 1) return;
                  setField(
                    "timelineSteps",
                    form.timelineSteps.filter((_, i) => i !== index)
                  );
                }}
              >
                Remove Step
              </button>
            </div>
          ))}
          <button
            type="button"
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
            Add Timeline Step
          </button>
        </div>
        <div className="stack">
          <strong>Images</strong>
          <p className="status-text">R2 keys are managed automatically by uploads.</p>
          <div className="row">
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              disabled={saving}
            />
            <button type="button" onClick={onUploadSelectedFile} disabled={saving || !uploadFile}>
              Upload
            </button>
          </div>
          {form.images.map((image, index) => (
            <div key={index} className="panel stack">
              <input
                placeholder="Alt text"
                value={image.alt}
                onChange={(e) => {
                  const next = [...form.images];
                  next[index] = { ...next[index], alt: e.target.value };
                  setField("images", next);
                }}
              />
              {image.r2Key ? (
                <div className="row">
                  <span className="status-text">Image linked</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(image.r2Key);
                        setMessage("R2 key copied.");
                      } catch {
                        setMessage("Failed to copy R2 key.");
                      }
                    }}
                  >
                    Copy key
                  </button>
                </div>
              ) : (
                <span className="status-text">No image linked yet</span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (form.images.length === 1) return;
                  setField(
                    "images",
                    form.images.filter((_, i) => i !== index)
                  );
                }}
              >
                Remove Image
              </button>
              <div className="row">
                <button
                  type="button"
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...form.images];
                    const temp = next[index - 1];
                    next[index - 1] = next[index];
                    next[index] = temp;
                    setField(
                      "images",
                      next.map((img, i) => ({ ...img, sortOrder: i + 1 }))
                    );
                  }}
                >
                  Move Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (index === form.images.length - 1) return;
                    const next = [...form.images];
                    const temp = next[index + 1];
                    next[index + 1] = next[index];
                    next[index] = temp;
                    setField(
                      "images",
                      next.map((img, i) => ({ ...img, sortOrder: i + 1 }))
                    );
                  }}
                >
                  Move Down
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setField("images", [
                ...form.images,
                { r2Key: "", alt: "", sortOrder: form.images.length + 1 },
              ])
            }
          >
            Add Image
          </button>
        </div>
        <div className="row">
          <input
            type="number"
            placeholder="Sort order"
            value={form.sortOrder}
            onChange={(e) => setField("sortOrder", Number(e.target.value) || 0)}
          />
          <label className="row">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField("isActive", e.target.checked)}
            />
            <span>Active</span>
          </label>
        </div>
        <div className="row">
          <button type="button" onClick={onSaveCaseStudy} disabled={saving}>
            {saving ? "Saving..." : form.id ? "Update Case Study" : "Create Case Study"}
          </button>
          <button type="button" onClick={() => setForm(defaultForm)} disabled={saving}>
            Reset
          </button>
        </div>
      </div>
      <div className="panel stack">
        {loading && <p>Loading...</p>}
        {message && <p className="status-text">{message}</p>}
        {!loading && !message && items.length === 0 && <p>No case studies yet.</p>}
        {!loading &&
          items.map((item) => (
            <div className="panel stack" key={item.id}>
              <div className="row">
                <strong>{item.title}</strong>
                <span>{item.isActive ? "Active" : "Hidden"}</span>
              </div>
              <div className="row">
                <code>{item.slug}</code>
                <span>sort: {item.sortOrder}</span>
              </div>
              <button type="button" onClick={() => loadForEdit(item)}>
                Edit
              </button>
            </div>
          ))}
      </div>
    </main>
  );
}
