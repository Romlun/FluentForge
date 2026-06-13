import Anthropic from "https://esm.sh/@anthropic-ai/sdk";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WordContent {
  word: string;
  part_of_speech: string;
  phonetic: string;
  translation: string;
  definition: string;
  example_sentence: string;
}

interface SeedResponse {
  processed: number;
  skipped: number;
  failed: number;
  nextOffset: number;
  done: boolean;
}

async function fetchWordList(): Promise<string[]> {
  const url =
    "https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt";
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  return lines.filter((word) => word.trim().length >= 1);
}

async function getExistingWords(
  supabase: ReturnType<typeof createClient>,
  words: string[]
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("words")
    .select("word")
    .in("word", words);

  if (error) {
    console.error("Error fetching existing words:", error);
    return new Set();
  }

  return new Set((data || []).map((row: { word: string }) => row.word));
}

async function generateContentWithAnthropic(
  client: InstanceType<typeof Anthropic>,
  words: string[]
): Promise<WordContent[]> {
  const systemPrompt =
    "You generate English learning content for Russian speakers. Return ONLY a valid JSON array. No markdown, no explanation, no code fences.";

  const userPrompt = `Generate content for these English words. Return a JSON array where each element has: word, part_of_speech (noun/verb/adjective/adverb/preposition/conjunction/pronoun/interjection), phonetic (IPA), translation (Russian Cyrillic primary meaning), definition (English max 15 words), example_sentence (natural English sentence). Words: [${words.map((w) => `"${w}"`).join(", ")}]`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content in response");
    }

    const content = JSON.parse(textContent.text);
    return Array.isArray(content) ? content : [];
  } catch (error) {
    console.error("Error generating content with Anthropic:", error);
    return [];
  }
}

async function upsertWords(
  supabase: ReturnType<typeof createClient>,
  wordContents: WordContent[],
  frequencyStartRank: number
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < wordContents.length; i++) {
    const content = wordContents[i];
    const frequencyRank = frequencyStartRank + i;

    try {
      const { error } = await supabase.from("words").upsert(
        {
          word: content.word.toLowerCase(),
          part_of_speech: content.part_of_speech,
          phonetic: content.phonetic,
          translation: content.translation,
          definition: content.definition,
          example_sentence: content.example_sentence,
          frequency_rank: frequencyRank,
        },
        {
          onConflict: "word",
        }
      );

      if (error) {
        console.error(`Error upserting word "${content.word}":`, error);
        failed++;
      } else {
        succeeded++;
      }
    } catch (error) {
      console.error(`Exception upserting word "${content.word}":`, error);
      failed++;
    }
  }

  return { succeeded, failed };
}

async function seedWords(
  request: Request
): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey || !anthropicApiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required environment variables",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    let requestBody = { offset: 0, batchSize: 300 };
    try {
      const body = await request.json();
      requestBody = { ...requestBody, ...body };
    } catch {
    }

    const offset = requestBody.offset;
    const batchSize = requestBody.batchSize;

    const allWords = await fetchWordList();

    if (offset >= allWords.length) {
      const response: SeedResponse = {
        processed: 0,
        skipped: 0,
        failed: 0,
        nextOffset: offset,
        done: true,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const chunk = allWords.slice(offset, offset + batchSize);
    const existingWords = await getExistingWords(supabase, chunk);
    const newWords = chunk.filter((word) => !existingWords.has(word));

    let processed = 0;
    let failed = 0;

    const subBatchSize = 10;
    for (let i = 0; i < newWords.length; i += subBatchSize) {
      const subBatch = newWords.slice(i, i + subBatchSize);
      const generatedContent = await generateContentWithAnthropic(
        anthropic,
        subBatch
      );

      const frequencyRankBase = allWords.indexOf(subBatch[0]) + 1;
      const { succeeded, failed: subFailed } = await upsertWords(
        supabase,
        generatedContent,
        frequencyRankBase
      );

      processed += succeeded;
      failed += subFailed;

      if (i + subBatchSize < newWords.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const nextOffset = offset + batchSize;
    const done = nextOffset >= allWords.length;

    const response: SeedResponse = {
      processed,
      skipped: existingWords.size,
      failed,
      nextOffset,
      done,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in seedWords:", error);
    return new Response(
      JSON.stringify({
        processed: 0,
        skipped: 0,
        failed: 0,
        nextOffset: 0,
        done: false,
        error: String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

Deno.serve(seedWords);
