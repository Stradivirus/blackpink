export interface Admin {
  id: string;
  userId: string;
  nickname: string;
  team: "관리팀" | "보안팀" | "사업팀" | "개발팀";
}