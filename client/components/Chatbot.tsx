import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const symptomDiseases: Record<string, string[]> = {
  fever: [
    "Based on fever symptoms, possible traditional medicine diagnoses could include: Pitta Dosha Imbalance (excess digestive fire), Ama Accumulation (toxin buildup), or Vata-Pitta Imbalance.",
    "Fever may indicate: Fever/Infection (ICD-11: CA90.0), Influenza (ICD-11: CA50.1), or Common Cold (ICD-11: CA15.8). Please consult with a healthcare provider for proper diagnosis.",
  ],
  cough: [
    "A cough could suggest: Kapha Dosha Imbalance in Ayurveda, affecting the respiratory system. May correspond to ICD-11 codes like Acute Bronchitis (DA90.0) or Upper Respiratory Infection (DA80.3).",
    "Persistent cough may indicate: Cough (ICD-11: MD06.1), Bronchitis (ICD-11: DA90), or Asthma (ICD-11: DA95). Seek medical advice for proper evaluation.",
  ],
  headache: [
    "Headache in traditional medicine often indicates: Vata Dosha disturbance, Pitta aggravation, or blocked channels. In modern medicine: Migraine (ICD-11: 8A81.0) or Tension Headache (ICD-11: 8A80.0).",
    "Consider: Sinusitis (ICD-11: DA92), Cluster Headache (ICD-11: 8A82.0), or other primary headache disorders. Professional medical evaluation is recommended.",
  ],
  fatigue: [
    "Fatigue may suggest: Vata Dosha imbalance, Kapha excess, or Ama accumulation causing weakness. Modern equivalent: Fatigue/Asthenia (ICD-11: MG30.0) or Anemia (ICD-11: BA00-BA99).",
    "Could indicate: General Fatigue (ICD-11: MG30.0), Chronic Fatigue Syndrome (ICD-11: 8E49.1), or Anemia. Consult healthcare provider for proper diagnosis and treatment.",
  ],
  pain: [
    "Pain symptoms suggest multiple possibilities: Vata Dosha aggravation, Pitta imbalance, or blocked energy channels in traditional medicine. ICD-11: Pain (MG30.0) or condition-specific pain codes.",
    "Pain could indicate: Acute Pain (ICD-11: MG30.01), Chronic Pain (ICD-11: MG30.02), or specific condition pain. Proper evaluation needed for accurate diagnosis.",
  ],
  nausea: [
    "Nausea often indicates: Pitta Dosha aggravation, Kapha excess, or digestive issues. ICD-11 equivalent: Nausea/Vomiting (DA90.2) or Gastroenteritis (DA93.9).",
    "Could be: Gastric disorder (ICD-11: DA92), Hepatic condition, or medication side effect. Professional medical evaluation is important.",
  ],
  dizziness: [
    "Dizziness may suggest: Vata Dosha imbalance, low blood circulation, or inner ear issues. ICD-11: Vertigo (8A84.0) or Dizziness (8A84.1).",
    "Could indicate: Vestibular disorder (ICD-11: AB85-AB87), Low Blood Pressure (ICD-11: BA00.1), or Anemia. Consult healthcare provider for proper diagnosis.",
  ],
  default: [
    "How can I help you today?",
    "I'm here to assist you with Care Sync. What would you like to know?",
    "Feel free to ask me about patients, code mapping, or any other features.",
  ],
  patient: [
    "You can create a new patient by clicking the 'Create Patient' button on the Patients page.",
    "Patients can have multiple diagnoses attached to them. Each diagnosis is mapped to an ICD-11 code.",
    "You can view detailed patient information by clicking the 'View' button on any patient record.",
  ],
  mapping: [
    "Code mapping allows you to map NAMASTE codes to ICD-11 codes.",
    "Each mapping has a confidence score that indicates how accurate the mapping is.",
    "You can search for codes using the search bar with code numbers or descriptions.",
  ],
  export: [
    "You can export patient data in FHIR JSON format from the patient details page.",
    "FHIR export includes all patient information and diagnoses in the standardized format.",
    "The exported file can be used with other FHIR-compatible systems.",
  ],
  admin: [
    "The admin dashboard allows you to manage codes, mappings, and users.",
    "You can upload new NAMASTE code lists and view mapping coverage statistics.",
    "User management includes creating accounts and managing user roles.",
  ],
};

function getRandomResponse(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase();
  let responseList = symptomDiseases.default;

  // Check for symptom keywords
  if (lowerKeyword.includes("fever")) {
    responseList = symptomDiseases.fever;
  } else if (lowerKeyword.includes("cough")) {
    responseList = symptomDiseases.cough;
  } else if (lowerKeyword.includes("headache") || lowerKeyword.includes("head ache")) {
    responseList = symptomDiseases.headache;
  } else if (lowerKeyword.includes("fatigue") || lowerKeyword.includes("tired")) {
    responseList = symptomDiseases.fatigue;
  } else if (lowerKeyword.includes("pain")) {
    responseList = symptomDiseases.pain;
  } else if (lowerKeyword.includes("nausea")) {
    responseList = symptomDiseases.nausea;
  } else if (lowerKeyword.includes("dizzy") || lowerKeyword.includes("dizziness")) {
    responseList = symptomDiseases.dizziness;
  } else if (lowerKeyword.includes("patient")) {
    responseList = symptomDiseases.patient;
  } else if (lowerKeyword.includes("mapping") || lowerKeyword.includes("map")) {
    responseList = symptomDiseases.mapping;
  } else if (lowerKeyword.includes("export") || lowerKeyword.includes("download")) {
    responseList = symptomDiseases.export;
  } else if (lowerKeyword.includes("admin")) {
    responseList = symptomDiseases.admin;
  }

  return responseList[Math.floor(Math.random() * responseList.length)];
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Welcome to Care Sync! I'm your assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate bot response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: `msg-${Date.now()}-bot`,
        text: getRandomResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-secondary text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
        title="Open Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col rounded-lg shadow-xl border border-border bg-background z-50 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-white rounded-t-lg">
        <h3 className="font-semibold">Care Sync Assistant</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-primary/80 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-xs px-4 py-2 rounded-lg text-sm",
                message.sender === "user"
                  ? "bg-primary text-white rounded-br-none"
                  : "bg-muted text-foreground rounded-bl-none"
              )}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none text-sm">
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></span>
                <span
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Type your question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="sm"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ask me about patients, code mapping, exports, or admin features!
        </p>
      </div>
    </div>
  );
}
