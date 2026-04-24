import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = "google/gemini-3.1-flash-image-preview";

const imageRequestSchema = z.object({
  prompt: z.string().min(3, "La description de l’image est trop courte.").max(4000, "La description de l’image est trop longue."),
  images: z.array(z.string().min(10)).default([]),
  model: z.enum(["google/gemini-2.5-flash-image", "google/gemini-3.1-flash-image-preview"]).optional(),
});

type OpenRouterContentPart =
  | string
  | { type?: string; text?: string; image_url?: { url?: string }; url?: string };

function extraireImageDepuisReponse(payload: unknown) {
  const data = payload as {
    choices?: Array<{
      message?: {
        images?: Array<{ image_url?: { url?: string }; url?: string }>;
        content?: OpenRouterContentPart | OpenRouterContentPart[];
      };
    }>;
  };
  const message = data.choices?.[0]?.message;
  const imageDepuisImages = message?.images?.find((image) => image.image_url?.url || image.url);
  if (imageDepuisImages?.image_url?.url || imageDepuisImages?.url) return imageDepuisImages.image_url?.url || imageDepuisImages.url;

  const contenu = Array.isArray(message?.content) ? message.content : [message?.content].filter(Boolean);
  const imageDepuisContenu = contenu.find((part): part is Exclude<OpenRouterContentPart, string> => Boolean(part && typeof part !== "string" && (part.image_url?.url || part.url)));
  if (typeof imageDepuisContenu !== "string") return imageDepuisContenu?.image_url?.url || imageDepuisContenu?.url;

  return undefined;
}

export const genererImageOpenRouter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => imageRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("La clé OpenRouter n’est pas configurée.");

    const reponse = await fetch(`${process.env.OPENROUTER_BASE_URL || OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "SCM SARL",
      },
      body: JSON.stringify({
        model: data.model || process.env.OPENROUTER_MODEL || OPENROUTER_MODEL,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: data.images.length
              ? [
                  { type: "text", text: `${data.prompt}\n\nGénère une image en 1K, nette et exploitable dans un document professionnel.` },
                  ...data.images.map((url) => ({ type: "image_url", image_url: { url } })),
                ]
              : `${data.prompt}\n\nGénère une image carrée en 1K, format 1024x1024, nette et exploitable dans un document professionnel.`,
          },
        ],
      }),
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      throw new Error(`OpenRouter a refusé la génération d’image (${reponse.status}) : ${detail}`);
    }

    const payload = await reponse.json();
    const imageUrl = extraireImageDepuisReponse(payload);
    if (!imageUrl) throw new Error("OpenRouter n’a retourné aucune image exploitable.");

    return { imageUrl, model: data.model || process.env.OPENROUTER_MODEL || OPENROUTER_MODEL, size: "1024x1024" };
  });