export interface Comment {
    id: string;
    postId: string;
    writerId: string;
    writerNickname: string;
    content: string;
    createdDate: string;
    createdTime: string;
    deleted?: boolean;
    deletedDate?: string | null;
    deletedTime?: string | null;
}