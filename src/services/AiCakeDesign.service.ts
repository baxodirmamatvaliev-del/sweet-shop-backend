import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import Errors, { HttpCode, Message } from "../libs/Errors";
import AiCakeDesignModel from "../schema/AiCakeDesign.model";
import AiDesignQuotaModel from "../schema/AiDesignQuota.model";

const DAILY_LIMIT = 3;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

type GeneratedImage = {
  base64: string;
  model: string;
};

export type AiImageGenerator = (prompt: string) => Promise<GeneratedImage>;

const getSeoulDayKey = (now = new Date()): string =>
  new Date(now.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10);

const generateWithOpenAi: AiImageGenerator = async (prompt) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Errors(HttpCode.SERVICE_UNAVAILABLE, Message.AI_DESIGN_UNAVAILABLE);
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-6-astra";
  const imageModel = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2.5-flare";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Create one realistic, professionally photographed celebration cake concept on a clean bakery studio background. Keep the cake physically buildable. Do not add watermarks or unrelated text.",
            },
          ],
        },
        { role: "user", content: [{ type: "input_text", text: prompt }] },
      ],
      tools: [
        {
          type: "image_generation",
          model: imageModel,
          quality: "low",
          size: "1024x1024",
          output_format: "png",
          background: "opaque",
          action: "generate",
        },
      ],
      tool_choice: { type: "image_generation" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI image generation failed:", response.status, errorText.slice(0, 300));
    throw new Errors(HttpCode.BAD_GATEWAY, Message.AI_DESIGN_UNAVAILABLE);
  }

  const result = (await response.json()) as {
    output?: Array<{ type?: string; result?: string }>;
  };
  const base64 = result.output?.find(
    (item) => item.type === "image_generation_call" && item.result,
  )?.result;
  if (!base64) {
    throw new Errors(HttpCode.BAD_GATEWAY, Message.AI_DESIGN_UNAVAILABLE);
  }

  return { base64, model: imageModel };
};

class AiCakeDesignService {
  constructor(private readonly imageGenerator: AiImageGenerator = generateWithOpenAi) {}

  public async getHistory(memberId: string, now = new Date()): Promise<any> {
    this.requireMemberId(memberId);
    const [designs, quota] = await Promise.all([
      AiCakeDesignModel.find({ memberId })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean()
        .exec(),
      AiDesignQuotaModel.findOne({
        memberId,
        dayKey: getSeoulDayKey(now),
      })
        .lean()
        .exec(),
    ]);

    return {
      designs,
      remaining: Math.max(0, DAILY_LIMIT - (quota?.used ?? 0)),
      dailyLimit: DAILY_LIMIT,
    };
  }

  public async generate(
    memberId: string,
    promptInput: unknown,
    now = new Date(),
  ): Promise<any> {
    this.requireMemberId(memberId);
    if (typeof promptInput !== "string") this.invalidPrompt();
    const prompt = promptInput.trim();
    if (prompt.length < 10 || prompt.length > 500) this.invalidPrompt();
    if (!process.env.OPENAI_API_KEY && this.imageGenerator === generateWithOpenAi) {
      throw new Errors(HttpCode.SERVICE_UNAVAILABLE, Message.AI_DESIGN_UNAVAILABLE);
    }

    const used = await this.claimQuota(memberId, getSeoulDayKey(now));
    const generated = await this.imageGenerator(prompt);
    const fileName = `${memberId}-${randomUUID()}.png`;
    const directory = path.resolve(process.cwd(), "public", "uploads", "ai-designs");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, fileName), Buffer.from(generated.base64, "base64"), {
      mode: 0o600,
    });

    const design = await AiCakeDesignModel.create({
      memberId,
      prompt,
      imageUrl: `/uploads/ai-designs/${fileName}`,
      model: generated.model,
    });

    return {
      design,
      remaining: Math.max(0, DAILY_LIMIT - used),
      dailyLimit: DAILY_LIMIT,
    };
  }

  public async getOwnedDesign(memberId: string, designId: string): Promise<any> {
    if (!mongoose.isValidObjectId(memberId) || !mongoose.isValidObjectId(designId)) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.AI_DESIGN_NOT_FOUND);
    }
    const design = await AiCakeDesignModel.findOne({ _id: designId, memberId })
      .lean()
      .exec();
    if (!design) {
      throw new Errors(HttpCode.BAD_REQUEST, Message.AI_DESIGN_NOT_FOUND);
    }
    return design;
  }

  private async claimQuota(memberId: string, dayKey: string): Promise<number> {
    try {
      const quota = await AiDesignQuotaModel.findOneAndUpdate(
        { memberId, dayKey, used: { $lt: DAILY_LIMIT } },
        {
          $inc: { used: 1 },
          $setOnInsert: { memberId, dayKey },
        },
        { new: true, upsert: true, runValidators: true },
      )
        .lean()
        .exec();
      if (!quota) this.limitReached();
      return quota.used;
    } catch (error: any) {
      if (error instanceof Errors) throw error;
      if (error?.code === 11000) this.limitReached();
      throw error;
    }
  }

  private requireMemberId(memberId: string): void {
    if (!mongoose.isValidObjectId(memberId)) {
      throw new Errors(HttpCode.UNAUTHORIZED, Message.NOT_AUTHENTICATED);
    }
  }

  private invalidPrompt(): never {
    throw new Errors(HttpCode.BAD_REQUEST, Message.INVALID_AI_DESIGN_PROMPT);
  }

  private limitReached(): never {
    throw new Errors(HttpCode.TOO_MANY_REQUESTS, Message.AI_DESIGN_LIMIT_REACHED);
  }
}

export default AiCakeDesignService;
