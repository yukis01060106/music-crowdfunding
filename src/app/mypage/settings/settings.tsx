"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout, newId, resetDemo, updateProfile, updateSettings, useDemo, type Address, type DemoSettings } from "@/lib/demo-store";
import { Avatar } from "@/components/account-button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

const NOTIFY: { key: keyof Pick<DemoSettings, "notifyUpdates" | "notifyEnding" | "notifyFes" | "notifyNews">; label: string; body: string }[] = [
  { key: "notifyUpdates", label: "活動報告", body: "支援・お気に入りのプロジェクトに活動報告が投稿されたとき" },
  { key: "notifyEnding", label: "終了間近", body: "お気に入りのプロジェクトが終了する3日前" },
  { key: "notifyFes", label: "ONE NOTE FES", body: "フェスの続報" },
  { key: "notifyNews", label: "おすすめ・お知らせ", body: "新着プロジェクトやキャンペーン" },
];

const PROVIDER_LABELS = { email: "メールアドレス", google: "Google", x: "X" } as const;

const input = "mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none";

export function Settings() {
  const router = useRouter();
  const { user, settings, backings } = useDemo();
  const [name, setName] = useState(user?.name ?? "");
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const activeBackings = backings.length;

  if (!user) return null;

  function saveAddress(a: Address) {
    const exists = settings.addresses.some((x) => x.id === a.id);
    updateSettings({ addresses: exists ? settings.addresses.map((x) => (x.id === a.id ? a : x)) : [...settings.addresses, a] });
    setEditingAddress(null);
    toast("お届け先を保存しました");
  }

  return (
    <div className="space-y-6">
      <Card title="プロフィール" lead="表示名は、応援コメントや支援者一覧に表示されます。">
        <div className="flex items-center gap-4">
          <Avatar name={name || user.name} size={56} />
          <form
            className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              updateProfile({ name: name.trim() });
              toast("プロフィールを保存しました");
            }}
          >
            <label className="flex-1 text-sm">
              表示名
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={20} className={input} />
            </label>
            <button type="submit" disabled={!name.trim() || name.trim() === user.name} className="bg-ink px-5 py-2 text-sm font-bold text-white hover:bg-brand disabled:bg-stone-300">
              保存
            </button>
          </form>
        </div>
        <p className="mt-4 text-sm text-stone-600">
          ログイン方法：{PROVIDER_LABELS[user.provider]}（{user.email}）
        </p>
      </Card>

      <Card title="メール通知">
        <ul className="divide-y divide-stone-100">
          {NOTIFY.map((n) => (
            <li key={n.key}>
              <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-sm font-medium">{n.label}</span>
                  <span className="block text-xs text-stone-500">{n.body}</span>
                </span>
                <Switch
                  checked={settings[n.key]}
                  onChange={(v) => {
                    updateSettings({ [n.key]: v });
                    toast(v ? `${n.label}の通知をオンにしました` : `${n.label}の通知をオフにしました`);
                  }}
                />
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="お届け先" lead="CD・グッズなどのリターンを支援するときに選べます。">
        {settings.addresses.length > 0 && (
          <ul className="mb-3 space-y-2">
            {settings.addresses.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 border border-stone-200 p-3 text-sm">
                <span>
                  <span className="font-bold">{a.name}</span>
                  <span className="block text-stone-600">
                    〒{a.postalCode} {a.address}
                  </span>
                  <span className="block text-xs text-stone-500">{a.phone}</span>
                </span>
                <span className="flex shrink-0 gap-2 text-xs">
                  <button type="button" onClick={() => setEditingAddress(a)} className="text-brand underline">
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ addresses: settings.addresses.filter((x) => x.id !== a.id) });
                      toast("お届け先を削除しました");
                    }}
                    className="text-stone-500 underline"
                  >
                    削除
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={() => setEditingAddress({ id: newId(), name: user.name, postalCode: "", address: "", phone: "" })} className="w-full border-2 border-dashed border-stone-300 py-2.5 text-sm text-stone-600 hover:border-brand hover:text-brand">
          ＋ お届け先を追加
        </button>
      </Card>

      <Card title="お支払い方法" lead="カード情報は決済会社（Stripe）が管理し、OTOFUNDには保存されません。">
        {/* TODO: Stripe の Customer Portal / SetupIntent で登録・変更する */}
        <div className="flex items-center justify-between gap-3 border border-stone-200 p-3 text-sm">
          <span className="flex items-center gap-3">
            <span className="bg-ink px-2 py-1 font-en text-[10px] font-black text-white">VISA</span>
            •••• 4242（有効期限 12/28）
          </span>
          <span className="text-xs text-stone-500">いつもの支払い方法</span>
        </div>
      </Card>

      <Card title="ログアウト・退会">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              logout();
              toast("ログアウトしました");
              router.push("/");
            }}
            className="border border-stone-300 px-5 py-2.5 text-sm hover:bg-stone-100"
          >
            ログアウト
          </button>
          <button type="button" onClick={() => setConfirmLeave(true)} className="px-5 py-2.5 text-sm text-rose-600 underline">
            退会する
          </button>
        </div>
      </Card>

      <AddressDialog address={editingAddress} onClose={() => setEditingAddress(null)} onSave={saveAddress} />
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => {
          resetDemo();
          toast("退会しました。ご利用ありがとうございました");
          router.push("/");
        }}
        title="退会しますか？"
        body={
          <>
            <p>支援の履歴、メンバーシップ、お気に入り、メッセージがすべて削除され、元に戻せません。</p>
            {activeBackings > 0 && <p className="mt-2 font-bold text-rose-600">お届け前のリターンがある場合は、届いてから退会してください（デモでは退会できます）。</p>}
          </>
        }
        confirmLabel="退会する"
        danger
      />
    </div>
  );
}

