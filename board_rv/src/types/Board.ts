export interface BoardItem {
  id: string;
  writerId: string;
  writerNickname: string;
  content: string;
  createdDate: string;
  createdTime: string;
  deleted?: boolean;
  deletedDate?: string | null;
  deletedTime?: string | null;
}

export interface Post extends BoardItem {
  title: string;
  viewCount: number;
  isNotice: boolean;
  isAnswered?: boolean;
}

export interface Comment extends BoardItem {
  postId: string;
  team?: string;
  isAnswered?: boolean;
}