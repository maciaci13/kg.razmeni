import type { PlaygroundSnapshot } from "@/lib/playground";

export type AppTab = "home" | "requests" | "matches" | "chats" | "profile";
export type Participant = PlaygroundSnapshot["participants"][number];
export type Chat = PlaygroundSnapshot["chats"][number];

export const placeTypes = ["Общ ред", "СОП", "Хронични заболявания", "Социални критерии"];

export const statusOptions = [
  ["not_started", "Още не съм започнал/а"],
  ["checking_procedure", "Проверявам процедурата"],
  ["contacted_kindergarten", "Свързал/а съм се със заведение"],
  ["can_continue", "Мога да продължа"],
  ["cannot_continue", "Не мога да продължа"],
  ["dropped_out", "Отказвам се"]
] as const;

export const steps = [
  { title: "Потвърждение", helper: "Всички страни приемат потенциалното съвпадение." },
  { title: "Отключена координация", helper: "Чатовете се отварят и започва уточняване." },
  { title: "Проверка на процедурата", helper: "Всеки проверява официалния ред и контакт със заведение." },
  { title: "Готовност за действие", helper: "Всички маркират дали могат да продължат." },
  { title: "Официални действия", helper: "Следват се само официалните административни стъпки." },
  { title: "Резултат", helper: "Цикълът се отбелязва като приключен или отпаднал." }
];

export const rejectedStep = {
  title: "Отказано",
  helper: "Процесът е прекратен. Веригата и чатовете са затворени."
};

export const participantColors = ["bg-lime", "bg-[#DED1E8]", "bg-[#ECECC7]", "bg-[#D2E4E2]"];