function Card({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section className="border border-stone-200 bg-white p-5">
      <h2 className="font-bold">{title}</h2>
      {lead && <p className="mt-1 text-xs text-stone-500">{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-brand" : "bg-stone-300"}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-6" : "left-1"}`} />
      <span className="pointer-events-none absolute -inset-1 rounded-full ring-brand peer-focus-visible:ring-2" />
    </span>
  );
}

const ADDRESS_ERRORS: Record<"name" | "postalCode" | "address" | "phone", (v: string) => string | null> = {
  name: (v) => (v.trim() ? null : "お名前を入力してください"),
  postalCode: (v) => (/^\d{3}-?\d{4}$/.test(v.trim()) ? null : "郵便番号は7桁の数字で入力してください"),
  address: (v) => (v.trim() ? null : "住所を入力してください"),
  phone: (v) => (/^0\d{9,10}$/.test(v.replace(/-/g, "").trim()) ? null : "電話番号を正しく入力してください"),
};

function AddressDialog({ address, onClose, onSave }: { address: Address | null; onClose: () => void; onSave: (a: Address) => void }) {
  const [draft, setDraft] = useState<Address | null>(address);
  const [showErrors, setShowErrors] = useState(false);
  // 開くたびに編集内容を入れ直す
  const [lastId, setLastId] = useState(address?.id);
  if (address?.id !== lastId) {
    setLastId(address?.id);
    setDraft(address);
    setShowErrors(false);
  }
  if (!draft) return null;

  const errors = (Object.keys(ADDRESS_ERRORS) as (keyof typeof ADDRESS_ERRORS)[]).map((k) => [k, ADDRESS_ERRORS[k](draft[k])] as const);
  const field = (key: keyof typeof ADDRESS_ERRORS, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const error = showErrors ? errors.find(([k]) => k === key)?.[1] : null;
    return (
      <label className="block text-sm">
        {label}
        <input value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} aria-invalid={Boolean(error)} className={`${input} ${error ? "border-rose-500" : ""}`} {...props} />
        {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
      </label>
    );
  };

  return (
    <Dialog open onClose={onClose} title="お届け先">
      <form
        className="space-y-3"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (errors.some(([, err]) => err)) {
            setShowErrors(true);
            return;
          }
          onSave(draft);
        }}
      >
        {field("name", "お名前", { autoComplete: "name" })}
        {field("postalCode", "郵便番号", { autoComplete: "postal-code", inputMode: "numeric", placeholder: "150-0001" })}
        {field("address", "住所", { autoComplete: "street-address" })}
        {field("phone", "電話番号", { autoComplete: "tel", type: "tel", placeholder: "09012345678" })}
        <button type="submit" className="mt-2 w-full bg-brand py-3 font-bold text-white hover:bg-brand-dark">
          保存する
        </button>
      </form>
    </Dialog>
  );
}
