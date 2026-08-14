import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MAX_QUESTION_LENGTH } from "@/lib/chatPrompt";
import styles from "./PokedexChat.module.css";

interface ChatMessage {
  role: "user" | "dex";
  text: string;
  /** Pokemon que la Pokedex ha consultado para responder. Solo en respuestas. */
  sources?: { id: number; name: string }[];
}

const SUGGESTIONS = [
  "¿Que Pokemon de tipo fuego tiene mejor ataque especial?",
  "Comparame a Charizard y Gyarados",
  "¿Cual es el Pokemon mas pesado de Johto?",
];

const WELCOME_MESSAGE: ChatMessage = {
  role: "dex",
  text: "Pokedex operativa. Preguntame lo que quieras sobre los 251 Pokemon de Kanto y Johto.",
};

function formatDisplayName(value: string) {
  return value.replace(/-/g, " ").toUpperCase();
}

export default function PokedexChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mantiene a la vista el ultimo mensaje segun crece la conversacion.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function askPokedex(rawQuestion: string) {
    const trimmed = rawQuestion.trim();

    if (!trimmed || isLoading) {
      return;
    }

    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setQuestion("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "La Pokedex no ha podido responder.");
        return;
      }

      setMessages((current) => [
        ...current,
        { role: "dex", text: data.answer, sources: data.sources },
      ]);
    } catch {
      // Fallo de red: el endpoint ni siquiera ha llegado a responder.
      setError("Sin conexion con la Pokedex. Comprueba tu red e intentalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={styles.launcher}
        aria-label="Abrir el asistente de la Pokedex"
        title="Preguntar a la Pokedex"
      >
        <Image
          src="/pokedex-chat-icon.png"
          alt=""
          width={194}
          height={256}
          className={styles.launcherImage}
          // El lanzador esta siempre visible: cargarlo en diferido dejaria un
          // hueco vacio en la esquina hasta que el observador se dispare.
          loading="eager"
        />
      </button>
    );
  }

  return (
    <section className={styles.panel} aria-label="Asistente de la Pokedex">
      <header className={styles.header}>
        <div className={styles.headerTitleBlock}>
          <span className={styles.headerDot} aria-hidden="true" />
          <h2 className={styles.headerTitle}>DEX ASSISTANT</h2>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className={styles.closeButton}
          aria-label="Cerrar el asistente"
        >
          X
        </button>
      </header>

      <div className={styles.log} ref={logRef} role="log" aria-live="polite">
        {messages.map((message, index) => (
          <article
            key={index}
            className={message.role === "user" ? styles.userMessage : styles.dexMessage}
          >
            <p className={styles.messageAuthor}>{message.role === "user" ? "TU" : "DEX"}</p>
            <p className={styles.messageText}>{message.text}</p>

            {message.sources && message.sources.length > 0 && (
              <p className={styles.sources}>
                {message.sources.map((source) => (
                  <span key={source.id} className={styles.sourceTag}>
                    #{source.id.toString().padStart(3, "0")} {formatDisplayName(source.name)}
                  </span>
                ))}
              </p>
            )}
          </article>
        ))}

        {isLoading && (
          <article className={styles.dexMessage}>
            <p className={styles.messageAuthor}>DEX</p>
            <p className={styles.loadingText}>CONSULTANDO DATOS</p>
          </article>
        )}

        {error && (
          <article className={styles.errorMessage} role="alert">
            <p className={styles.messageAuthor}>ERROR</p>
            <p className={styles.messageText}>{error}</p>
          </article>
        )}
      </div>

      {messages.length === 1 && !isLoading && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => askPokedex(suggestion)}
              className={styles.suggestionButton}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        className={styles.inputRow}
        onSubmit={(event) => {
          event.preventDefault();
          askPokedex(question);
        }}
      >
        <span className={styles.inputIcon} aria-hidden="true">
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="ESCRIBE TU PREGUNTA..."
          className={styles.input}
          aria-label="Pregunta para la Pokedex"
          disabled={isLoading}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={isLoading || !question.trim()}
        >
          {isLoading ? "..." : "SEND"}
        </button>
      </form>
    </section>
  );
}
