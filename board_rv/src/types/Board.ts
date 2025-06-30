// 게시판 기본 항목 타입
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

// 게시글 타입
export interface Post extends BoardItem {
  title: string;
  viewCount: number;
  isNotice: boolean;
  isAnswered?: boolean;
}

// 댓글 타입
export interface Comment extends BoardItem {
  postId: string;
  team?: string;
  isAnswered?: boolean;
}