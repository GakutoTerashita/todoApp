import { Prisma } from "@prisma/client";

const usersWithId = Prisma.validator<Prisma.usersDefaultArgs>()({
    select: { id: true },
});

const todoItems = Prisma.validator<Prisma.todo_itemsDefaultArgs>()({});
const todoItemsWithUsers = Prisma.validator<Prisma.todo_itemsDefaultArgs>()({
    include: {
        users: usersWithId,
    },
});

export type TodoListItem = Prisma.todo_itemsGetPayload<typeof todoItems>;
export type TodoListItemWithUser = Prisma.todo_itemsGetPayload<typeof todoItemsWithUsers>;

const hoge = (): Prisma.usersSelect => {
    return {
        id: true,
        hashed_password: false,
        created_at: false,
    };
}