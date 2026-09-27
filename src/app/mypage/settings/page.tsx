import { PageTitle } from "@/components/side-nav";

const sections = [
  { title: "プロフィール", body: "表示名・アイコン（応援コメントに表示されます）" },
  { title: "お届け先", body: "よく使うお届け先を登録できます" },
  { title: "お支払い方法", body: "登録済みのカード" },
  { title: "メール通知", body: "活動報告・お気に入りの終了間近・お知らせ" },
  { title: "退会", body: "支援中のプロジェクトがある場合は退会できません" },
];

export default function SettingsPage() {
  return (
    <>
      <PageTitle>アカウント設定</PageTitle>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {sections.map((s) => (
          <li key={s.title} className="p-4">
            <p className="font-medium">{s.title}</p>
            <p className="text-sm text-stone-500">{s.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
