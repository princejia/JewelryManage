import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const BUCKET = "product-images";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES];
const MAX_SIZE = 10 * 1024 * 1024;

/** 确保存储桶存在，不存在则创建为公开桶 */
async function ensureBucket(
  supabase: ReturnType<typeof createServerClient>
): Promise<string | null> {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (data) {
    // 桶已存在：放宽允许的文件类型（兼容旧的仅图片限制）
    await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
    return null;
  }
  // getBucket 失败通常是桶不存在，尝试创建
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_SIZE,
    allowedMimeTypes: ALLOWED_TYPES,
  });
  // 并发情况下可能已被其它请求创建，忽略“已存在”错误
  if (createError && !/already exists/i.test(createError.message)) {
    return createError.message || error?.message || "无法创建存储桶";
  }
  return null;
}

export async function POST(req: NextRequest) {
  // 环境变量校验，便于线上排查
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          "服务端未配置 Supabase 密钥（SUPABASE_SERVICE_ROLE_KEY），请在部署平台环境变量中设置",
      },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "未提供文件" }, { status: 400 });
  }

  // 限制：图片或文档，最大 10MB
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "只支持 JPG/PNG/WEBP 图片或 PDF/Word 文档" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "文件大小不能超过 10MB" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const ext = file.name.split(".").pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  async function upload() {
    return supabase.storage
      .from(BUCKET)
      .upload(filename, file as File, { contentType: (file as File).type });
  }

  let { error } = await upload();

  // 桶不存在或类型受限时自动创建/放宽后重试一次
  if (
    error &&
    /bucket|not found|does not exist|mime|not supported|allowed/i.test(
      error.message
    )
  ) {
    const bucketError = await ensureBucket(supabase);
    if (bucketError) {
      return NextResponse.json(
        { error: `存储桶不可用：${bucketError}` },
        { status: 500 }
      );
    }
    ({ error } = await upload());
  }

  if (error) {
    return NextResponse.json(
      { error: `上传失败：${error.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl });
}
