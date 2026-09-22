import { useState } from "react";
import { SendIcon } from "../icons";

export type LogRole = "you" | "agent" | "tool" | "err";
export interface LogEntry {
  role: LogRole;
  text: string;
}

const PREFIX: Record<LogRole, string> = { you: "Tú", agent: "Agente", tool: "Tool", err: "Error" };

interface Props {
  log: LogEntry[];
  disabled: boolean;
  sending: boolean;
  placeholder: string;
  onSend: (message: string) => void;
}

export default function ChatPanel({ log, disabled, sending, placeholder, onSend }: Props): JSX.Element {
  const [value, setValue] = useState("");

  const submit = () => {
    const message = value.trim();
    if (!message || disabled || sending) return;
    onSend(message);
    setValue("");
  };

  return (
    <>
      <div className="log">
        {log.map((entry, i) => (
          <div key={i} className={entry.role}>
            {PREFIX[entry.role]}: {entry.text}
          </div>
        ))}
      </div>
      <div className="chat-row">
        <input
          className="chat-input"
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button className="chat-send" disabled={disabled || sending} onClick={submit}>
          <SendIcon />
          Enviar
        </button>
      </div>
    </>
  );
}
