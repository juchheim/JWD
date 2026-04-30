const API_BASE_URL = "/api/worker";

type ApiError = {
  error?: {
    code?: string;
    message?: string;
    details?: {
      usedBy?: Array<{
        id?: string;
        title?: string;
        slug?: string;
      }>;
    };
  };
};

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export async function loginAdmin(password: string): Promise<{ ok: boolean; expiresAt?: string }> {
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password }),
  });

  const body = await parseJson<{ ok?: boolean; expiresAt?: string } & ApiError>(response);
  if (!response.ok || !body.ok) {
    throw new Error(body.error?.message || "Login failed.");
  }
  return { ok: true, expiresAt: body.expiresAt };
}

export async function fetchAdminCaseStudies(): Promise<unknown[]> {
  const response = await fetch(`${API_BASE_URL}/admin/case-studies`, {
    credentials: "include",
    cache: "no-store",
  });
  const body = await parseJson<{ caseStudies?: unknown[] } & ApiError>(response);
  if (!response.ok) {
    throw new Error(body.error?.message || "Failed to fetch case studies.");
  }
  return body.caseStudies ?? [];
}

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};

export type TimelineStepInput = {
  id?: string;
  name: string;
  durationWeeks: number;
  summary: string;
  sortOrder: number;
};

export type CaseStudyImageInput = {
  r2Key: string;
  alt: string;
  sortOrder: number;
};

export type CaseStudyWritePayload = {
  title: string;
  slug?: string;
  shortDescription: string;
  categoryIds: string[];
  tags: string[];
  accentColor: string;
  backgroundColor: string;
  timelineSteps: TimelineStepInput[];
  images: CaseStudyImageInput[];
  sortOrder: number;
  isActive: boolean;
};

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const response = await fetch(`${API_BASE_URL}/admin/categories`, {
    credentials: "include",
    cache: "no-store",
  });
  const body = await parseJson<{ categories?: AdminCategory[] } & ApiError>(response);
  if (!response.ok) {
    throw new Error(body.error?.message || "Failed to fetch categories.");
  }
  return body.categories ?? [];
}

export async function createAdminCategory(input: {
  name: string;
  slug?: string;
  sortOrder?: number;
}): Promise<AdminCategory> {
  const response = await fetch(`${API_BASE_URL}/admin/categories`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const body = await parseJson<{ category?: AdminCategory } & ApiError>(response);
  if (!response.ok || !body.category) {
    throw new Error(body.error?.message || "Failed to create category.");
  }
  return body.category;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const body = await parseJson<ApiError>(response);
  if (!response.ok) {
    if (body.error?.code === "category_in_use" && body.error.details?.usedBy?.length) {
      const labels = body.error.details.usedBy
        .map((item) => item.title || item.slug || item.id || "Unknown case study")
        .join(", ");
      throw new Error(`Cannot delete category. Still assigned to: ${labels}`);
    }
    throw new Error(body.error?.message || "Failed to delete category.");
  }
}

export async function createCaseStudy(payload: CaseStudyWritePayload): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/case-studies`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const body = await parseJson<ApiError>(response);
  if (!response.ok) {
    throw new Error(body.error?.message || "Failed to create case study.");
  }
}

export async function updateCaseStudy(
  id: string,
  payload: CaseStudyWritePayload
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/case-studies/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const body = await parseJson<ApiError>(response);
  if (!response.ok) {
    throw new Error(body.error?.message || "Failed to update case study.");
  }
}

export async function deleteCaseStudy(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/case-studies/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const body = await parseJson<ApiError>(response);
  if (!response.ok) {
    throw new Error(body.error?.message || "Failed to delete case study.");
  }
}

export async function signUpload(input: {
  filename: string;
  contentType: string;
  caseStudySlug?: string;
}): Promise<{ uploadUrl: string; r2Key: string; expiresAt: string }> {
  const response = await fetch(`${API_BASE_URL}/admin/uploads/sign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const body = await parseJson<
    { uploadUrl?: string; r2Key?: string; expiresAt?: string } & ApiError
  >(response);
  if (!response.ok || !body.uploadUrl || !body.r2Key || !body.expiresAt) {
    throw new Error(body.error?.message || "Failed to sign upload URL.");
  }
  return {
    uploadUrl: body.uploadUrl,
    r2Key: body.r2Key,
    expiresAt: body.expiresAt,
  };
}

export async function uploadFileToSignedUrl(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "content-type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error("Failed to upload file.");
  }
}

export async function confirmAsset(input: {
  r2Key: string;
  alt?: string;
  sortOrder?: number;
}): Promise<CaseStudyImageInput> {
  const response = await fetch(`${API_BASE_URL}/admin/assets/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const body = await parseJson<{ image?: CaseStudyImageInput } & ApiError>(response);
  if (!response.ok || !body.image) {
    throw new Error(body.error?.message || "Failed to confirm asset.");
  }
  return body.image;
}

export type PublicCaseStudy = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  categories: string[];
  tags: string[];
  accentColor: string;
  backgroundColor: string;
  images: CaseStudyImageInput[];
  timelineSteps: TimelineStepInput[];
  sortOrder: number;
  isActive: boolean;
};

export async function fetchPublicCaseStudies(): Promise<PublicCaseStudy[]> {
  const response = await fetch(`${API_BASE_URL}/public/case-studies`, {
    cache: "no-store",
  });
  const body = await parseJson<{ caseStudies?: PublicCaseStudy[] } & ApiError>(response);
  if (!response.ok) {
    throw new Error(body.error?.message || "Failed to fetch public case studies.");
  }
  return body.caseStudies ?? [];
}

export async function getSignedReadUrl(r2Key: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/public/assets/sign-read`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ r2Key }),
  });
  const body = await parseJson<{ signedUrl?: string } & ApiError>(response);
  if (!response.ok || !body.signedUrl) {
    throw new Error(body.error?.message || "Failed to sign read URL.");
  }
  return body.signedUrl;
}
