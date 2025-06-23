export interface Post {
    deletedTime: string | null;
    deletedDate: string | null;
    id: string;
    title: string;
    writerId: string;
    writerNickname: string;
    content: string;
    createdDate: string;
    createdTime: string;
    viewCount: number;
    isNotice: boolean; // 추가
    isAnswered?: boolean; // 답변완료 여부 추가
}