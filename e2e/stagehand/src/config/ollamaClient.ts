/**
 * Cliente Ollama (OpenAI-compatible) para Stagehand.
 * Modelo: qwen3.5:4b ejecutándose en Ollama local (http://localhost:11434)
 * 
 * Implementa la interfaz generate() que Stagehand espera de cualquier modelo LLM.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL    = process.env.OLLAMA_MODEL ?? 'qwen3.5:4b';

function sanitizeElementId(raw: any): string {
  if (typeof raw === 'string') {
    const match = raw.match(/\d+-\d+/);
    if (match) return match[0];
    const num = raw.replace(/\D/g, '');
    if (num) return `0-${num}`;
  } else if (typeof raw === 'number') {
    return `0-${raw}`;
  }
  return '0-1';
}

function sanitizeStructuredContent(content: any): any {
  if (!content || typeof content !== 'object') return content;

  if (Array.isArray(content) && content.length > 0) {
    content = content[0];
  }

  // Caso 1: ActInferenceSchema
  const isActLike =
    ('action' in content) ||
    ('elementId' in content && ('method' in content || 'description' in content || 'elementDescription' in content));

  if (isActLike) {
    let action = content.action;

    // Si el LLM devolvió los campos de acción en la raíz
    if (!action && ('elementId' in content || 'method' in content)) {
      action = {
        elementId:   content.elementId,
        description: content.description || content.elementDescription,
        method:      content.method,
        arguments:   content.arguments || content.argument,
      };
    }

    if (action && typeof action === 'object') {
      const elementId = sanitizeElementId(action.elementId);
      const description = String(action.description || action.elementDescription || 'interactive element');

      const validMethods = [
        'click', 'fill', 'type', 'press', 'scrollTo',
        'nextChunk', 'prevChunk', 'selectOptionFromDropdown',
        'hover', 'doubleClick', 'dragAndDrop'
      ];
      let method = String(action.method || 'click').toLowerCase();
      if (!validMethods.includes(method)) {
        if (method.includes('click')) method = 'click';
        else if (method.includes('type')) method = 'type';
        else if (method.includes('fill')) method = 'fill';
        else method = 'click';
      }

      const rawArgs = action.arguments ?? action.argument ?? [];
      const args = Array.isArray(rawArgs) ? rawArgs.map(String) : [String(rawArgs)];

      action = {
        elementId,
        description,
        method,
        arguments: args,
      };
    } else if (action === null) {
      action = null;
    } else {
      action = null;
    }

    const twoStepRaw = content.twoStep ?? content.action?.twoStep;
    const twoStep = typeof twoStepRaw === 'boolean' ? twoStepRaw : (twoStepRaw === 'true');

    return {
      action,
      twoStep,
    };
  }

  // Caso 2: ObservationSchema
  if ('elements' in content && Array.isArray(content.elements)) {
    return {
      elements: content.elements.map((el: any) => {
        const elementId = sanitizeElementId(el.elementId);
        const description = String(el.description || el.elementDescription || 'observable element');
        const method = String(el.method || 'click');
        const rawArgs = el.arguments ?? el.argument ?? [];
        const args = Array.isArray(rawArgs) ? rawArgs.map(String) : [String(rawArgs)];
        return { elementId, description, method, arguments: args };
      }),
    };
  }

  return content;
}

export function createOllamaClient() {
  console.log(`\x1b[35m[Ollama]\x1b[0m Cliente configurado → ${OLLAMA_BASE_URL} · modelo: \x1b[33m${OLLAMA_MODEL}\x1b[0m`);

  return {
    generate: async (params: any) => {
      // ── Construir mensajes OpenAI-compatible ──────────────────────────────
      const messages: Array<{ role: string; content: any }> = [];

      if (params.systemPrompt) {
        messages.push({ role: 'system', content: params.systemPrompt });
      }

      for (const msg of params.messages ?? []) {
        const role = msg.role === 'assistant' ? 'assistant' : 'user';

        if (typeof msg.content === 'string') {
          messages.push({ role, content: msg.content });
        } else if (Array.isArray(msg.content)) {
          const textParts = msg.content
            .filter((p: any) => p.type === 'text' || typeof p === 'string')
            .map((p: any) => (typeof p === 'string' ? p : p.text ?? ''))
            .join('\n');
          messages.push({ role, content: textParts || JSON.stringify(msg.content) });
        } else if (msg.content && typeof msg.content === 'object') {
          messages.push({ role, content: msg.content.text ?? JSON.stringify(msg.content) });
        }
      }

      // ── Construir cuerpo de la petición ──────────────────────────────────
      const requestBody: any = {
        model:    OLLAMA_MODEL,
        messages,
        stream:   false,
        options:  { temperature: 0.1, num_predict: 512 },
      };

      if (params.responseFormat) {
        requestBody.format = params.responseFormat.schema ?? 'json';
      }

      // ── Llamada HTTP con timeout extendido (3 minutos) ───────────────────
      const url = `${OLLAMA_BASE_URL}/v1/chat/completions`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      let response: Response;
      try {
        response = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(requestBody),
          signal:  controller.signal,
        });
      } catch (err: any) {
        clearTimeout(timeoutId);
        throw new Error(`[Ollama] Error de red al conectar con ${url}: ${err.message}`);
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[Ollama] HTTP ${response.status}: ${errorText.slice(0, 300)}`);
      }

      const data: any = await response.json();
      const contentText: string = data.choices?.[0]?.message?.content ?? '';

      const usage = {
        inputTokens:  data.usage?.prompt_tokens    ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        totalTokens:  data.usage?.total_tokens      ?? 0,
      };

      // ── Respuesta estructurada con sanitización estricta ─────────────────
      if (params.responseFormat) {
        let structuredContent: any = {};
        try {
          structuredContent = JSON.parse(contentText);
        } catch {
          const cleaned = contentText
            .replace(/```json\s*/gi, '')
            .replace(/```/g, '')
            .trim();
          try {
            structuredContent = JSON.parse(cleaned);
          } catch {
            structuredContent = { raw: contentText };
          }
        }

        const sanitized = sanitizeStructuredContent(structuredContent);

        return {
          role:             'assistant' as const,
          content:          [{ type: 'text' as const, text: contentText }],
          outputFormat:     'json_schema' as const,
          structuredContent: sanitized,
          usage,
        };
      }

      // ── Respuesta de texto plano ──────────────────────────────────────────
      return {
        role:         'assistant' as const,
        content:      [{ type: 'text' as const, text: contentText }],
        outputFormat: 'text' as const,
        usage,
      };
    },
  };
}
