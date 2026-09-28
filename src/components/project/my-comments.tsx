"use client";

import { formatDate, formatYen } from "@/lib/format";
import { useDemo } from "@/lib/demo-store";

/** 自分が支援のときに書いた応援コメント。TODO: 本番ではコメントもサーバーに保存し、一覧に混ぜて返す */
export function MyComments({ projectSlug }: { projectSlug: string }) {
  const { user, backings } = useDemo();
  const mine = backings.filter((b) => b.projectSlug === projectSlug && b.comment);
  if (!user || mine.length === 0) return null;
  return (
    <>
      {mine.map((b) => (
        <li key={b.id} className="animate-rise border-2 border-brand bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">
              {user.name}
              <span className="ml-2 bg-brand-soft px-1.5 py-0.5 text-[11px] text-brand">あなた</span>
            </span>
            <span className="text-stone-500">
              {formatYen(b.amount)}で支援・{formatDate(b.backedAt)}
            </span>
          </div>
          <p className="mt-2 text-stone-700">{b.comment}</p>
        </li>
      ))}
    </>
  );
}
